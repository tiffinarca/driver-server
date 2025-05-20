import { AuthService } from '../../apps/auth/auth.service';
import { prismaMock } from '../setup';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { createMockUser } from '../helpers/test.utils';

// Add type for mock implementation
type BcryptMock = jest.SpyInstance<Promise<string>, [string | Buffer, string | number]>;
type BcryptCompareMock = jest.SpyInstance<Promise<boolean>, [string, string]>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(prismaMock);
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should successfully register a new user', async () => {
      const mockUser = createMockUser({
        email: registerData.email,
        name: registerData.name,
        password: 'hashed_password',
        verificationToken: 'mock_token',
        verified: false
      });

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await authService.register(registerData);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
      expect(prismaMock.user.create).toHaveBeenCalled();
    });

    it('should throw error for existing email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser());

      await expect(authService.register(registerData))
        .rejects
        .toThrow('Email already registered');
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should successfully login a verified user', async () => {
      const mockUser = createMockUser({
        email: loginData.email,
        verified: true
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await authService.login(loginData);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginData))
        .rejects
        .toThrow('Invalid credentials');
    });

    it('should throw error for incorrect password', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(authService.login(loginData))
        .rejects
        .toThrow('Invalid credentials');
    });

    it('should throw error for unverified user', async () => {
      const mockUser = createMockUser({ verified: false });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(authService.login(loginData))
        .rejects
        .toThrow('Please verify your email first');
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const mockUser = createMockUser({
        verificationToken: 'valid_token',
        verified: false
      });

      const updatedUser = createMockUser({
        ...mockUser,
        verified: true,
        verificationToken: null
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await authService.verifyEmail('valid_token');

      expect(result.verified).toBe(true);
      expect(result.verificationToken).toBeNull();
    });

    it('should throw error for invalid token', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid_token'))
        .rejects
        .toThrow('Invalid verification token');
    });
  });

  describe('magic link authentication', () => {
    const email = 'test@example.com';

    it('should create magic link for existing user', async () => {
      const mockUser = {
        id: 1,
        email,
        verified: true
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, magicLinkToken: 'token' } as any);

      await authService.createMagicLink(email);

      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it('should create new user when requesting magic link for non-existent email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ id: 1, email } as any);

      await authService.createMagicLink(email);

      expect(prismaMock.user.create).toHaveBeenCalled();
    });

    it('should verify valid magic link', async () => {
      const mockUser = {
        id: 1,
        email,
        magicLinkToken: 'valid_token',
        magicLinkExpires: new Date(Date.now() + 3600000)
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, verified: true } as any);

      const result = await authService.verifyMagicLink('valid_token');

      expect(result.user.verified).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should throw error for expired magic link', async () => {
      const mockUser = {
        id: 1,
        email,
        magicLinkToken: 'expired_token',
        magicLinkExpires: new Date(Date.now() - 3600000)
      };

      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(authService.verifyMagicLink('expired_token'))
        .rejects
        .toThrow('Invalid or expired magic link');
    });
  });

  describe('password reset', () => {
    const email = 'test@example.com';

    it('should initiate password reset for existing user', async () => {
      const mockUser = {
        id: 1,
        email
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, resetPasswordToken: 'token' } as any);

      await authService.initiatePasswordReset(email);

      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it('should silently handle password reset for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await authService.initiatePasswordReset(email);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
      const mockUser = createMockUser({
        resetPasswordToken: 'valid_token',
        resetPasswordExpires: new Date(Date.now() + 3600000)
      });

      const updatedUser = createMockUser({
        ...mockUser,
        password: 'new_hashed_password',
        resetPasswordToken: null,
        resetPasswordExpires: null
      });

      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await authService.resetPassword({
        token: 'valid_token',
        newPassword: 'newPassword123'
      });

      expect(result.resetPasswordToken).toBeNull();
      expect(result.resetPasswordExpires).toBeNull();
    });

    it('should throw error for expired reset token', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(authService.resetPassword({
        token: 'expired_token',
        newPassword: 'newPassword123'
      }))
        .rejects
        .toThrow('Invalid or expired reset token');
    });
  });
}); 