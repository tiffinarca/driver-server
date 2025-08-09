import { PrismaClient, PaymentType } from '@prisma/client';
import { 
  CreateEarningRequest, 
  UpdateEarningRequest, 
  EarningsSummary, 
  DailyEarnings, 
  WeeklyEarnings, 
  PendingEarnings,
  EarningWithDetails 
} from './earnings.types';

export class EarningsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createEarning(data: CreateEarningRequest) {
    return await this.prisma.driverEarning.create({
      data: {
        driverId: data.driverId,
        assignmentId: data.assignmentId,
        deliveryId: data.deliveryId,
        earningDate: data.earningDate,
        amount: data.amount,
        currency: data.currency || 'USD',
        calculationMethod: data.calculationMethod,
        calculationDetails: data.calculationDetails,
      },
    });
  }

  async getEarningsByDriver(driverId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [earnings, total] = await Promise.all([
      this.prisma.driverEarning.findMany({
        where: { driverId },
        include: {
          assignment: {
            select: {
              id: true,
              restaurantId: true,
              assignmentDate: true,
              status: true,
            },
          },
          delivery: {
            select: {
              id: true,
              clientId: true,
              status: true,
              deliveredAt: true,
            },
          },
        },
        orderBy: { earningDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.driverEarning.count({
        where: { driverId },
      }),
    ]);

    return {
      earnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEarningsSummary(driverId: number): Promise<EarningsSummary> {
    const [
      totalEarnings,
      processedEarnings,
      pendingEarnings,
      totalDeliveries,
    ] = await Promise.all([
      this.prisma.driverEarning.aggregate({
        where: { driverId },
        _sum: { amount: true },
      }),
      this.prisma.driverEarning.aggregate({
        where: { driverId, isProcessed: true },
        _sum: { amount: true },
      }),
      this.prisma.driverEarning.aggregate({
        where: { driverId, isProcessed: false },
        _sum: { amount: true },
      }),
      this.prisma.driverEarning.count({
        where: { driverId, deliveryId: { not: null } },
      }),
    ]);

    const total = totalEarnings._sum.amount || 0;
    const processed = processedEarnings._sum.amount || 0;
    const pending = pendingEarnings._sum.amount || 0;
    const deliveries = totalDeliveries;

    return {
      totalEarnings: Number(total),
      processedEarnings: Number(processed),
      pendingEarnings: Number(pending),
      totalDeliveries: deliveries,
      averagePerDelivery: deliveries > 0 ? Number(total) / deliveries : 0,
      currency: 'USD',
    };
  }

  async getDailyEarnings(driverId: number, date: string): Promise<DailyEarnings> {
    const targetDate = new Date(date);
    
    const [earnings, deliveries, assignments] = await Promise.all([
      this.prisma.driverEarning.aggregate({
        where: {
          driverId,
          earningDate: targetDate,
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.driverEarning.count({
        where: {
          driverId,
          earningDate: targetDate,
          deliveryId: { not: null },
        },
      }),
      this.prisma.driverEarning.groupBy({
        by: ['assignmentId'],
        where: {
          driverId,
          earningDate: targetDate,
        },
        _count: true,
      }),
    ]);

    return {
      date,
      earnings: Number(earnings._sum.amount || 0),
      deliveries,
      assignments: assignments.length,
    };
  }

  async getWeeklyEarnings(driverId: number, weekStart: string): Promise<WeeklyEarnings> {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const [weeklyData, dailyBreakdown] = await Promise.all([
      this.prisma.driverEarning.aggregate({
        where: {
          driverId,
          earningDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.getDailyBreakdownForWeek(driverId, startDate, endDate),
    ]);

    return {
      weekStart: startDate.toISOString().split('T')[0],
      weekEnd: endDate.toISOString().split('T')[0],
      totalEarnings: Number(weeklyData._sum.amount || 0),
      totalDeliveries: weeklyData._count,
      dailyBreakdown,
    };
  }

  private async getDailyBreakdownForWeek(
    driverId: number,
    startDate: Date,
    endDate: Date
  ): Promise<DailyEarnings[]> {
    const dailyData = await this.prisma.driverEarning.groupBy({
      by: ['earningDate'],
      where: {
        driverId,
        earningDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const dailyDeliveries = await this.prisma.driverEarning.groupBy({
      by: ['earningDate'],
      where: {
        driverId,
        earningDate: {
          gte: startDate,
          lte: endDate,
        },
        deliveryId: { not: null },
      },
      _count: true,
    });

    const dailyAssignments = await this.prisma.driverEarning.groupBy({
      by: ['earningDate'],
      where: {
        driverId,
        earningDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        assignmentId: true,
      },
    });

    const breakdown: DailyEarnings[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyData.find((d: any) => d.earningDate.toISOString().split('T')[0] === dateStr);
      const dayDeliveries = dailyDeliveries.find((d: any) => d.earningDate.toISOString().split('T')[0] === dateStr);
      const dayAssignments = dailyAssignments.find((d: any) => d.earningDate.toISOString().split('T')[0] === dateStr);

      breakdown.push({
        date: dateStr,
        earnings: Number(dayData?._sum.amount || 0),
        deliveries: dayDeliveries?._count || 0,
        assignments: dayAssignments?._count.assignmentId || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return breakdown;
  }

  async getPendingEarnings(driverId: number): Promise<PendingEarnings> {
    const [pendingData, deliveries, assignments] = await Promise.all([
      this.prisma.driverEarning.aggregate({
        where: { driverId, isProcessed: false },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.driverEarning.count({
        where: {
          driverId,
          isProcessed: false,
          deliveryId: { not: null },
        },
      }),
      this.prisma.driverEarning.groupBy({
        by: ['assignmentId'],
        where: { driverId, isProcessed: false },
        _count: true,
      }),
    ]);

    return {
      totalAmount: Number(pendingData._sum.amount || 0),
      totalDeliveries: deliveries,
      assignments: assignments.length,
      currency: 'USD',
    };
  }

  async updateEarning(earningId: string, data: UpdateEarningRequest) {
    return await this.prisma.driverEarning.update({
      where: { id: earningId },
      data: {
        ...data,
        processedAt: data.isProcessed ? new Date() : data.processedAt,
      },
    });
  }

  async getEarningById(earningId: string): Promise<EarningWithDetails | null> {
    return await this.prisma.driverEarning.findUnique({
      where: { id: earningId },
      include: {
        assignment: {
          select: {
            id: true,
            restaurantId: true,
            assignmentDate: true,
            status: true,
          },
        },
        delivery: {
          select: {
            id: true,
            clientId: true,
            status: true,
            deliveredAt: true,
          },
        },
      },
    });
  }

  async calculateEarningsForAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.restaurantAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        deliveries: true,
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Calculate earnings based on payment type
    let totalEarning = 0;
    const calculationDetails: Record<string, any> = {};

    switch (assignment.paymentType) {
      case PaymentType.FIXED:
        totalEarning = Number(assignment.paymentRate);
        calculationDetails.method = 'FIXED';
        calculationDetails.rate = assignment.paymentRate;
        break;

      case PaymentType.PER_DELIVERY:
        const completedDeliveries = assignment.deliveries.filter(
          d => d.status === 'DELIVERED'
        ).length;
        totalEarning = Number(assignment.paymentRate) * completedDeliveries;
        calculationDetails.method = 'PER_DELIVERY';
        calculationDetails.rate = assignment.paymentRate;
        calculationDetails.completedDeliveries = completedDeliveries;
        break;

      case PaymentType.HOURLY:
        // Calculate hours worked based on assignment duration
        const startTime = new Date(assignment.assignmentDate);
        startTime.setHours(
          assignment.pickupTime.getHours(),
          assignment.pickupTime.getMinutes(),
          0,
          0
        );
        
        // Estimate end time (you might want to track actual end time)
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 8); // Default 8-hour shift
        
        const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        totalEarning = Number(assignment.paymentRate) * hoursWorked;
        
        calculationDetails.method = 'HOURLY';
        calculationDetails.rate = assignment.paymentRate;
        calculationDetails.hoursWorked = hoursWorked;
        break;
    }

    // Create earning record
    await this.createEarning({
      driverId: assignment.driverId,
      assignmentId: assignment.id,
      earningDate: assignment.assignmentDate,
      amount: totalEarning,
      calculationMethod: assignment.paymentType,
      calculationDetails,
    });
  }

  async calculateEarningsForDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        assignment: true,
      },
    });

    if (!delivery || delivery.status !== 'DELIVERED') {
      return; // Only calculate for completed deliveries
    }

    // For per-delivery payments, create individual earning records
    if (delivery.assignment.paymentType === PaymentType.PER_DELIVERY) {
      await this.createEarning({
        driverId: delivery.assignment.driverId,
        assignmentId: delivery.assignment.id,
        deliveryId: delivery.id,
        earningDate: delivery.deliveredAt || new Date(),
        amount: Number(delivery.assignment.paymentRate),
        calculationMethod: PaymentType.PER_DELIVERY,
        calculationDetails: {
          method: 'PER_DELIVERY',
          rate: delivery.assignment.paymentRate,
          deliveryId: delivery.id,
        },
      });
    }
  }
} 