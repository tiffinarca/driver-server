import { PrismaClient, User, Vehicle, DriverStatus } from '@prisma/client';
import { CreateVehicleDto, UpdateVehicleDto, ProfileImageResponse } from './user.types';
import { CloudinaryServiceImpl, CloudinaryUploadResult } from '../../config/cloudinary';

export class UserService {
  private prisma: PrismaClient;
  private cloudinaryService: CloudinaryServiceImpl;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cloudinaryService = new CloudinaryServiceImpl();
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

  // Profile image methods
  async uploadProfileImage(userId: number, fileBuffer: Buffer): Promise<ProfileImageResponse> {
    // Get user to check if they already have a profile image
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImagePublicId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    try {
      // If user already has a profile image, delete it first
      if (user.profileImagePublicId) {
        await this.cloudinaryService.deleteImage(user.profileImagePublicId);
      }

      // Upload new image to Cloudinary
      const uploadResult: CloudinaryUploadResult = await this.cloudinaryService.uploadImage(fileBuffer);

      // Update user with new image data
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profileImageUrl: uploadResult.secure_url,
          profileImagePublicId: uploadResult.public_id
        },
        select: {
          id: true,
          profileImageUrl: true,
          profileImagePublicId: true,
          updatedAt: true
        }
      });

      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to upload profile image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProfileImage(userId: number, fileBuffer: Buffer): Promise<ProfileImageResponse> {
    // This is essentially the same as upload for our use case
    return this.uploadProfileImage(userId, fileBuffer);
  }

  async deleteProfileImage(userId: number): Promise<ProfileImageResponse> {
    // Get user to check if they have a profile image
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImagePublicId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.profileImagePublicId) {
      throw new Error('User does not have a profile image');
    }

    try {
      // Delete image from Cloudinary
      await this.cloudinaryService.deleteImage(user.profileImagePublicId);

      // Update user to remove image data
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profileImageUrl: null,
          profileImagePublicId: null
        },
        select: {
          id: true,
          profileImageUrl: true,
          profileImagePublicId: true,
          updatedAt: true
        }
      });

      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to delete profile image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfileImage(userId: number): Promise<{ profileImageUrl: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageUrl: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return { profileImageUrl: user.profileImageUrl };
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