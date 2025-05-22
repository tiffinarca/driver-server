import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from './auth.types';

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  register = async (req: Request<{}, {}, RegisterDto>, res: Response): Promise<void> => {
    try {
      const { user, token } = await this.authService.register(req.body);
      res.status(201).json({ user, token });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
  };

  login = async (req: Request<{}, {}, LoginDto>, res: Response): Promise<void> => {
    try {
      const { user, token } = await this.authService.login(req.body);
      res.json({ user, token });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.authService.verifyEmail(req.query.token as string);
      res.json({ message: 'Email verified successfully', user });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Verification failed' });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.authService.initiatePasswordReset(req.body.email);
      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      // Always return success to prevent email enumeration
      res.json({ message: 'Password reset email sent' });
    }
  };

  resetPassword = async (req: Request<{}, {}, ResetPasswordDto>, res: Response): Promise<void> => {
    try {
      const user = await this.authService.resetPassword(req.body);
      res.json({ message: 'Password reset successfully', user });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Password reset failed' });
    }
  };

  changePassword = async (req: Request<{}, {}, ChangePasswordDto>, res: Response): Promise<void> => {
    try {
      // userId should come from authenticated session
      const userId = (req as any).user.id;
      const user = await this.authService.changePassword(userId, req.body);
      res.json({ message: 'Password changed successfully', user });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Password change failed' });
    }
  };

  requestMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.authService.createMagicLink(req.body.email);
      res.json({ message: 'Magic link sent to email' });
    } catch (error) {
      // Always return success to prevent email enumeration
      res.json({ message: 'Magic link sent to email' });
    }
  };

  verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user, token } = await this.authService.verifyMagicLink(req.query.token as string);
      res.json({ user, token });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid magic link' });
    }
  };

  getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const user = await this.authService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get user profile' });
    }
  };
} 