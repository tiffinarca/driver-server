import Redis from 'ioredis';
import { logger } from './logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    // Retry connection every 5 seconds for up to 5 attempts
    const delay = Math.min(times * 5000, 20000);
    return delay;
  },
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Successfully connected to Redis');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', { 
    error: error.message,
    stack: error.stack 
  });
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, closing Redis connection...');
  await redis.quit();
  logger.info('Redis connection closed');
  process.exit(0);
});

export default redis; 