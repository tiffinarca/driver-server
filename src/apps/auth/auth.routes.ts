import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthMiddleware } from './middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

// Export a function that creates the router with an initialized prisma instance
export function createAuthRouter(prisma: PrismaClient) {
  const authService = new AuthService(prisma);
  const authController = new AuthController(authService);
  const authMiddleware = new AuthMiddleware(prisma);
  const authRouter = Router();

  // Public routes (no authentication needed)
  authRouter.post('/register', authController.register);
  authRouter.post('/login', authController.login);
  authRouter.post('/forgot-password', authController.forgotPassword);
  authRouter.post('/reset-password', authController.resetPassword);
  authRouter.post('/magic-link', authController.requestMagicLink);
  authRouter.get('/verify-magic-link', authController.verifyMagicLink);
  authRouter.get('/verify-email', 
    authController.verifyEmail
  );

  // Protected routes - require full user authentication
  authRouter.post('/change-password', 
    authMiddleware.authenticateUser,
    authController.changePassword
  );

  authRouter.get('/me', 
    authMiddleware.authenticateUser,
    authController.getCurrentUser
  );

  return authRouter;
} 