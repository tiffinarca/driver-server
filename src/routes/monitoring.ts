import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

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
    
    logger.info('Health check passed', status);
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
    
    logger.error('Health check failed', {
      ...status,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(503).json(status);
  }
}); 