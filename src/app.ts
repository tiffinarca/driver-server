import express from 'express';
import { PrismaClient } from '@prisma/client';
import { userRouter } from './apps/user/user.routes';
import { monitoringRouter } from './routes/monitoring';

export const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Routes
app.use('/api/users', userRouter);
app.use('/api/monitoring', monitoringRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app; 