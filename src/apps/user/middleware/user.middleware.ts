import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

export class UserMiddleware {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Verify if user is accessing their own resources
  authorizeUser = (req: Request, res: Response, next: NextFunction): void => {
    const userId = Number(req.params.userId);

    if (!req.user || req.user.id !== userId) {
      res.status(403).json({ error: 'Unauthorized access' });
      return;
    }

    next();
  };

  // Verify if user owns the vehicle
  authorizeVehicleAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const vehicleId = Number(req.params.vehicleId);
    const userId = Number(req.params.userId);

    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { driverId: true }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      if (!req.user || req.user.id !== userId || vehicle.driverId !== userId) {
        res.status(403).json({ error: 'Unauthorized access to vehicle' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify vehicle ownership' });
    }
  };
} 