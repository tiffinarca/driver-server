import express from 'express';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { createUserRouter } from './apps/user/user.routes';
import { createAuthRouter } from './apps/auth/auth.routes';
import { createDriversRouter } from './apps/drivers/drivers.routes';
import { createAssignmentsRouter } from './apps/assignments/assignments.routes';
import { createDeliveriesRouter } from './apps/deliveries/deliveries.routes';
import { createSocketRouter } from './apps/socket/socket.routes';
import { monitoringRouter } from './routes/monitoring';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { validateMapboxConfig } from './config/mapbox';
import { initializeSocket } from './config/socket';

// Initialize Prisma Client with error handling
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const app = express();
const server = createServer(app);

app.use(express.json());

// Initialize the app asynchronously
async function initializeApp() {
  try {
    // Validate Mapbox configuration
    try {
      validateMapboxConfig();
      logger.info('Mapbox configuration validated successfully');
    } catch (error) {
      logger.warn('Mapbox configuration validation failed:', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      logger.warn('Route optimization features will not be available');
    }

    // Ensure database and Redis connections before setting up routes
    await Promise.all([
      prisma.$connect(),
      redis.ping()  // Test Redis connection
    ]);
    logger.info('Successfully connected to the database and Redis');

    // Initialize Socket.IO
    initializeSocket(server);
    logger.info('Socket.IO initialized successfully');

    // Create routers with the initialized prisma instance
    const authRouter = createAuthRouter(prisma);
    const userRouter = createUserRouter(prisma);
    const driversRouter = createDriversRouter(prisma);
    const assignmentsRouter = createAssignmentsRouter(prisma);
    const deliveriesRouter = createDeliveriesRouter(prisma);
    const socketRouter = createSocketRouter(prisma);

    // Routes - only set up after connections are established
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/drivers', driversRouter);
    app.use('/api/assignments', assignmentsRouter);
    app.use('/api/deliveries', deliveriesRouter);
    app.use('/api/socket', socketRouter);
    app.use('/api/monitoring', monitoringRouter);

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', { error: err.message, stack: err.stack });
      res.status(500).json({ error: 'Something went wrong!' });
    });

    logger.info('All routes have been initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize the app:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });
    process.exit(1);
  }
}

// Initialize the app
initializeApp();

// Cleanup when the app is shutting down
process.on('beforeExit', async () => {
  logger.info('Application shutting down...');
  await Promise.all([
    prisma.$disconnect(),
    redis.quit()
  ]);
  logger.info('Cleanup completed');
});

export { server };
export default app; 