import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock PrismaClient
export const prismaMock = mockDeep<PrismaClient>();
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock)
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock email service
jest.mock('../utils/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined)
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.APP_URL = 'http://localhost:3000';

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 