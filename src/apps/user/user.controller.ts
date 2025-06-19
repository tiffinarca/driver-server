import { Request, Response } from 'express';
import { UserService } from './user.service';
import { DriverStatus } from '@prisma/client';
import { CreateVehicleDto, UpdateVehicleDto } from './user.types';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create user' });
    }
  };

  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.userService.getUserByEmail(req.params.email);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get user' });
    }
  };

  getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get users' });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.userService.updateUser(Number(req.params.id), req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update user' });
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.userService.deleteUser(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete user' });
    }
  };

  // Profile image methods
  uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const result = await this.userService.uploadProfileImage(userId, req.file.buffer);
      res.status(201).json({
        message: 'Profile image uploaded successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to upload profile image' });
    }
  };

  updateProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const result = await this.userService.updateProfileImage(userId, req.file.buffer);
      res.json({
        message: 'Profile image updated successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update profile image' });
    }
  };

  deleteProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      const result = await this.userService.deleteProfileImage(userId);
      res.json({
        message: 'Profile image deleted successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete profile image' });
    }
  };

  getProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      const result = await this.userService.getProfileImage(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get profile image' });
    }
  };

  // Vehicle related endpoints
  addVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      const vehicleData = req.body as CreateVehicleDto;
      const vehicle = await this.userService.addVehicle(userId, vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add vehicle' });
    }
  };

  updateVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicleId = Number(req.params.vehicleId);
      const vehicleData = req.body as UpdateVehicleDto;
      const vehicle = await this.userService.updateVehicle(vehicleId, vehicleData);
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update vehicle' });
    }
  };

  deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicleId = Number(req.params.vehicleId);
      await this.userService.deleteVehicle(vehicleId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete vehicle' });
    }
  };

  getVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicleId = Number(req.params.vehicleId);
      const vehicle = await this.userService.getVehicle(vehicleId);
      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get vehicle' });
    }
  };

  getUserVehicles = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      const vehicles = await this.userService.getUserVehicles(userId);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get user vehicles' });
    }
  };

  updateDriverStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      const status = req.body.status as DriverStatus;
      if (!Object.values(DriverStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid driver status' });
        return;
      }
      const user = await this.userService.updateDriverStatus(userId, status);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update driver status' });
    }
  };
} 