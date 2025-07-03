import { Router } from 'express';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

export function createAssignmentsRouter(prisma: PrismaClient) {
  const assignmentsService = new AssignmentsService(prisma);
  const assignmentsController = new AssignmentsController(assignmentsService);
  const authMiddleware = new AuthMiddleware(prisma);
  const assignmentsRouter = Router();

  // Driver-specific routes (protected - require authentication)
  
  // GET /api/assignments - List driver's assignments
  assignmentsRouter.get('/',
    authMiddleware.authenticateToken,
    assignmentsController.getAssignments
  );

  // GET /api/assignments/pending - Get pending assignments
  assignmentsRouter.get('/pending',
    authMiddleware.authenticateToken,
    assignmentsController.getPendingAssignments
  );

  // GET /api/assignments/today - Get today's assignments
  assignmentsRouter.get('/today',
    authMiddleware.authenticateToken,
    assignmentsController.getTodayAssignments
  );

  // GET /api/assignments/summary - Get assignment summary
  assignmentsRouter.get('/summary',
    authMiddleware.authenticateToken,
    assignmentsController.getAssignmentSummary
  );

  // GET /api/assignments/:id - Get assignment details
  assignmentsRouter.get('/:id',
    authMiddleware.authenticateToken,
    assignmentsController.getAssignmentById
  );

  // PUT /api/assignments/:id/start - Start assignment
  assignmentsRouter.put('/:id/start',
    authMiddleware.authenticateToken,
    assignmentsController.startAssignment
  );

  // PUT /api/assignments/:id/complete - Complete assignment
  assignmentsRouter.put('/:id/complete',
    authMiddleware.authenticateToken,
    assignmentsController.completeAssignment
  );

  // Admin/External routes (for creating and managing assignments)
  // These routes are for external systems or admin interfaces to manage assignments
  
  // POST /api/assignments - Create assignment (for admin/external use)
  assignmentsRouter.post('/',
    assignmentsController.createAssignment
  );

  // PUT /api/assignments/:id - Update assignment (for admin/external use)
  assignmentsRouter.put('/:id',
    assignmentsController.updateAssignment
  );

  // DELETE /api/assignments/:id - Delete assignment (for admin/external use)
  assignmentsRouter.delete('/:id',
    assignmentsController.deleteAssignment
  );

  return assignmentsRouter;
} 