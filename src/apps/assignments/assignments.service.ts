import { PrismaClient, AssignmentStatus } from '@prisma/client';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentResponse,
  AssignmentListResponse,
  AssignmentFilters,
  StartAssignmentDto,
  CompleteAssignmentDto,
  AssignmentSummaryResponse,
  AssignmentValidation
} from './assignments.types';

export class AssignmentsService {
  constructor(private prisma: PrismaClient) {}

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
  async getAssignmentById(assignmentId: string, driverId: number): Promise<AssignmentResponse> {
    const assignment = await this.prisma.restaurantAssignment.findFirst({
      where: {
        id: assignmentId,
        driverId,
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

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    return this.formatAssignmentResponse(assignment);
  }

  // Start an assignment
  async startAssignment(
    assignmentId: string,
    driverId: number,
    data: StartAssignmentDto
  ): Promise<AssignmentResponse> {
    const assignment = await this.prisma.restaurantAssignment.findFirst({
      where: {
        id: assignmentId,
        driverId,
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new Error('Assignment can only be started if it is pending');
    }

    const updatedAssignment = await this.prisma.restaurantAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        status: AssignmentStatus.STARTED,
        notes: data.notes || assignment.notes,
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

  // Complete an assignment
  async completeAssignment(
    assignmentId: string,
    driverId: number,
    data: CompleteAssignmentDto
  ): Promise<AssignmentResponse> {
    const assignment = await this.prisma.restaurantAssignment.findFirst({
      where: {
        id: assignmentId,
        driverId,
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== AssignmentStatus.STARTED) {
      throw new Error('Assignment can only be completed if it has been started');
    }

    const updatedAssignment = await this.prisma.restaurantAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        status: AssignmentStatus.COMPLETED,
        actualDeliveries: data.actualDeliveries,
        notes: data.notes || assignment.notes,
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
  async updateAssignment(
    assignmentId: string,
    updateData: UpdateAssignmentDto
  ): Promise<AssignmentResponse> {
    const existingAssignment = await this.prisma.restaurantAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existingAssignment) {
      throw new Error('Assignment not found');
    }

    const dataToUpdate: any = {};

    if (updateData.assignmentDate) {
      dataToUpdate.assignmentDate = new Date(updateData.assignmentDate);
    }

    if (updateData.pickupTime) {
      dataToUpdate.pickupTime = new Date(`1970-01-01T${updateData.pickupTime}:00.000Z`);
    }

    if (updateData.estimatedDeliveries !== undefined) {
      dataToUpdate.estimatedDeliveries = updateData.estimatedDeliveries;
    }

    if (updateData.actualDeliveries !== undefined) {
      dataToUpdate.actualDeliveries = updateData.actualDeliveries;
    }

    if (updateData.paymentType) {
      dataToUpdate.paymentType = updateData.paymentType;
    }

    if (updateData.paymentRate !== undefined) {
      dataToUpdate.paymentRate = updateData.paymentRate;
    }

    if (updateData.notes !== undefined) {
      dataToUpdate.notes = updateData.notes;
    }

    const updatedAssignment = await this.prisma.restaurantAssignment.update({
      where: { id: assignmentId },
      data: dataToUpdate,
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
      throw new Error('Cannot delete an assignment that has been started');
    }

    await this.prisma.restaurantAssignment.delete({
      where: { id: assignmentId },
    });
  }

  // Get assignment summary for a driver
  async getAssignmentSummary(driverId: number): Promise<AssignmentSummaryResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalAssignments,
      pendingAssignments,
      completedAssignments,
      todayAssignments,
      upcomingAssignments,
    ] = await Promise.all([
      this.prisma.restaurantAssignment.count({
        where: { driverId },
      }),
      this.prisma.restaurantAssignment.count({
        where: { driverId, status: AssignmentStatus.PENDING },
      }),
      this.prisma.restaurantAssignment.count({
        where: { driverId, status: AssignmentStatus.COMPLETED },
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
          assignmentDate: {
            gte: tomorrow,
          },
        },
      }),
    ]);

    return {
      totalAssignments,
      pendingAssignments,
      completedAssignments,
      todayAssignments,
      upcomingAssignments,
    };
  }

  // Validate assignment data
  private async validateAssignment(data: CreateAssignmentDto): Promise<AssignmentValidation> {
    const errors: string[] = [];

    // Check if driver exists and is active
    const driver = await this.prisma.user.findFirst({
      where: {
        id: data.driverId,
        driverStatus: 'ACTIVE',
      },
    });

    if (!driver) {
      errors.push('Driver not found or not active');
    }

    // Check if driver is already assigned to the same restaurant on the same date
    const existingAssignment = await this.prisma.restaurantAssignment.findFirst({
      where: {
        driverId: data.driverId,
        restaurantId: data.restaurantId,
        assignmentDate: new Date(data.assignmentDate),
      },
    });

    if (existingAssignment) {
      errors.push('Driver is already assigned to this restaurant on this date');
    }

    // Validate date (should not be in the past)
    const assignmentDate = new Date(data.assignmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (assignmentDate < today) {
      errors.push('Assignment date cannot be in the past');
    }

    // Validate estimated deliveries
    if (data.estimatedDeliveries <= 0) {
      errors.push('Estimated deliveries must be greater than 0');
    }

    // Validate payment rate
    if (data.paymentRate <= 0) {
      errors.push('Payment rate must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Format assignment response
  private formatAssignmentResponse(assignment: any): AssignmentResponse {
    return {
      id: assignment.id,
      driverId: assignment.driverId,
      restaurantId: assignment.restaurantId,
      assignmentDate: assignment.assignmentDate,
      pickupTime: assignment.pickupTime.toISOString().substring(11, 16), // Extract HH:MM
      estimatedDeliveries: assignment.estimatedDeliveries,
      actualDeliveries: assignment.actualDeliveries,
      status: assignment.status,
      paymentType: assignment.paymentType,
      paymentRate: parseFloat(assignment.paymentRate.toString()),
      notes: assignment.notes,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      driver: assignment.driver,
    };
  }
} 