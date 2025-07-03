import { PrismaClient, AssignmentStatus } from '@prisma/client';
import { AssignmentUtils } from './assignments.utils';
import { RoutingService } from '../routing/routing.service';
import { DeliveriesService } from '../deliveries/deliveries.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentResponse,
  AssignmentListResponse,
  AssignmentFilters,
  StartAssignmentDto,
  CompleteAssignmentDto,
  AssignmentSummaryResponse,
  AssignmentValidation,
  AssignmentSummary,
  ValidationResult
} from './assignments.types';

export class AssignmentsService {
  private assignmentUtils: AssignmentUtils;
  private routingService: RoutingService;
  private deliveriesService: DeliveriesService;

  constructor(private prisma: PrismaClient) {
    this.assignmentUtils = new AssignmentUtils(prisma);
    this.routingService = new RoutingService(prisma);
    this.deliveriesService = new DeliveriesService(prisma);
  }

  // Create a new restaurant assignment
  async createAssignment(assignmentData: CreateAssignmentDto): Promise<AssignmentResponse> {
    // Validate the assignment before creating
    const validation = await this.validateAssignment(assignmentData);
    if (!validation.isValid) {
      throw new Error(`Assignment validation failed: ${validation.errors.join(', ')}`);
    }

    const assignment = await this.prisma.restaurantAssignment.create({
      data: {
        driverId: assignmentData.driverId,
        restaurantId: assignmentData.restaurantId,
        assignmentDate: new Date(assignmentData.assignmentDate),
        pickupTime: new Date(`1970-01-01T${assignmentData.pickupTime}:00.000Z`),
        estimatedDeliveries: assignmentData.estimatedDeliveries,
        paymentType: assignmentData.paymentType || 'FIXED',
        paymentRate: assignmentData.paymentRate,
        algorithmScore: assignmentData.algorithmScore || 0,
        notes: assignmentData.notes,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.formatAssignmentResponse(assignment);
  }

  // Get assignments for a specific driver
  async getDriverAssignments(
    driverId: number,
    filters?: AssignmentFilters
  ): Promise<AssignmentListResponse> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      driverId,
    };

    // Apply filters
    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.restaurantId) {
      where.restaurantId = filters.restaurantId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.assignmentDate = {};
      if (filters.startDate) {
        where.assignmentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.assignmentDate.lte = new Date(filters.endDate);
      }
    }

    const [assignments, total] = await Promise.all([
      this.prisma.restaurantAssignment.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          assignmentDate: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.restaurantAssignment.count({ where }),
    ]);

    return {
      assignments: assignments.map(this.formatAssignmentResponse),
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get pending assignments for a driver
  async getPendingAssignments(driverId: number): Promise<AssignmentResponse[]> {
    const assignments = await this.prisma.restaurantAssignment.findMany({
      where: {
        driverId,
        status: AssignmentStatus.PENDING,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        assignmentDate: 'asc',
      },
    });

    return assignments.map(this.formatAssignmentResponse);
  }

  // Get today's assignments for a driver
  async getTodayAssignments(driverId: number): Promise<AssignmentResponse[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignments = await this.prisma.restaurantAssignment.findMany({
      where: {
        driverId,
        assignmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        pickupTime: 'asc',
      },
    });

    return assignments.map(this.formatAssignmentResponse);
  }

  // Get assignment by ID
  async getAssignmentById(assignmentId: string, driverId?: number): Promise<AssignmentResponse | null> {
    const where: any = { id: assignmentId };
    if (driverId) {
      where.driverId = driverId;
    }

    const assignment = await this.prisma.restaurantAssignment.findUnique({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return assignment ? this.formatAssignmentResponse(assignment) : null;
  }

  // Start an assignment (with route calculation and delivery setup)
  async startAssignment(assignmentId: string, driverId: number): Promise<AssignmentResponse> {
    const assignment = await this.prisma.restaurantAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.driverId !== driverId) {
      throw new Error('Assignment does not belong to this driver');
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new Error(`Cannot start assignment with status: ${assignment.status}`);
    }

    // Update assignment status to STARTED
    const updatedAssignment = await this.prisma.restaurantAssignment.update({
      where: { id: assignmentId },
      data: { 
        status: AssignmentStatus.STARTED,
        updatedAt: new Date(),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Try to calculate route and set up deliveries
    try {
      await this.setupRouteAndDeliveries(assignmentId, assignment.restaurantId);
      
      // Mark all deliveries as picked up since assignment has started
      await this.deliveriesService.markDeliveriesAsPickedUp(assignmentId);
      
    } catch (error) {
      console.warn(`Failed to set up route for assignment ${assignmentId}:`, error);
      // Continue with assignment start even if route calculation fails
    }

    return this.formatAssignmentResponse(updatedAssignment);
  }

  // Complete an assignment
  async completeAssignment(assignmentId: string, driverId: number): Promise<AssignmentResponse> {
    const assignment = await this.prisma.restaurantAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deliveries: true,
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.driverId !== driverId) {
      throw new Error('Assignment does not belong to this driver');
    }

    if (assignment.status !== AssignmentStatus.STARTED) {
      throw new Error(`Cannot complete assignment with status: ${assignment.status}`);
    }

    // Calculate actual deliveries from completed deliveries
    const completedDeliveries = assignment.deliveries.filter(d => d.status === 'DELIVERED').length;

    const updatedAssignment = await this.prisma.restaurantAssignment.update({
      where: { id: assignmentId },
      data: { 
        status: AssignmentStatus.COMPLETED,
        actualDeliveries: completedDeliveries,
        updatedAt: new Date(),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.formatAssignmentResponse(updatedAssignment);
  }

  // Update an assignment (for admin/external use)
  async updateAssignment(assignmentId: string, updateData: UpdateAssignmentDto): Promise<AssignmentResponse> {
    const updatedAssignment = await this.prisma.restaurantAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(updateData.estimatedDeliveries && { estimatedDeliveries: updateData.estimatedDeliveries }),
        ...(updateData.paymentRate && { paymentRate: updateData.paymentRate }),
        ...(updateData.paymentType && { paymentType: updateData.paymentType }),
        ...(updateData.notes && { notes: updateData.notes }),
        updatedAt: new Date(),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.formatAssignmentResponse(updatedAssignment);
  }

  // Delete an assignment
  async deleteAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.restaurantAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status === AssignmentStatus.STARTED) {
      throw new Error('Cannot delete a started assignment');
    }

    await this.prisma.restaurantAssignment.delete({
      where: { id: assignmentId },
    });
  }

  // Get assignment summary for a driver
  async getAssignmentSummary(driverId: number): Promise<AssignmentSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalAssignments, pendingAssignments, todayAssignments, completedThisWeek] = await Promise.all([
      this.prisma.restaurantAssignment.count({
        where: { driverId },
      }),
      this.prisma.restaurantAssignment.count({
        where: {
          driverId,
          status: AssignmentStatus.PENDING,
        },
      }),
      this.prisma.restaurantAssignment.count({
        where: {
          driverId,
          assignmentDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.restaurantAssignment.count({
        where: {
          driverId,
          status: AssignmentStatus.COMPLETED,
          updatedAt: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      }),
    ]);

    return {
      totalAssignments,
      pendingAssignments,
      todayAssignments,
      completedThisWeek,
    };
  }

  /**
   * Set up route and deliveries for an assignment
   */
  private async setupRouteAndDeliveries(assignmentId: string, restaurantId: string): Promise<void> {
    // Check if route already exists
    const existingRoute = await this.prisma.deliveryRoute.findFirst({
      where: {
        assignmentId,
        isActive: true,
      },
    });

    if (existingRoute) {
      console.log(`Route already exists for assignment ${assignmentId}`);
      return;
    }

    // For now, using placeholder restaurant location
    // In a real implementation, you would fetch this from a restaurant service
    const restaurantLocation = {
      name: `Restaurant ${restaurantId}`,
      address: 'Restaurant Address', // TODO: Get from restaurant service
      latitude: 37.7749, // TODO: Get actual coordinates
      longitude: -122.4194,
    };

    try {
      const routeResult = await this.routingService.calculateRoute({
        assignmentId,
        restaurantLocation,
        objectives: 'min-schedule-completion-time',
      });

      if (routeResult.success) {
        console.log(`Route calculated successfully for assignment ${assignmentId}`);
        console.log(`- Total distance: ${routeResult.totalDistanceKm} km`);
        console.log(`- Estimated duration: ${routeResult.estimatedDurationMinutes} minutes`);
        console.log(`- Deliveries created: ${routeResult.deliveryIds?.length || 0}`);
      } else {
        console.warn(`Route calculation failed for assignment ${assignmentId}: ${routeResult.error}`);
      }
    } catch (error) {
      console.error(`Error setting up route for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  // Validate assignment data
  private async validateAssignment(assignmentData: CreateAssignmentDto): Promise<ValidationResult> {
    return this.assignmentUtils.isDriverAvailable(
      assignmentData.driverId,
      assignmentData.assignmentDate,
      assignmentData.restaurantId
    );
  }

  // Format assignment response
  private formatAssignmentResponse(assignment: any): AssignmentResponse {
    return {
      id: assignment.id,
      driverId: assignment.driverId,
      driver: assignment.driver,
      restaurantId: assignment.restaurantId,
      assignmentDate: assignment.assignmentDate.toISOString().split('T')[0],
      pickupTime: assignment.pickupTime.toTimeString().slice(0, 5),
      estimatedDeliveries: assignment.estimatedDeliveries,
      actualDeliveries: assignment.actualDeliveries,
      status: assignment.status,
      paymentType: assignment.paymentType,
      paymentRate: parseFloat(assignment.paymentRate.toString()),
      algorithmScore: assignment.algorithmScore ? parseFloat(assignment.algorithmScore.toString()) : null,
      notes: assignment.notes,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }
} 