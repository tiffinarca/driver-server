import { PrismaClient, User, Vehicle, DriverStatus } from '@prisma/client';
import { CreateVehicleDto, UpdateVehicleDto } from './user.types';

export class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createUser(data: { email: string; name?: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        driverStatus: 'PENDING'
      }
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { vehicles: true }
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { vehicles: true }
    });
  }

  async updateUser(id: number, data: { name?: string; email?: string; driverStatus?: DriverStatus }): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { vehicles: true }
    });
  }

  async deleteUser(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
      include: { vehicles: true }
    });
  }

  // Vehicle related methods
  async addVehicle(userId: number, data: CreateVehicleDto): Promise<Vehicle> {
    return this.prisma.vehicle.create({
      data: {
        ...data,
        driverId: userId
      }
    });
  }

  async updateVehicle(id: number, data: UpdateVehicleDto): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data
    });
  }

  async deleteVehicle(id: number): Promise<Vehicle> {
    return this.prisma.vehicle.delete({
      where: { id }
    });
  }

  async getVehicle(id: number): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: { driver: true }
    });
  }

  async getUserVehicles(userId: number): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { driverId: userId }
    });
  }

  async updateDriverStatus(userId: number, status: DriverStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { driverStatus: status },
      include: { vehicles: true }
    });
  }
} 