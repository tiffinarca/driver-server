import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './logger';
import { prisma } from '../app';

export interface SocketUser {
  userId: number;
  driverId?: number;
  socketId: string;
}

export class SocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Handle driver authentication
      socket.on('driver:authenticate', async (data: { userId: number, driverId: number }) => {
        try {
          // Verify the user is a driver
          const user = await prisma.user.findUnique({
            where: { id: data.userId },
            select: { id: true, driverStatus: true }
          });

          if (!user || user.driverStatus === 'PENDING') {
            socket.emit('error', { message: 'Unauthorized or pending driver' });
            return;
          }

          const socketUser: SocketUser = {
            userId: data.userId,
            driverId: data.driverId,
            socketId: socket.id
          };

          this.connectedUsers.set(socket.id, socketUser);
          
          // Join driver-specific room
          socket.join(`driver:${data.driverId}`);
          socket.join(`user:${data.userId}`);

          logger.info(`Driver authenticated: ${data.driverId} (User: ${data.userId})`);
          socket.emit('driver:authenticated', { success: true });
        } catch (error) {
          logger.error('Driver authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Handle assignment updates
      socket.on('assignment:update', async (data: { assignmentId: string, status: string }) => {
        try {
          const assignment = await prisma.restaurantAssignment.update({
            where: { id: data.assignmentId },
            data: { status: data.status as any },
            include: { driver: true }
          });

          // Notify the specific driver
          this.io.to(`driver:${assignment.driverId}`).emit('assignment:updated', {
            assignmentId: data.assignmentId,
            status: data.status,
            assignment
          });

          logger.info(`Assignment ${data.assignmentId} status updated to ${data.status}`);
        } catch (error) {
          logger.error('Assignment update error:', error);
          socket.emit('error', { message: 'Failed to update assignment' });
        }
      });

      // Handle delivery updates
      socket.on('delivery:update', async (data: { deliveryId: string, status: string, proofImageUrl?: string }) => {
        try {
          const delivery = await prisma.delivery.update({
            where: { id: data.deliveryId },
            data: { 
              status: data.status as any,
              proofImageUrl: data.proofImageUrl,
              deliveredAt: data.status === 'DELIVERED' ? new Date() : null
            },
            include: { assignment: { include: { driver: true } } }
          });

          // Notify the driver
          this.io.to(`driver:${delivery.assignment.driverId}`).emit('delivery:updated', {
            deliveryId: data.deliveryId,
            status: data.status,
            delivery
          });

          logger.info(`Delivery ${data.deliveryId} status updated to ${data.status}`);
        } catch (error) {
          logger.error('Delivery update error:', error);
          socket.emit('error', { message: 'Failed to update delivery' });
        }
      });

      // Handle location updates
      socket.on('location:update', (data: { latitude: number, longitude: number }) => {
        const user = this.connectedUsers.get(socket.id);
        if (user?.driverId) {
          // Broadcast location to relevant parties (could be admin dashboard, etc.)
          this.io.to(`driver:${user.driverId}`).emit('location:updated', {
            driverId: user.driverId,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date()
          });
        }
      });

      // Handle availability updates
      socket.on('availability:update', async (data: { isAvailable: boolean }) => {
        const user = this.connectedUsers.get(socket.id);
        if (user?.driverId) {
          try {
            await prisma.user.update({
              where: { id: user.userId },
              data: { driverStatus: data.isAvailable ? 'ACTIVE' : 'SUSPENDED' }
            });

            this.io.to(`driver:${user.driverId}`).emit('availability:updated', {
              driverId: user.driverId,
              isAvailable: data.isAvailable
            });

            logger.info(`Driver ${user.driverId} availability updated: ${data.isAvailable}`);
          } catch (error) {
            logger.error('Availability update error:', error);
            socket.emit('error', { message: 'Failed to update availability' });
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // Public methods for external use
  public getIO(): SocketIOServer {
    return this.io;
  }

  public emitToDriver(driverId: number, event: string, data: any) {
    this.io.to(`driver:${driverId}`).emit(event, data);
  }

  public emitToUser(userId: number, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public getConnectedDrivers(): SocketUser[] {
    return Array.from(this.connectedUsers.values()).filter(user => user.driverId);
  }
}

export let socketManager: SocketManager;

export function initializeSocket(server: HTTPServer): SocketManager {
  socketManager = new SocketManager(server);
  return socketManager;
} 