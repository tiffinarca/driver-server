import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import Transport from 'winston-transport';

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Environment variables with defaults
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_PATH = process.env.LOG_PATH || 'logs';

// Add colors to Winston
winston.addColors(colors);

// Define the format for development environment
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.splat !== undefined ? `${info.splat}` : ''
    }${
      info.stack ? `\n${info.stack}` : ''
    }${
      info.context ? `\n${JSON.stringify(info.context, null, 2)}` : ''
    }`
  )
);

// Define the format for production environment
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports: Transport[] = [
  // Always write to console
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Rotate file for all logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_PATH, 'all-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: productionFormat,
    }) as Transport
  );

  // Separate file for error logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_PATH, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: productionFormat,
    }) as Transport
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Create a stream object for Morgan integration
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger; 

/**
 * 
 * Usage:
 * import { logger } from '../config/logger';

    // Different log levels
    logger.error('Error message', { error: err.message, stack: err.stack });
    logger.warn('Warning message', { context: 'additional info' });
    logger.info('Info message', { data: someData });
    logger.http('HTTP request details');
    logger.debug('Debug information', { debug: details });
 */