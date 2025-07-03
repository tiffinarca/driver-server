import { Request, Response } from 'express';
import { AssignmentsService } from './assignments.service';
import {
  CreateAssignmentDto,
  AssignmentFilters,
  StartAssignmentDto,
  CompleteAssignmentDto
} from './assignments.types';
import { logger } from '../../config/logger';

interface AuthRequest extends Request {
  userId?: number;
}

export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  // GET /api/assignments - List driver's assignments
  getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const filters: AssignmentFilters = {
        status: req.query.status as any,
        restaurantId: req.query.restaurantId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await this.assignmentsService.getDriverAssignments(req.userId, filters);
      res.json(result);
    } catch (error) {
      logger.error('Error fetching assignments:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  };

  // GET /api/assignments/pending - Get pending assignments
  getPendingAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const assignments = await this.assignmentsService.getPendingAssignments(req.userId);
      res.json({ assignments });
    } catch (error) {
      logger.error('Error fetching pending assignments:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ error: 'Failed to fetch pending assignments' });
    }
  };

  // GET /api/assignments/today - Get today's assignments
  getTodayAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const assignments = await this.assignmentsService.getTodayAssignments(req.userId);
      res.json({ assignments });
    } catch (error) {
      logger.error('Error fetching today assignments:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ error: 'Failed to fetch today assignments' });
    }
  };

  // GET /api/assignments/summary - Get assignment summary
  getAssignmentSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const summary = await this.assignmentsService.getAssignmentSummary(req.userId);
      res.json(summary);
    } catch (error) {
      logger.error('Error fetching assignment summary:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ error: 'Failed to fetch assignment summary' });
    }
  };

  // GET /api/assignments/:id - Get assignment details
  getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const assignmentId = req.params.id;
      const assignment = await this.assignmentsService.getAssignmentById(assignmentId, req.userId);
      res.json(assignment);
    } catch (error) {
      logger.error('Error fetching assignment:', { error: error instanceof Error ? error.message : error });
      
      if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to fetch assignment' });
    }
  };

  // PUT /api/assignments/:id/start - Start assignment
  startAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const assignmentId = req.params.id;

      const assignment = await this.assignmentsService.startAssignment(assignmentId, req.userId);
      res.json(assignment);
    } catch (error) {
      logger.error('Error starting assignment:', { error: error instanceof Error ? error.message : error });
      
      if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }
      
      if (error instanceof Error && error.message.includes('can only be started')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to start assignment' });
    }
  };

  // PUT /api/assignments/:id/complete - Complete assignment
  completeAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const assignmentId = req.params.id;

      const assignment = await this.assignmentsService.completeAssignment(assignmentId, req.userId);
      res.json(assignment);
    } catch (error) {
      logger.error('Error completing assignment:', { error: error instanceof Error ? error.message : error });
      
      if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }
      
      if (error instanceof Error && error.message.includes('can only be completed')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to complete assignment' });
    }
  };

  // POST /api/assignments - Create assignment (for admin/external use)
  createAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignmentData: CreateAssignmentDto = req.body;

      // Validate required fields
      if (!assignmentData.driverId || !assignmentData.restaurantId || 
          !assignmentData.assignmentDate || !assignmentData.pickupTime ||
          !assignmentData.estimatedDeliveries || !assignmentData.paymentRate) {
        res.status(400).json({ 
          error: 'Missing required fields: driverId, restaurantId, assignmentDate, pickupTime, estimatedDeliveries, paymentRate' 
        });
        return;
      }

      const assignment = await this.assignmentsService.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      logger.error('Error creating assignment:', { error: error instanceof Error ? error.message : error });
      
      if (error instanceof Error && error.message.includes('Assignment validation failed')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  };

  // PUT /api/assignments/:id - Update assignment (for admin/external use)
  updateAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignmentId = req.params.id;
      const updateData = req.body;

      const assignment = await this.assignmentsService.updateAssignment(assignmentId, updateData);
      res.json(assignment);
    } catch (error) {
      logger.error('Error updating assignment:', { error: error instanceof Error ? error.message : error });
      
      if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update assignment' });
    }
  };

  // DELETE /api/assignments/:id - Delete assignment (for admin/external use)
  deleteAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignmentId = req.params.id;

      await this.assignmentsService.deleteAssignment(assignmentId);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting assignment:', { error: error instanceof Error ? error.message : error });
      
      if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }
      
      if (error instanceof Error && error.message.includes('Cannot delete')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to delete assignment' });
    }
  };
} 