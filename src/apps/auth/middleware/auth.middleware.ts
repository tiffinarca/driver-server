import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
      };
    }
  }
}

export class AuthMiddleware {
  private prisma: PrismaClient;
  private jwtSecret: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  // Verify JWT token and attach user to request
  authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      req.user = { id: decoded.userId };
      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid token' });
    }
  };

  // Verify JWT token and load full user data
  authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      // First verify the JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      
      // Then fetch the user from database
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email
      };

      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid token' });
    }
  };

  // Generate JWT token for user
  generateToken(userId: number): string {
    return jwt.sign({ userId }, this.jwtSecret, {
      expiresIn: '24h' // Token expires in 24 hours
    });
  }
} 