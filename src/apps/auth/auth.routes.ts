import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { prisma } from '../../app';
import { authenticateToken } from '../../middleware/auth';

const authService = new AuthService(prisma);
const authController = new AuthController(authService);
const authRouter = Router();

// Public routes
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/verify-email', authController.verifyEmail);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/magic-link', authController.requestMagicLink);
authRouter.get('/verify-magic-link', authController.verifyMagicLink);

// Protected routes
authRouter.post('/change-password', authenticateToken, authController.changePassword);

export { authRouter }; 