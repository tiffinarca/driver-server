import { Request, Response } from 'express';
import { DeliveriesService, CompleteDeliveryRequest, FailDeliveryRequest } from './deliveries.service';

export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  /**
   * GET /api/assignments/:id/deliveries - List all deliveries for assignment
   */
  getDeliveriesForAssignment = async (req: Request, res: Response) => {
    try {
      const { id: assignmentId } = req.params;

      const deliveries = await this.deliveriesService.getDeliveriesForAssignment(assignmentId);

      res.json({
        success: true,
        data: deliveries,
      });
    } catch (error) {
      console.error('Error getting deliveries for assignment:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get deliveries',
      });
    }
  };

  /**
   * GET /api/deliveries/:id - Get delivery details
   */
  getDeliveryById = async (req: Request, res: Response) => {
    try {
      const { id: deliveryId } = req.params;

      const delivery = await this.deliveriesService.getDeliveryById(deliveryId);

      if (!delivery) {
        return res.status(404).json({
          error: 'Delivery not found',
          message: 'The requested delivery was not found',
        });
      }

      res.json({
        success: true,
        data: delivery,
      });
    } catch (error) {
      console.error('Error getting delivery:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get delivery',
      });
    }
  };

  /**
   * PUT /api/deliveries/:id/pickup - Mark as picked up (bulk action handled in assignment start)
   */
  markAsPickedUp = async (req: Request, res: Response) => {
    try {
      const { id: deliveryId } = req.params;

      const result = await this.deliveriesService.startDelivery(deliveryId);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to mark delivery as picked up',
        });
      }

      res.json({
        success: true,
        data: result.delivery,
        message: 'Delivery marked as picked up',
      });
    } catch (error) {
      console.error('Error marking delivery as picked up:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark delivery as picked up',
      });
    }
  };

  /**
   * PUT /api/deliveries/:id/start - Start delivery (mark as in transit)
   */
  startDelivery = async (req: Request, res: Response) => {
    try {
      const { id: deliveryId } = req.params;

      const result = await this.deliveriesService.startDelivery(deliveryId);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to start delivery',
        });
      }

      res.json({
        success: true,
        data: result.delivery,
        message: 'Delivery started successfully',
      });
    } catch (error) {
      console.error('Error starting delivery:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to start delivery',
      });
    }
  };

  /**
   * PUT /api/deliveries/:id/complete - Complete delivery
   */
  completeDelivery = async (req: Request, res: Response) => {
    try {
      const { id: deliveryId } = req.params;
      const { proofImageUrl, deliveryNotes, deliveredAt } = req.body;

      const request: CompleteDeliveryRequest = {
        deliveryId,
        proofImageUrl,
        deliveryNotes,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
      };

      const result = await this.deliveriesService.completeDelivery(request);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to complete delivery',
        });
      }

      res.json({
        success: true,
        data: result.delivery,
        message: 'Delivery completed successfully',
      });
    } catch (error) {
      console.error('Error completing delivery:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to complete delivery',
      });
    }
  };

  /**
   * POST /api/deliveries/:id/proof - Upload proof of delivery
   */
  uploadProof = async (req: Request, res: Response) => {
    try {
      const { id: deliveryId } = req.params;
      const { proofImageUrl } = req.body;

      if (!proofImageUrl) {
        return res.status(400).json({
          error: 'Missing proof image URL',
          message: 'Proof image URL is required',
        });
      }

      const result = await this.deliveriesService.uploadProofOfDelivery(deliveryId, proofImageUrl);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to upload proof',
        });
      }

      res.json({
        success: true,
        data: result.delivery,
        message: 'Proof uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading proof:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to upload proof',
      });
    }
  };

  /**
   * PUT /api/deliveries/:id/fail - Mark delivery as failed
   */
  failDelivery = async (req: Request, res: Response) => {
    try {
      const { id: deliveryId } = req.params;
      const { reason, notes } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: 'Missing failure reason',
          message: 'Failure reason is required',
        });
      }

      const request: FailDeliveryRequest = {
        deliveryId,
        reason,
        notes,
      };

      const result = await this.deliveriesService.failDelivery(request);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to mark delivery as failed',
        });
      }

      res.json({
        success: true,
        data: result.delivery,
        message: 'Delivery marked as failed',
      });
    } catch (error) {
      console.error('Error failing delivery:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark delivery as failed',
      });
    }
  };

  /**
   * POST /api/deliveries/:id/notes - Add delivery notes
   */
  addNotes = async (req: Request, res: Response) => {
    try {
      const { id: deliveryId } = req.params;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({
          error: 'Missing notes',
          message: 'Notes are required',
        });
      }

      const result = await this.deliveriesService.addDeliveryNotes(deliveryId, notes);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to add notes',
        });
      }

      res.json({
        success: true,
        data: result.delivery,
        message: 'Notes added successfully',
      });
    } catch (error) {
      console.error('Error adding notes:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to add notes',
      });
    }
  };

  /**
   * GET /api/deliveries/search - Search deliveries by client
   */
  searchDeliveries = async (req: Request, res: Response) => {
    try {
      const { status, assignmentId, clientId, page, limit } = req.query;

      const filters = {
        status: status as any,
        assignmentId: assignmentId as string,
        clientId: clientId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await this.deliveriesService.searchDeliveries(filters);

      res.json({
        success: true,
        data: result.deliveries,
        pagination: result.pagination,
        total: result.total,
      });
    } catch (error) {
      console.error('Error searching deliveries:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search deliveries',
      });
    }
  };

  /**
   * GET /api/assignments/:id/deliveries/stats - Get delivery statistics for assignment
   */
  getDeliveryStats = async (req: Request, res: Response) => {
    try {
      const { id: assignmentId } = req.params;

      const stats = await this.deliveriesService.getDeliveryStats(assignmentId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get delivery statistics',
      });
    }
  };
} 