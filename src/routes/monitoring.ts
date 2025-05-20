import { Router, Request, Response } from 'express';
import { prisma } from '../app';

export const monitoringRouter = Router();

monitoringRouter.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'driver-server'
    };
    
    res.json(status);
  } catch (error) {
    const status = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      service: 'driver-server',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(503).json(status);
  }
}); 