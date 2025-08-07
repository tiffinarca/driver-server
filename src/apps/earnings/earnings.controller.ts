import { Request, Response } from 'express';
import { EarningsService } from './earnings.service';

export class EarningsController {
  private earningsService: EarningsService;

  constructor(earningsService: EarningsService) {
    this.earningsService = earningsService;
  }

  async getEarnings(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId || String(req.user?.id || ''));
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!driverId || isNaN(driverId)) {
        return res.status(400).json({ error: 'Valid Driver ID is required' });
      }

      const result = await this.earningsService.getEarningsByDriver(driverId, page, limit);
      
      res.json({
        success: true,
        data: result.earnings,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch earnings' 
      });
    }
  }

  async getEarningsSummary(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId || String(req.user?.id || ''));

      if (!driverId || isNaN(driverId)) {
        return res.status(400).json({ error: 'Valid Driver ID is required' });
      }

      const summary = await this.earningsService.getEarningsSummary(driverId);
      
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch earnings summary' 
      });
    }
  }

  async getDailyEarnings(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId || String(req.user?.id || ''));
      const { date } = req.params;

      if (!driverId || isNaN(driverId)) {
        return res.status(400).json({ error: 'Valid Driver ID is required' });
      }

      if (!date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      const dailyEarnings = await this.earningsService.getDailyEarnings(driverId, date);
      
      res.json({
        success: true,
        data: dailyEarnings,
      });
    } catch (error) {
      console.error('Error fetching daily earnings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch daily earnings' 
      });
    }
  }

  async getWeeklyEarnings(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId || String(req.user?.id || ''));
      const { week } = req.params;

      if (!driverId || isNaN(driverId)) {
        return res.status(400).json({ error: 'Valid Driver ID is required' });
      }

      if (!week) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(week)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      const weeklyEarnings = await this.earningsService.getWeeklyEarnings(driverId, week);
      
      res.json({
        success: true,
        data: weeklyEarnings,
      });
    } catch (error) {
      console.error('Error fetching weekly earnings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch weekly earnings' 
      });
    }
  }

  async getPendingEarnings(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId || String(req.user?.id || ''));

      if (!driverId || isNaN(driverId)) {
        return res.status(400).json({ error: 'Valid Driver ID is required' });
      }

      const pendingEarnings = await this.earningsService.getPendingEarnings(driverId);
      
      res.json({
        success: true,
        data: pendingEarnings,
      });
    } catch (error) {
      console.error('Error fetching pending earnings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch pending earnings' 
      });
    }
  }

  async getEarningById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Earning ID is required' });
      }

      const earning = await this.earningsService.getEarningById(id);
      
      if (!earning) {
        return res.status(404).json({ 
          success: false, 
          error: 'Earning not found' 
        });
      }

      res.json({
        success: true,
        data: earning,
      });
    } catch (error) {
      console.error('Error fetching earning:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch earning' 
      });
    }
  }

  async updateEarning(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Earning ID is required' });
      }

      const updatedEarning = await this.earningsService.updateEarning(id, updateData);
      
      res.json({
        success: true,
        data: updatedEarning,
      });
    } catch (error) {
      console.error('Error updating earning:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update earning' 
      });
    }
  }

  async calculateEarningsForAssignment(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;

      if (!assignmentId) {
        return res.status(400).json({ error: 'Assignment ID is required' });
      }

      await this.earningsService.calculateEarningsForAssignment(assignmentId);
      
      res.json({
        success: true,
        message: 'Earnings calculated successfully for assignment',
      });
    } catch (error) {
      console.error('Error calculating earnings for assignment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate earnings for assignment' 
      });
    }
  }

  async calculateEarningsForDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;

      if (!deliveryId) {
        return res.status(400).json({ error: 'Delivery ID is required' });
      }

      await this.earningsService.calculateEarningsForDelivery(deliveryId);
      
      res.json({
        success: true,
        message: 'Earnings calculated successfully for delivery',
      });
    } catch (error) {
      console.error('Error calculating earnings for delivery:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate earnings for delivery' 
      });
    }
  }
} 