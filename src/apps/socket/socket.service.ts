import { socketManager } from '../../config/socket';
import { logger } from '../../config/logger';
import { PrismaClient } from '@prisma/client';

export class SocketService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Notify driver of new assignment
   */
  async notifyNewAssignment(driverId: number, assignment: any) {
    try {
      socketManager.emitToDriver(driverId, 'assignment:new', {
        assignment,
        timestamp: new Date()
      });
      logger.info(`New assignment notification sent to driver ${driverId}`);
    } catch (error) {
      logger.error(`Failed to notify driver ${driverId} of new assignment:`, error);
    }
  }

  /**
   * Notify driver of assignment status change
   */
  async notifyAssignmentStatusChange(driverId: number, assignmentId: string, status: string) {
    try {
      socketManager.emitToDriver(driverId, 'assignment:status_changed', {
        assignmentId,
        status,
        timestamp: new Date()
      });
      logger.info(`Assignment status change notification sent to driver ${driverId}`);
    } catch (error) {
      logger.error(`Failed to notify driver ${driverId} of assignment status change:`, error);
    }
  }

  /**
   * Notify driver of new delivery
   */
  async notifyNewDelivery(driverId: number, delivery: any) {
    try {
      socketManager.emitToDriver(driverId, 'delivery:new', {
        delivery,
        timestamp: new Date()
      });
      logger.info(`New delivery notification sent to driver ${driverId}`);
    } catch (error) {
      logger.error(`Failed to notify driver ${driverId} of new delivery:`, error);
    }
  }

  /**
   * Notify driver of delivery status change
   */
  async notifyDeliveryStatusChange(driverId: number, deliveryId: string, status: string) {
    try {
      socketManager.emitToDriver(driverId, 'delivery:status_changed', {
        deliveryId,
        status,
        timestamp: new Date()
      });
      logger.info(`Delivery status change notification sent to driver ${driverId}`);
    } catch (error) {
      logger.error(`Failed to notify driver ${driverId} of delivery status change:`, error);
    }
  }

  /**
   * Notify admin/system of driver location update
   */
  async notifyDriverLocationUpdate(driverId: number, latitude: number, longitude: number) {
    try {
      // Emit to admin dashboard or monitoring systems
      socketManager.getIO().to('admin').emit('driver:location_updated', {
        driverId,
        latitude,
        longitude,
        timestamp: new Date()
      });
      logger.info(`Driver location update broadcast for driver ${driverId}`);
    } catch (error) {
      logger.error(`Failed to broadcast driver location update for driver ${driverId}:`, error);
    }
  }

  /**
   * Notify driver of route optimization updates
   */
  async notifyRouteOptimization(driverId: number, routeData: any) {
    try {
      socketManager.emitToDriver(driverId, 'route:optimized', {
        routeData,
        timestamp: new Date()
      });
      logger.info(`Route optimization notification sent to driver ${driverId}`);
    } catch (error) {
      logger.error(`Failed to notify driver ${driverId} of route optimization:`, error);
    }
  }

  /**
   * Notify driver of payment updates
   */
  async notifyPaymentUpdate(driverId: number, paymentData: any) {
    try {
      socketManager.emitToDriver(driverId, 'payment:updated', {
        paymentData,
        timestamp: new Date()
      });
      logger.info(`Payment update notification sent to driver ${driverId}`);
    } catch (error) {
      logger.error(`Failed to notify driver ${driverId} of payment update:`, error);
    }
  }

  /**
   * Notify driver of system maintenance or announcements
   */
  async notifySystemAnnouncement(message: string, driverIds?: number[]) {
    try {
      if (driverIds) {
        // Send to specific drivers
        driverIds.forEach(driverId => {
          socketManager.emitToDriver(driverId, 'system:announcement', {
            message,
            timestamp: new Date()
          });
        });
        logger.info(`System announcement sent to ${driverIds.length} drivers`);
      } else {
        // Broadcast to all connected drivers
        socketManager.getIO().to('drivers').emit('system:announcement', {
          message,
          timestamp: new Date()
        });
        logger.info('System announcement broadcast to all drivers');
      }
    } catch (error) {
      logger.error('Failed to send system announcement:', error);
    }
  }

  /**
   * Get connected drivers count
   */
  getConnectedDriversCount(): number {
    return socketManager.getConnectedDrivers().length;
  }

  /**
   * Get connected drivers list
   */
  getConnectedDrivers() {
    return socketManager.getConnectedDrivers();
  }

  /**
   * Check if a specific driver is connected
   */
  isDriverConnected(driverId: number): boolean {
    return socketManager.getConnectedDrivers().some(driver => driver.driverId === driverId);
  }
}

export function createSocketService(prisma: PrismaClient): SocketService {
  return new SocketService(prisma);
} 