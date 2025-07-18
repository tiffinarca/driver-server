import { Router } from 'express';
import { createSocketService } from './socket.service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

export function createSocketRouter(prisma: PrismaClient): Router {
  const router = Router();
  const socketService = createSocketService(prisma);

  // Get connected drivers count
  router.get('/connected-drivers/count', async (req, res) => {
    try {
      const count = socketService.getConnectedDriversCount();
      res.json({ 
        connectedDrivers: count,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error getting connected drivers count:', error);
      res.status(500).json({ error: 'Failed to get connected drivers count' });
    }
  });

  // Get connected drivers list
  router.get('/connected-drivers', async (req, res) => {
    try {
      const drivers = socketService.getConnectedDrivers();
      res.json({ 
        drivers,
        count: drivers.length,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error getting connected drivers:', error);
      res.status(500).json({ error: 'Failed to get connected drivers' });
    }
  });

  // Check if specific driver is connected
  router.get('/connected-drivers/:driverId', async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      if (isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      const isConnected = socketService.isDriverConnected(driverId);
      res.json({ 
        driverId,
        isConnected,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error checking driver connection:', error);
      res.status(500).json({ error: 'Failed to check driver connection' });
    }
  });

  // Send system announcement
  router.post('/announcements', async (req, res) => {
    try {
      const { message, driverIds } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      await socketService.notifySystemAnnouncement(message, driverIds);
      res.json({ 
        success: true,
        message: 'Announcement sent successfully',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error sending announcement:', error);
      res.status(500).json({ error: 'Failed to send announcement' });
    }
  });

  // Get socket server status
  router.get('/status', async (req, res) => {
    try {
      const connectedDrivers = socketService.getConnectedDrivers();
      
      res.json({
        status: 'running',
        connectedDrivers: connectedDrivers.length,
        uptime: process.uptime(),
        timestamp: new Date(),
        features: {
          realTimeTracking: true,
          assignmentNotifications: true,
          deliveryUpdates: true,
          routeOptimization: true,
          systemAnnouncements: true
        }
      });
    } catch (error) {
      logger.error('Error getting socket status:', error);
      res.status(500).json({ error: 'Failed to get socket status' });
    }
  });

  return router;
} 