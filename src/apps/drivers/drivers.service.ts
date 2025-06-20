import { PrismaClient } from '@prisma/client';
import { 
  CreateServiceAreaDto, 
  UpdateServiceAreaDto, 
  ServiceAreaResponse,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleResponse,
  WeeklyScheduleResponse,
  UpdateWeeklyScheduleDto,
  CreateAvailabilityBlockDto,
  AvailabilityBlockResponse
} from './drivers.types';

export class DriversService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Service Area methods (existing)
  async getDriverServiceAreas(driverId: number): Promise<ServiceAreaResponse[]> {
    const serviceAreas = await this.prisma.driverServiceArea.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' }
    });

    return serviceAreas.map(area => ({
      ...area,
      latitude: Number(area.latitude),
      longitude: Number(area.longitude)
    }));
  }

  async createServiceArea(driverId: number, data: CreateServiceAreaDto): Promise<ServiceAreaResponse> {
    // Check if driver exists
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check for duplicate area name for this driver
    const existingArea = await this.prisma.driverServiceArea.findUnique({
      where: { 
        driverId_areaName: { 
          driverId, 
          areaName: data.areaName 
        } 
      }
    });

    if (existingArea) {
      throw new Error('Service area with this name already exists for this driver');
    }

    const serviceArea = await this.prisma.driverServiceArea.create({
      data: {
        ...data,
        driverId,
        country: data.country || 'USA',
        radiusKm: data.radiusKm || 10
      }
    });

    return {
      ...serviceArea,
      latitude: Number(serviceArea.latitude),
      longitude: Number(serviceArea.longitude)
    };
  }

  async updateServiceArea(id: string, driverId: number, data: UpdateServiceAreaDto): Promise<ServiceAreaResponse> {
    // First check if the service area exists and belongs to the driver
    const existingArea = await this.prisma.driverServiceArea.findUnique({
      where: { id }
    });

    if (!existingArea) {
      throw new Error('Service area not found');
    }

    if (existingArea.driverId !== driverId) {
      throw new Error('Unauthorized to update this service area');
    }

    // If updating area name, check for duplicates
    if (data.areaName && data.areaName !== existingArea.areaName) {
      const duplicateCheck = await this.prisma.driverServiceArea.findUnique({
        where: { 
          driverId_areaName: { 
            driverId, 
            areaName: data.areaName 
          } 
        }
      });

      if (duplicateCheck) {
        throw new Error('Service area with this name already exists for this driver');
      }
    }

    const updatedArea = await this.prisma.driverServiceArea.update({
      where: { id },
      data
    });

    return {
      ...updatedArea,
      latitude: Number(updatedArea.latitude),
      longitude: Number(updatedArea.longitude)
    };
  }

  async deleteServiceArea(id: string, driverId: number): Promise<void> {
    // First check if the service area exists and belongs to the driver
    const existingArea = await this.prisma.driverServiceArea.findUnique({
      where: { id }
    });

    if (!existingArea) {
      throw new Error('Service area not found');
    }

    if (existingArea.driverId !== driverId) {
      throw new Error('Unauthorized to delete this service area');
    }

    await this.prisma.driverServiceArea.delete({
      where: { id }
    });
  }

  async getServiceAreaById(id: string, driverId: number): Promise<ServiceAreaResponse | null> {
    const serviceArea = await this.prisma.driverServiceArea.findUnique({
      where: { id }
    });

    if (!serviceArea || serviceArea.driverId !== driverId) {
      return null;
    }

    return {
      ...serviceArea,
      latitude: Number(serviceArea.latitude),
      longitude: Number(serviceArea.longitude)
    };
  }

  // Schedule methods
  private formatTimeToString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private parseTimeString(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  async getDriverSchedule(driverId: number): Promise<WeeklyScheduleResponse> {
    const schedules = await this.prisma.driverSchedule.findMany({
      where: { driverId },
      orderBy: { dayOfWeek: 'asc' }
    });

    const formattedSchedules: ScheduleResponse[] = schedules.map(schedule => ({
      ...schedule,
      startTime: this.formatTimeToString(schedule.startTime),
      endTime: this.formatTimeToString(schedule.endTime)
    }));

    // Create coverage map (0-6 for Sunday-Saturday)
    const coverage: { [key: number]: ScheduleResponse | null } = {};
    for (let day = 0; day < 7; day++) {
      coverage[day] = formattedSchedules.find(s => s.dayOfWeek === day) || null;
    }

    return {
      schedules: formattedSchedules,
      coverage
    };
  }

  async updateWeeklySchedule(driverId: number, data: UpdateWeeklyScheduleDto): Promise<WeeklyScheduleResponse> {
    // Check if driver exists
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Validate day of week values
    for (const schedule of data.schedules) {
      if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // Delete existing schedules and create new ones in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete existing schedules
      await tx.driverSchedule.deleteMany({
        where: { driverId }
      });

      // Create new schedules
      if (data.schedules.length > 0) {
        await tx.driverSchedule.createMany({
          data: data.schedules.map(schedule => ({
            driverId,
            ...schedule,
            startTime: this.parseTimeString(schedule.startTime),
            endTime: this.parseTimeString(schedule.endTime),
            isAvailable: schedule.isAvailable ?? true,
            maxDeliveries: schedule.maxDeliveries ?? 70
          }))
        });
      }
    });

    return this.getDriverSchedule(driverId);
  }

  async updateDaySchedule(driverId: number, dayOfWeek: number, data: UpdateScheduleDto): Promise<ScheduleResponse> {
    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Check if schedule exists for this day
    const existingSchedule = await this.prisma.driverSchedule.findUnique({
      where: { 
        driverId_dayOfWeek: { 
          driverId, 
          dayOfWeek 
        } 
      }
    });

    if (!existingSchedule) {
      throw new Error('Schedule not found for this day');
    }

    const updateData: any = {};
    if (data.startTime) updateData.startTime = this.parseTimeString(data.startTime);
    if (data.endTime) updateData.endTime = this.parseTimeString(data.endTime);
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.maxDeliveries !== undefined) updateData.maxDeliveries = data.maxDeliveries;

    const updatedSchedule = await this.prisma.driverSchedule.update({
      where: { 
        driverId_dayOfWeek: { 
          driverId, 
          dayOfWeek 
        } 
      },
      data: updateData
    });

    return {
      ...updatedSchedule,
      startTime: this.formatTimeToString(updatedSchedule.startTime),
      endTime: this.formatTimeToString(updatedSchedule.endTime)
    };
  }

  // Availability blocking methods
  async createAvailabilityBlock(driverId: number, data: CreateAvailabilityBlockDto): Promise<AvailabilityBlockResponse> {
    // Check if driver exists
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const blockedDate = new Date(data.blockedDate);
    
    const blockData: any = {
      driverId,
      blockedDate,
      reason: data.reason,
      isFullDay: data.isFullDay ?? true
    };

    if (!data.isFullDay && data.startTime && data.endTime) {
      blockData.startTime = this.parseTimeString(data.startTime);
      blockData.endTime = this.parseTimeString(data.endTime);
    }

    const block = await this.prisma.driverAvailabilityBlock.create({
      data: blockData
    });

    return {
      ...block,
      startTime: block.startTime ? this.formatTimeToString(block.startTime) : null,
      endTime: block.endTime ? this.formatTimeToString(block.endTime) : null
    };
  }

  async deleteAvailabilityBlock(id: string, driverId: number): Promise<void> {
    // Check if block exists and belongs to driver
    const existingBlock = await this.prisma.driverAvailabilityBlock.findUnique({
      where: { id }
    });

    if (!existingBlock) {
      throw new Error('Availability block not found');
    }

    if (existingBlock.driverId !== driverId) {
      throw new Error('Unauthorized to delete this availability block');
    }

    await this.prisma.driverAvailabilityBlock.delete({
      where: { id }
    });
  }
} 