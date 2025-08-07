import { Router } from 'express';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

export function createEarningsRouter(prisma: PrismaClient) {
  const earningsService = new EarningsService(prisma);
  const earningsController = new EarningsController(earningsService);
  const authMiddleware = new AuthMiddleware(prisma);
  const earningsRouter = Router();

  // All earnings routes are protected - require authentication

  // GET /api/earnings - List all earnings for a driver
  earningsRouter.get('/', 
    authMiddleware.authenticateToken,
    earningsController.getEarnings.bind(earningsController)
  );

  // GET /api/earnings/summary - Get earnings summary
  earningsRouter.get('/summary', 
    authMiddleware.authenticateToken,
    earningsController.getEarningsSummary.bind(earningsController)
  );

  // GET /api/earnings/daily/:date - Get daily earnings
  earningsRouter.get('/daily/:date', 
    authMiddleware.authenticateToken,
    earningsController.getDailyEarnings.bind(earningsController)
  );

  // GET /api/earnings/weekly/:week - Get weekly earnings
  earningsRouter.get('/weekly/:week', 
    authMiddleware.authenticateToken,
    earningsController.getWeeklyEarnings.bind(earningsController)
  );

  // GET /api/earnings/pending - Get unpaid earnings
  earningsRouter.get('/pending', 
    authMiddleware.authenticateToken,
    earningsController.getPendingEarnings.bind(earningsController)
  );

  // GET /api/earnings/:id - Get specific earning details
  earningsRouter.get('/:id', 
    authMiddleware.authenticateToken,
    earningsController.getEarningById.bind(earningsController)
  );

  // PUT /api/earnings/:id - Update earning (e.g., mark as processed)
  earningsRouter.put('/:id', 
    authMiddleware.authenticateToken,
    earningsController.updateEarning.bind(earningsController)
  );

  // POST /api/earnings/calculate/assignment/:assignmentId - Calculate earnings for assignment
  earningsRouter.post('/calculate/assignment/:assignmentId', 
    authMiddleware.authenticateToken,
    earningsController.calculateEarningsForAssignment.bind(earningsController)
  );

  // POST /api/earnings/calculate/delivery/:deliveryId - Calculate earnings for delivery
  earningsRouter.post('/calculate/delivery/:deliveryId', 
    authMiddleware.authenticateToken,
    earningsController.calculateEarningsForDelivery.bind(earningsController)
  );

  return earningsRouter;
} 