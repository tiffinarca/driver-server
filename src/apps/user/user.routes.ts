import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client';

export function createUserRouter(prisma: PrismaClient) {
  const userService = new UserService(prisma);
  const userController = new UserController(userService);
  const userRouter = Router();

  // Create a new user
  userRouter.post('/', userController.createUser);

  // Get all users
  userRouter.get('/', userController.getAllUsers);

  // Get user by email
  userRouter.get('/:email', userController.getUser);

  // Update user
  userRouter.put('/:id', userController.updateUser);

  // Delete user
  userRouter.delete('/:id', userController.deleteUser);

  return userRouter;
} 