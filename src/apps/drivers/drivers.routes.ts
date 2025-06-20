import { Router } from 'express';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

export function createDriversRouter(prisma: PrismaClient) {
  const driversService = new DriversService(prisma);
  const driversController = new DriversController(driversService);
  const authMiddleware = new AuthMiddleware(prisma);
  const driversRouter = Router();

  // All driver routes are protected - require authentication
  
  // Service Area routes
  driversRouter.get('/service-areas', 
    authMiddleware.authenticateToken,
    driversController.getServiceAreas
  );

  driversRouter.post('/service-areas', 
    authMiddleware.authenticateToken,
    driversController.createServiceArea
  );

  driversRouter.put('/service-areas/:id', 
    authMiddleware.authenticateToken,
    driversController.updateServiceArea
  );

  driversRouter.delete('/service-areas/:id', 
    authMiddleware.authenticateToken,
    driversController.deleteServiceArea
  );

  // Schedule routes
  // GET /api/drivers/schedules - Get driver's weekly schedule
  driversRouter.get('/schedules', 
    authMiddleware.authenticateToken,
    driversController.getSchedules
  );

  // PUT /api/drivers/schedules - Update entire schedule
  driversRouter.put('/schedules', 
    authMiddleware.authenticateToken,
    driversController.updateWeeklySchedule
  );

  // PUT /api/drivers/schedules/:day - Update specific day schedule
  driversRouter.put('/schedules/:day', 
    authMiddleware.authenticateToken,
    driversController.updateDaySchedule
  );

  // Availability blocking routes
  // POST /api/drivers/availability/block - Block specific dates
  driversRouter.post('/availability/block', 
    authMiddleware.authenticateToken,
    driversController.createAvailabilityBlock
  );

  // DELETE /api/drivers/availability/block/:id - Unblock dates
  driversRouter.delete('/availability/block/:id', 
    authMiddleware.authenticateToken,
    driversController.deleteAvailabilityBlock
  );

  return driversRouter;
} 