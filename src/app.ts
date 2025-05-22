import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createUserRouter } from './apps/user/user.routes';
import { createAuthRouter } from './apps/auth/auth.routes';
import { monitoringRouter } from './routes/monitoring';
import { redis } from './config/redis';
import { logger } from './config/logger';

// Initialize Prisma Client with error handling
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const app = express();

app.use(express.json());

// Initialize the app asynchronously
async function initializeApp() {
  try {
    // Ensure database and Redis connections before setting up routes
    await Promise.all([
      prisma.$connect(),
      redis.ping()  // Test Redis connection
    ]);
    logger.info('Successfully connected to the database and Redis');

    // Create routers with the initialized prisma instance
    const authRouter = createAuthRouter(prisma);
    const userRouter = createUserRouter(prisma);

    // Routes - only set up after connections are established
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
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

export default app; 