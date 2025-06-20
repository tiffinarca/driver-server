import { Request, Response } from 'express';
import { DriversService } from './drivers.service';
import { 
  CreateServiceAreaDto, 
  UpdateServiceAreaDto,
  UpdateScheduleDto,
  UpdateWeeklyScheduleDto,
  CreateAvailabilityBlockDto
} from './drivers.types';

export class DriversController {
  private driversService: DriversService;

  constructor(driversService: DriversService) {
    this.driversService = driversService;
  }

  // GET /api/drivers/service-areas
  getServiceAreas = async (req: Request, res: Response): Promise<void> => {
    try {
      // The driver ID will come from the authenticated user
      const driverId = req.user?.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const serviceAreas = await this.driversService.getDriverServiceAreas(driverId);
      
      res.json({
        success: true,
        data: {
          serviceAreas,
          total: serviceAreas.length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get service areas' 
      });
    }
  };

  // POST /api/drivers/service-areas
  createServiceArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const serviceAreaData = req.body as CreateServiceAreaDto;
      
      // Basic validation
      if (!serviceAreaData.areaName || !serviceAreaData.city || !serviceAreaData.state) {
        res.status(400).json({ 
          success: false,
          error: 'Area name, city, and state are required' 
        });
        return;
      }

      if (typeof serviceAreaData.latitude !== 'number' || typeof serviceAreaData.longitude !== 'number') {
        res.status(400).json({ 
          success: false,
          error: 'Valid latitude and longitude coordinates are required' 
        });
        return;
      }

      const serviceArea = await this.driversService.createServiceArea(driverId, serviceAreaData);
      
      res.status(201).json({
        success: true,
        message: 'Service area created successfully',
        data: serviceArea
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ 
          success: false,
          error: error.message 
        });
      } else {
        res.status(400).json({ 
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create service area' 
        });
      }
    }
  };

  // PUT /api/drivers/service-areas/:id
  updateServiceArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      const serviceAreaId = req.params.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!serviceAreaId) {
        res.status(400).json({ 
          success: false,
          error: 'Service area ID is required' 
        });
        return;
      }

      const updateData = req.body as UpdateServiceAreaDto;
      
      // Basic validation for coordinates if provided
      if (updateData.latitude !== undefined && typeof updateData.latitude !== 'number') {
        res.status(400).json({ 
          success: false,
          error: 'Invalid latitude coordinate' 
        });
        return;
      }

      if (updateData.longitude !== undefined && typeof updateData.longitude !== 'number') {
        res.status(400).json({ 
          success: false,
          error: 'Invalid longitude coordinate' 
        });
        return;
      }

      const serviceArea = await this.driversService.updateServiceArea(serviceAreaId, driverId, updateData);
      
      res.json({
        success: true,
        message: 'Service area updated successfully',
        data: serviceArea
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('Unauthorized')) {
          res.status(403).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('already exists')) {
          res.status(409).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to update service area' 
        });
      }
    }
  };

  // DELETE /api/drivers/service-areas/:id
  deleteServiceArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      const serviceAreaId = req.params.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!serviceAreaId) {
        res.status(400).json({ 
          success: false,
          error: 'Service area ID is required' 
        });
        return;
      }

      await this.driversService.deleteServiceArea(serviceAreaId, driverId);
      
      res.json({
        success: true,
        message: 'Service area deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('Unauthorized')) {
          res.status(403).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to delete service area' 
        });
      }
    }
  };

  // Schedule methods
  // GET /api/drivers/schedules
  getSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const schedule = await this.driversService.getDriverSchedule(driverId);
      
      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get schedule' 
      });
    }
  };

  // PUT /api/drivers/schedules
  updateWeeklySchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const scheduleData = req.body as UpdateWeeklyScheduleDto;
      
      if (!scheduleData.schedules || !Array.isArray(scheduleData.schedules)) {
        res.status(400).json({ 
          success: false,
          error: 'Schedules array is required' 
        });
        return;
      }

      // Validate each schedule item
      for (const schedule of scheduleData.schedules) {
        if (typeof schedule.dayOfWeek !== 'number' || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
          res.status(400).json({ 
            success: false,
            error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' 
          });
          return;
        }

        if (!schedule.startTime || !schedule.endTime) {
          res.status(400).json({ 
            success: false,
            error: 'Start time and end time are required for each schedule' 
          });
          return;
        }
      }

      const updatedSchedule = await this.driversService.updateWeeklySchedule(driverId, scheduleData);
      
      res.json({
        success: true,
        message: 'Weekly schedule updated successfully',
        data: updatedSchedule
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update weekly schedule' 
      });
    }
  };

  // PUT /api/drivers/schedules/:day
  updateDaySchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      const dayOfWeek = parseInt(req.params.day);
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        res.status(400).json({ 
          success: false,
          error: 'Day must be between 0 (Sunday) and 6 (Saturday)' 
        });
        return;
      }

      const updateData = req.body as UpdateScheduleDto;
      
      const updatedSchedule = await this.driversService.updateDaySchedule(driverId, dayOfWeek, updateData);
      
      res.json({
        success: true,
        message: 'Day schedule updated successfully',
        data: updatedSchedule
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to update day schedule' 
        });
      }
    }
  };

  // Availability blocking methods
  // POST /api/drivers/availability/block
  createAvailabilityBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const blockData = req.body as CreateAvailabilityBlockDto;
      
      if (!blockData.blockedDate) {
        res.status(400).json({ 
          success: false,
          error: 'Blocked date is required (YYYY-MM-DD format)' 
        });
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(blockData.blockedDate)) {
        res.status(400).json({ 
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
        return;
      }

      // If not full day, validate time fields
      if (!blockData.isFullDay && (!blockData.startTime || !blockData.endTime)) {
        res.status(400).json({ 
          success: false,
          error: 'Start time and end time are required for partial day blocks' 
        });
        return;
      }

      const block = await this.driversService.createAvailabilityBlock(driverId, blockData);
      
      res.status(201).json({
        success: true,
        message: 'Availability block created successfully',
        data: block
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create availability block' 
      });
    }
  };

  // DELETE /api/drivers/availability/block/:id
  deleteAvailabilityBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = req.user?.id;
      const blockId = req.params.id;
      
      if (!driverId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!blockId) {
        res.status(400).json({ 
          success: false,
          error: 'Block ID is required' 
        });
        return;
      }

      await this.driversService.deleteAvailabilityBlock(blockId, driverId);
      
      res.json({
        success: true,
        message: 'Availability block deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('Unauthorized')) {
          res.status(403).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to delete availability block' 
        });
      }
    }
  };
} 