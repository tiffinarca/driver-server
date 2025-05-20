import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from './auth.types';
import { sendEmail } from '../../utils/email.service';

export class AuthService {
  private prisma!: PrismaClient;  // Using definite assignment assertion
  private readonly JWT_SECRET: string;
  private readonly MAGIC_LINK_EXPIRY: number = 30 * 60 * 1000; // 30 minutes
  private readonly RESET_TOKEN_EXPIRY: number = 60 * 60 * 1000; // 1 hour

  constructor(prisma: PrismaClient) {
    if (!prisma) {
      throw new Error('PrismaClient is required but was not provided to AuthService');
    }
    
    // Initialize Prisma immediately
    this.prisma = prisma;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    // Test the connection
    this.prisma.$connect()
      .then(() => {
        console.log('AuthService successfully connected to Prisma');
      })
      .catch(error => {
        console.error('AuthService failed to connect to Prisma:', error);
        throw error;
      });
  }

  private generateToken(userId: number): string {
    return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: '24h' });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async register(data: RegisterDto): Promise<{ user: User; token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const verificationToken = this.generateRandomToken();
    const hashedPassword = data.password ? await this.hashPassword(data.password) : null;

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        verificationToken,
        verified: false
      }
    });

    // Send verification email
    await this.sendVerificationEmail(user.email, verificationToken);

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async login(data: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.verified) {
      throw new Error('Please verify your email first');
    }

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token }
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null
      }
    });
  }

  async initiatePasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = this.generateRandomToken();
    const resetPasswordExpires = new Date(Date.now() + this.RESET_TOKEN_EXPIRY);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires
      }
    });

    // Send password reset email
    await this.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(data: ResetPasswordDto): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: data.token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await this.hashPassword(data.newPassword);

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });
  }

  async changePassword(userId: number, data: ChangePasswordDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(data.oldPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid current password');
    }

    const hashedPassword = await this.hashPassword(data.newPassword);

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });
  }

  async createMagicLink(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create user if doesn't exist (for passwordless auth)
      await this.register({ email });
      return;
    }

    const magicLinkToken = this.generateRandomToken();
    const magicLinkExpires = new Date(Date.now() + this.MAGIC_LINK_EXPIRY);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken,
        magicLinkExpires
      }
    });

    // Send magic link email
    await this.sendMagicLinkEmail(email, magicLinkToken);
  }

  async verifyMagicLink(token: string): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired magic link');
    }

    // Clear magic link token and mark as verified
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
        verified: true
      }
    });

    const authToken = this.generateToken(user.id);
    return { user: updatedUser, token: authToken };
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      text: `Please verify your email by clicking this link: ${verificationLink}`,
      html: `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
      `
    });
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
      `
    });
  }

  private async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const loginLink = `${process.env.APP_URL}/magic-login?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Your magic login link',
      text: `Click this link to log in: ${loginLink}`,
      html: `
        <h1>Magic Login Link</h1>
        <p>Click the link below to log in:</p>
        <a href="${loginLink}">Log In</a>
      `
    });
  }
} 