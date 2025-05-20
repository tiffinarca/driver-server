import express from 'express';
import { PrismaClient } from '@prisma/client';
import { monitoringRouter } from './routes/monitoring';

export const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Health check route
app.use('/api/monitoring', monitoringRouter);

export default app; 