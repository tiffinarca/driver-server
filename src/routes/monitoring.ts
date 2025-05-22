import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { redis } from '../config/redis';

export const monitoringRouter = Router();

monitoringRouter.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database and Redis connections
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      redis.ping()
    ]);
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: 'connected',
      service: 'driver-server'
    };
    
    res.json(status);
  } catch (error) {
    const status = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: error instanceof Error && error.message.includes('prisma') ? 'disconnected' : 'connected',
      redis: error instanceof Error && error.message.includes('redis') ? 'disconnected' : 'connected',
      service: 'driver-server',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(503).json(status);
  }
}); 