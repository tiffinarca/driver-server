import { PrismaClient, AssignmentStatus, DriverStatus } from '@prisma/client';
import { CreateAssignmentDto, AssignmentValidation } from './assignments.types';

/**
 * Utility functions for external assignment algorithms and integrations
 */
export class AssignmentUtils {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get available drivers for a specific date and service area
   */
  async getAvailableDrivers(
    assignmentDate: string,
    restaurantId?: string
  ): Promise<Array<{
    id: number;
    name: string | null;
    email: string;
    serviceAreas: Array<{
      areaName: string;
      city: string;
      state: string;
      latitude: number;
      longitude: number;
      radiusKm: number;
    }>;
    currentAssignments: number;
  }>> {
    const date = new Date(assignmentDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Get all active drivers
    const drivers = await this.prisma.user.findMany({
      where: {
        driverStatus: DriverStatus.ACTIVE,
      },
      include: {
        serviceAreas: {
          where: {
            isActive: true,
          },
          select: {
            areaName: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
            radiusKm: true,
          },
        },
        schedules: {
          where: {
            dayOfWeek,
            isAvailable: true,
          },
        },
        availabilityBlocks: {
          where: {
            blockedDate: date,
          },
        },
        restaurantAssignments: {
          where: {
            assignmentDate: date,
            status: {
              in: [AssignmentStatus.PENDING, AssignmentStatus.STARTED],
            },
          },
        },
      },
    });

    // Filter drivers based on availability
    return drivers
      .filter(driver => {
        // Must have schedule for this day
        if (driver.schedules.length === 0) return false;
        
        // Must not be blocked for this date
        if (driver.availabilityBlocks.length > 0) return false;
        
        return true;
      })
      .map(driver => ({
        id: driver.id,
        name: driver.name,
        email: driver.email,
        serviceAreas: driver.serviceAreas.map(area => ({
          areaName: area.areaName,
          city: area.city,
          state: area.state,
          latitude: parseFloat(area.latitude.toString()),
          longitude: parseFloat(area.longitude.toString()),
          radiusKm: area.radiusKm,
        })),
        currentAssignments: driver.restaurantAssignments.length,
      }));
  }

  /**
   * Check if a driver is available for assignment on a specific date
   */
  async isDriverAvailable(
    driverId: number,
    assignmentDate: string,
    restaurantId: string
  ): Promise<AssignmentValidation> {
    const errors: string[] = [];
    const date = new Date(assignmentDate);
    const dayOfWeek = date.getDay();

    // Check if driver exists and is active
    const driver = await this.prisma.user.findFirst({
      where: {
        id: driverId,
        driverStatus: DriverStatus.ACTIVE,
      },
      include: {
        schedules: {
          where: {
            dayOfWeek,
            isAvailable: true,
          },
        },
        availabilityBlocks: {
          where: {
            blockedDate: date,
          },
        },
        restaurantAssignments: {
          where: {
            assignmentDate: date,
            restaurantId,
            status: {
              in: [AssignmentStatus.PENDING, AssignmentStatus.STARTED],
            },
          },
        },
      },
    });

    if (!driver) {
      errors.push('Driver not found or not active');
      return { isValid: false, errors };
    }

    // Check schedule availability
    if (driver.schedules.length === 0) {
      errors.push('Driver is not scheduled to work on this day');
    }

    // Check if blocked on this date
    if (driver.availabilityBlocks.length > 0) {
      errors.push('Driver is not available on this date');
    }

    // Check for existing assignment to same restaurant
    if (driver.restaurantAssignments.length > 0) {
      errors.push('Driver is already assigned to this restaurant on this date');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get driver workload for a specific date range
   */
  async getDriverWorkload(
    driverId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    totalAssignments: number;
    pendingAssignments: number;
    completedAssignments: number;
    averageDeliveries: number;
    dates: Array<{
      date: Date;
      assignmentCount: number;
      totalDeliveries: number;
    }>;
  }> {
    const assignments = await this.prisma.restaurantAssignment.findMany({
      where: {
        driverId,
        assignmentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        assignmentDate: 'asc',
      },
    });

    const totalAssignments = assignments.length;
    const pendingAssignments = assignments.filter(a => a.status === AssignmentStatus.PENDING).length;
    const completedAssignments = assignments.filter(a => a.status === AssignmentStatus.COMPLETED).length;
    
    const totalDeliveries = assignments.reduce((sum, a) => sum + (a.actualDeliveries || a.estimatedDeliveries), 0);
    const averageDeliveries = totalAssignments > 0 ? totalDeliveries / totalAssignments : 0;

    // Group by date
    const dateMap = new Map<string, { assignmentCount: number; totalDeliveries: number }>();
    
    assignments.forEach(assignment => {
      const dateKey = assignment.assignmentDate.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { assignmentCount: 0, totalDeliveries: 0 };
      
      existing.assignmentCount += 1;
      existing.totalDeliveries += assignment.actualDeliveries || assignment.estimatedDeliveries;
      
      dateMap.set(dateKey, existing);
    });

    const dates = Array.from(dateMap.entries()).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      assignmentCount: data.assignmentCount,
      totalDeliveries: data.totalDeliveries,
    }));

    return {
      totalAssignments,
      pendingAssignments,
      completedAssignments,
      averageDeliveries,
      dates,
    };
  }

  /**
   * Bulk create assignments (useful for algorithm-based assignment)
   */
  async bulkCreateAssignments(
    assignments: CreateAssignmentDto[]
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{
      assignment: CreateAssignmentDto;
      error: string;
    }>;
  }> {
    let successful = 0;
    let failed = 0;
    const errors: Array<{ assignment: CreateAssignmentDto; error: string }> = [];

    for (const assignmentData of assignments) {
      try {
        // Validate before creating
        const validation = await this.isDriverAvailable(
          assignmentData.driverId,
          assignmentData.assignmentDate,
          assignmentData.restaurantId
        );

        if (!validation.isValid) {
          failed++;
          errors.push({
            assignment: assignmentData,
            error: validation.errors.join(', '),
          });
          continue;
        }

        // Create the assignment
        await this.prisma.restaurantAssignment.create({
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
        });

        successful++;
      } catch (error) {
        failed++;
        errors.push({
          assignment: assignmentData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      errors,
    };
  }

  /**
   * Get restaurant assignment statistics
   */
  async getRestaurantStats(
    restaurantId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalAssignments: number;
    uniqueDrivers: number;
    averageDeliveries: number;
    totalDeliveries: number;
    completionRate: number;
  }> {
    const assignments = await this.prisma.restaurantAssignment.findMany({
      where: {
        restaurantId,
        assignmentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    const totalAssignments = assignments.length;
    const uniqueDrivers = new Set(assignments.map(a => a.driverId)).size;
    const completedAssignments = assignments.filter(a => a.status === AssignmentStatus.COMPLETED).length;
    
    const totalDeliveries = assignments.reduce((sum, a) => sum + (a.actualDeliveries || a.estimatedDeliveries), 0);
    const averageDeliveries = totalAssignments > 0 ? totalDeliveries / totalAssignments : 0;
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    return {
      totalAssignments,
      uniqueDrivers,
      averageDeliveries,
      totalDeliveries,
      completionRate,
    };
  }
} 