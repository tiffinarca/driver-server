import { Request, Response } from 'express';
import { DriversService } from './drivers.service';
import { CreateServiceAreaDto, UpdateServiceAreaDto } from './drivers.types';

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
} 