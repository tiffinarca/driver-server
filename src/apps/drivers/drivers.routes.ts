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

  // All driver service area routes are protected - require authentication
  // We use authenticateToken since we only need the user ID for these operations
  
  // GET /api/drivers/service-areas - Get driver's service areas
  driversRouter.get('/service-areas', 
    authMiddleware.authenticateToken,
    driversController.getServiceAreas
  );

  // POST /api/drivers/service-areas - Add new service area
  driversRouter.post('/service-areas', 
    authMiddleware.authenticateToken,
    driversController.createServiceArea
  );

  // PUT /api/drivers/service-areas/:id - Update service area
  driversRouter.put('/service-areas/:id', 
    authMiddleware.authenticateToken,
    driversController.updateServiceArea
  );

  // DELETE /api/drivers/service-areas/:id - Remove service area
  driversRouter.delete('/service-areas/:id', 
    authMiddleware.authenticateToken,
    driversController.deleteServiceArea
  );

  return driversRouter;
} 