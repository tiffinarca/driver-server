import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createUserRouter } from './apps/user/user.routes';
import { createAuthRouter } from './apps/auth/auth.routes';
import { monitoringRouter } from './routes/monitoring';

// Initialize Prisma Client with error handling
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const app = express();

app.use(express.json());

// Initialize the app asynchronously
async function initializeApp() {
  try {
    // Ensure database connection before setting up routes
    await prisma.$connect();
    console.log('Successfully connected to the database');

    // Create routers with the initialized prisma instance
    const authRouter = createAuthRouter(prisma);
    const userRouter = createUserRouter(prisma);

    // Routes - only set up after database is connected
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/monitoring', monitoringRouter);

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });

    console.log('All routes have been initialized successfully');
  } catch (error) {
    console.error('Failed to initialize the app:', error);
    process.exit(1);
  }
}

// Cleanup Prisma when the app is shutting down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Initialize the app
initializeApp().catch(console.error);

export default app; 