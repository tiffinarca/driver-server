import { PrismaClient, User } from '@prisma/client';

export class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createUser(data: { email: string; name?: string }): Promise<User> {
    return this.prisma.user.create({
      data
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async updateUser(id: number, data: { name?: string; email?: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  async deleteUser(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id }
    });
  }
} 