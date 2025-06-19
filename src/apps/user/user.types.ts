import { DriverStatus } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  name?: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  driverStatus?: DriverStatus;
}

export interface CreateVehicleDto {
  make: string;
  model: string;
  licensePlate: string;
  color?: string;
  capacity?: number;
}

export interface UpdateVehicleDto {
  make?: string;
  model?: string;
  licensePlate?: string;
  color?: string;
  capacity?: number;
  verified?: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string | null;
  driverStatus: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
  profileImageUrl?: string | null;
  vehicles?: VehicleResponse[];
}

export interface VehicleResponse {
  id: number;
  make: string;
  model: string;
  licensePlate: string;
  color: string | null;
  capacity: number | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Profile image related types
export interface ProfileImageUploadDto {
  userId: number;
  file: Express.Multer.File;
}

export interface ProfileImageResponse {
  id: number;
  profileImageUrl: string | null;
  profileImagePublicId: string | null;
  updatedAt: Date;
} 