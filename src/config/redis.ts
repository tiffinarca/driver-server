import Redis from 'ioredis';

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
  console.log('Successfully connected to Redis');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

process.on('SIGTERM', async () => {
  await redis.quit();
  process.exit(0);
});

export default redis; 