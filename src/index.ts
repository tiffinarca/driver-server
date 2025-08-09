import { server } from './app';
import { prisma } from './app';
import logger from './config/logger';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connection established');

    server.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Socket.IO is available on ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer(); 