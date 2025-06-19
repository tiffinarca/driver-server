import { PrismaClient, User, DriverStatus } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed_password',
  verificationToken: null,
  verified: true,
  resetPasswordToken: null,
  resetPasswordExpires: null,
  magicLinkToken: null,
  magicLinkExpires: null,
  driverStatus: DriverStatus.ACTIVE,
  profileImageUrl: null,
  profileImagePublicId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const generateTestToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-jwt-secret', { expiresIn: '24h' });
};

export const mockRequest = () => {
  const req: any = {};
  req.body = jest.fn().mockReturnValue(req);
  req.params = jest.fn().mockReturnValue(req);
  req.query = jest.fn().mockReturnValue(req);
  return req;
};

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = () => jest.fn(); 