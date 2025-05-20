import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../setup';
import * as bcrypt from 'bcryptjs';
import { createMockUser } from '../helpers/test.utils';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../utils/email.service';
import { createAuthRouter } from '../../apps/auth/auth.routes';
import express from 'express';

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret') as { userId: number };
      req.user = { id: decoded.userId };
      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid token' });
    }
  }
}));

describe('Auth Integration Tests', () => {
  const baseUrl = '/api/auth';
  let testApp: express.Application;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create a fresh Express app for each test
    testApp = express();
    testApp.use(express.json());
    
    // Set up the auth routes with our mocked prisma
    const authRouter = createAuthRouter(prismaMock);
    testApp.use('/api/auth', authRouter);
  });

  describe('POST /register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should register a new user successfully', async () => {
      const mockUser = createMockUser({
        email: registerData.email,
        name: registerData.name,
        password: 'hashed_password',
        verificationToken: 'mock_token',
        verified: false
      });

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);
      (sendEmail as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await request(testApp)
        .post(`${baseUrl}/register`)
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should return 400 for existing email', async () => {
      const existingUser = createMockUser({ email: registerData.email });
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const response = await request(testApp)
        .post(`${baseUrl}/register`)
        .send(registerData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser({
        email: loginData.email,
        password: 'hashed_password',
        verified: true
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const response = await request(testApp)
        .post(`${baseUrl}/login`)
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const mockUser = createMockUser({
        email: loginData.email,
        password: 'hashed_password'
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const response = await request(testApp)
        .post(`${baseUrl}/login`)
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for unverified user', async () => {
      const mockUser = createMockUser({
        email: loginData.email,
        password: 'hashed_password',
        verified: false
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const response = await request(testApp)
        .post(`${baseUrl}/login`)
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Please verify your email first');
    });
  });

  describe('POST /magic-link', () => {
    it('should send magic link successfully', async () => {
      const email = 'test@example.com';
      
      const response = await request(testApp)
        .post(`${baseUrl}/magic-link`)
        .send({ email });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Magic link sent to email');
    });
  });

  describe('Protected Routes', () => {
    describe('POST /change-password', () => {
      const changePasswordData = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      it('should change password with valid token', async () => {
        const mockUser = createMockUser({
          password: 'hashed_old_password'
        });

        const token = jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET || 'test-jwt-secret');

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
        prismaMock.user.update.mockResolvedValue({
          ...mockUser,
          password: 'hashed_new_password'
        });

        const response = await request(testApp)
          .post(`${baseUrl}/change-password`)
          .set('Authorization', `Bearer ${token}`)
          .send(changePasswordData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Password changed successfully');
        expect(response.body.user).toBeDefined();
      });

      it('should return 401 without token', async () => {
        const response = await request(testApp)
          .post(`${baseUrl}/change-password`)
          .send(changePasswordData);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Authentication required');
      });
    });
  });
}); 