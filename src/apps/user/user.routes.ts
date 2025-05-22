import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserMiddleware } from './middleware/user.middleware';
import { AuthMiddleware } from '../../apps/auth/middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

export function createUserRouter(prisma: PrismaClient) {
  const userService = new UserService(prisma);
  const userController = new UserController(userService);
  const userMiddleware = new UserMiddleware(prisma);
  const authMiddleware = new AuthMiddleware(prisma);
  const userRouter = Router();

  // Public routes
  userRouter.post('/', userController.createUser);
  userRouter.get('/', userController.getAllUsers);
  userRouter.get('/:email', userController.getUser);

  // Protected routes - require authentication
  userRouter.put('/:id', 
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userController.updateUser
  );
  
  userRouter.delete('/:id', 
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userController.deleteUser
  );

  // Driver status route - protected
  userRouter.put('/:userId/status',
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userController.updateDriverStatus
  );

  // Vehicle routes - all protected
  userRouter.post('/:userId/vehicles',
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userController.addVehicle
  );

  userRouter.get('/:userId/vehicles',
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userController.getUserVehicles
  );

  userRouter.get('/:userId/vehicles/:vehicleId',
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userMiddleware.authorizeVehicleAccess,
    userController.getVehicle
  );

  userRouter.put('/:userId/vehicles/:vehicleId',
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userMiddleware.authorizeVehicleAccess,
    userController.updateVehicle
  );

  userRouter.delete('/:userId/vehicles/:vehicleId',
    authMiddleware.authenticateToken,
    userMiddleware.authorizeUser,
    userMiddleware.authorizeVehicleAccess,
    userController.deleteVehicle
  );

  return userRouter;
} 