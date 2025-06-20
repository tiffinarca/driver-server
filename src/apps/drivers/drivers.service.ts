import { PrismaClient } from '@prisma/client';
import { CreateServiceAreaDto, UpdateServiceAreaDto, ServiceAreaResponse } from './drivers.types';

export class DriversService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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
} 