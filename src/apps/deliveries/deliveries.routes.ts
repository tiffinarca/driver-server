import { Router } from 'express';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

export function createDeliveriesRouter(prisma: PrismaClient) {
  const deliveriesService = new DeliveriesService(prisma);
  const deliveriesController = new DeliveriesController(deliveriesService);
  const authMiddleware = new AuthMiddleware(prisma);
  const deliveriesRouter = Router();

  // All delivery routes require authentication
  
  // GET /api/deliveries/:id - Get delivery details
  deliveriesRouter.get('/:id',
    authMiddleware.authenticateToken,
    deliveriesController.getDeliveryById
  );

  // PUT /api/deliveries/:id/pickup - Mark as picked up
  deliveriesRouter.put('/:id/pickup',
    authMiddleware.authenticateToken,
    deliveriesController.markAsPickedUp
  );

  // PUT /api/deliveries/:id/start - Start delivery
  deliveriesRouter.put('/:id/start',
    authMiddleware.authenticateToken,
    deliveriesController.startDelivery
  );

  // PUT /api/deliveries/:id/complete - Complete delivery
  deliveriesRouter.put('/:id/complete',
    authMiddleware.authenticateToken,
    deliveriesController.completeDelivery
  );

  // POST /api/deliveries/:id/proof - Upload proof of delivery
  deliveriesRouter.post('/:id/proof',
    authMiddleware.authenticateToken,
    deliveriesController.uploadProof
  );

  // PUT /api/deliveries/:id/fail - Mark delivery as failed
  deliveriesRouter.put('/:id/fail',
    authMiddleware.authenticateToken,
    deliveriesController.failDelivery
  );

  // POST /api/deliveries/:id/notes - Add delivery notes
  deliveriesRouter.post('/:id/notes',
    authMiddleware.authenticateToken,
    deliveriesController.addNotes
  );

  // GET /api/deliveries/search - Search deliveries by client
  deliveriesRouter.get('/search',
    authMiddleware.authenticateToken,
    deliveriesController.searchDeliveries
  );

  return deliveriesRouter;
} 