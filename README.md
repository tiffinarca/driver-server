# Driver Server

A Node.js/Express backend service with TypeScript, Prisma ORM, and comprehensive testing.

## 🚀 Features

- **TypeScript** for type-safe code
- **Express.js** for robust API development
- **PostgreSQL** database integration
- **Prisma ORM** for type-safe database queries
- **Hot Reload** development environment
- **Modular Architecture** with domain-driven design
- **Health Monitoring** endpoint

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- PostgreSQL
- yarn or npm

## 🛠 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd driver-server
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your PostgreSQL credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/driver_server?schema=public"
   PORT=3000
   ```

4. Set up the database:
   ```bash
   createdb driver_server
   npx prisma migrate dev --name init
   ```

## 🚀 Running the Application

### Development Mode
```bash
yarn dev
```
This will start the server with hot-reload enabled.

### Production Mode
1. Build the project:
   ```bash
   yarn build
   ```

2. Start the server:
   ```bash
   yarn start
   ```

## 🔍 API Endpoints

### Users
- **POST** `/api/users`
  - Create a new user
  - Body: `{ "email": "user@example.com", "name": "John Doe" }`

- **GET** `/api/users`
  - Get all users

- **GET** `/api/users/:email`
  - Get user by email

- **PUT** `/api/users/:id`
  - Update user
  - Body: `{ "name": "Jane Doe" }`

- **DELETE** `/api/users/:id`
  - Delete user

### Health Check
- **GET** `/api/monitoring/health`
  - Returns system health status including database connectivity

## 📁 Project Structure

```
driver-server/
├── src/
│   ├── apps/                    # Feature modules
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   └── user/               # User module
│   │       ├── user.controller.ts
│   │       ├── user.service.ts
│   │       └── user.routes.ts
│   ├── __tests__/              # Test files
│   │   ├── setup.ts            # Test setup and mocks
│   │   ├── helpers/            # Test helpers
│   │   └── auth/               # Auth module tests
│   ├── middleware/             # Express middlewares
│   ├── utils/                  # Utility functions
│   └── app.ts                  # Main application file
├── scripts/                    # Development and utility scripts
│   └── create-app.sh          # Script to generate new app modules
├── prisma/                     # Prisma ORM files
│   └── schema.prisma          # Database schema
└── package.json
```

## 🏗 Architecture

The project follows a modular, domain-driven design:
- **Services**: Core business logic
- **Controllers**: Request/Response handling
- **Routes**: API endpoint definitions
- **Types**: TypeScript interfaces and types

## 🛠 Scripts

- `yarn dev`: Start development server with hot-reload
- `yarn build`: Build for production
- `yarn start`: Start production server
- `yarn create:app <app-name>`: Generate a new app module with all necessary files and tests
- `yarn test`: Run all tests
- `yarn test:watch`: Run tests in watch mode
- `yarn test:coverage`: Run tests with coverage report

## 📝 License

[MIT License](LICENSE)

## Project Structure

```
driver-server/
├── src/
│   ├── apps/                    # Feature modules
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   └── user/               # User module
│   │       ├── user.controller.ts
│   │       ├── user.service.ts
│   │       └── user.routes.ts
│   ├── __tests__/              # Test files
│   │   ├── setup.ts            # Test setup and mocks
│   │   ├── helpers/            # Test helpers
│   │   └── auth/               # Auth module tests
│   ├── middleware/             # Express middlewares
│   ├── utils/                  # Utility functions
│   └── app.ts                  # Main application file
├── scripts/                    # Development and utility scripts
│   └── create-app.sh          # Script to generate new app modules
├── prisma/                     # Prisma ORM files
│   └── schema.prisma          # Database schema
└── package.json
```

## Architecture Overview

### Module Structure
Each feature module (e.g., auth, user) follows a consistent structure:
- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic
- **Routes**: Defines API endpoints
- **Types**: TypeScript interfaces and types

### Database Layer
- Uses Prisma ORM for database operations
- Schema defined in `prisma/schema.prisma`
- Prisma client is initialized in `app.ts` and passed to services

### Authentication
- JWT-based authentication
- Email verification
- Password reset functionality
- Magic link authentication

## Setting Up a New Module

### Using the App Creation Script

The easiest way to create a new module is to use the provided yarn command:

```bash
yarn create:app <module-name>
```

For example:
```bash
yarn create:app payment
```

Alternatively, you can use the script directly:
```bash
./scripts/create-app.sh <module-name>
```

This will:
1. Create a new module directory under `src/apps/`
2. Generate all necessary files with proper TypeScript setup:
   - `<module>.service.ts` - Business logic with Prisma integration
   - `<module>.controller.ts` - Request/Response handling
   - `<module>.routes.ts` - API endpoint definitions
   - `<module>.types.ts` - TypeScript types and interfaces
3. Create corresponding test files under `src/__tests__/`:
   - `<module>.integration.test.ts` - API endpoint tests
   - `<module>.unit.test.ts` - Service unit tests

The generated files follow best practices and include:
- Proper TypeScript types
- Dependency injection setup
- Prisma integration
- Express router configuration
- Test boilerplate with Jest and Supertest

### Manual Setup (Alternative)

If you prefer to set up a module manually, follow these steps:

1. Create a new directory under `src/apps/`:
```bash
mkdir src/apps/your-module
```

2. Create the basic files:
```bash
touch src/apps/your-module/{your-module.controller.ts,your-module.service.ts,your-module.routes.ts,your-module.types.ts}
```

3. Service Template:
```typescript
import { PrismaClient } from '@prisma/client';

export class YourModuleService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    if (!prisma) {
      throw new Error('PrismaClient is required');
    }
    this.prisma = prisma;
  }

  // Add your service methods here
}
```

4. Controller Template:
```typescript
import { Request, Response } from 'express';
import { YourModuleService } from './your-module.service';

export class YourModuleController {
  private service: YourModuleService;

  constructor(service: YourModuleService) {
    this.service = service;
  }

  // Add your controller methods here
  yourMethod = async (req: Request, res: Response) => {
    try {
      // Implementation
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
```

5. Routes Template:
```typescript
import { Router } from 'express';
import { YourModuleController } from './your-module.controller';
import { YourModuleService } from './your-module.service';
import { PrismaClient } from '@prisma/client';

export function createYourModuleRouter(prisma: PrismaClient) {
  const service = new YourModuleService(prisma);
  const controller = new YourModuleController(service);
  const router = Router();

  router.get('/', controller.yourMethod);
  // Add more routes

  return router;
}
```

6. Register in `app.ts`:
```typescript
import { createYourModuleRouter } from './apps/your-module/your-module.routes';

// In the initializeApp function:
const yourModuleRouter = createYourModuleRouter(prisma);
app.use('/api/your-module', yourModuleRouter);
```

## Testing

### Understanding HTTP Request Testing

Our integration tests use `supertest` to simulate HTTP requests. Here's how it works:

1. **Virtual HTTP Requests**
   ```typescript
   // This doesn't make a real HTTP request
   const response = await request(app)
     .get('/api/users')
     .send();
   ```
   - Supertest creates a virtual HTTP request
   - No actual network calls are made
   - Express handlers are called directly in memory
   - Much faster and more reliable than real HTTP requests

2. **Test Express Instance**
   ```typescript
   describe('API Tests', () => {
     let app: express.Application;

     beforeEach(() => {
       // Create a fresh Express app for each test
       app = express();
       app.use(express.json());
       app.use('/api/users', userRouter);
     });
   });
   ```
   - Each test gets its own Express instance
   - Prevents test interference
   - Allows testing with different middleware configurations

3. **Request Simulation**
   ```typescript
   // You can simulate various HTTP scenarios
   const response = await request(app)
     .post('/api/users')
     .set('Authorization', 'Bearer token')  // Set headers
     .send({ name: 'John' });              // Send body

   // Then assert on the response
   expect(response.status).toBe(201);
   expect(response.body).toMatchObject({
     name: 'John'
   });
   ```

4. **Common Test Patterns**
   ```typescript
   // Testing successful requests
   it('should create user', async () => {
     const response = await request(app)
       .post('/api/users')
       .send(userData);
     expect(response.status).toBe(201);
   });

   // Testing error cases
   it('should handle invalid input', async () => {
     const response = await request(app)
       .post('/api/users')
       .send({});
     expect(response.status).toBe(400);
   });

   // Testing authentication
   it('should require authentication', async () => {
     const response = await request(app)
       .get('/api/protected')
       .set('Authorization', 'invalid');
     expect(response.status).toBe(401);
   });
   ```

5. **Mocking Dependencies**
   ```typescript
   // The database calls are mocked
   prismaMock.user.findMany.mockResolvedValue([
     { id: 1, name: 'John' }
   ]);

   const response = await request(app)
     .get('/api/users');
   
   // We get the mocked data in response
   expect(response.body).toEqual([
     { id: 1, name: 'John' }
   ]);
   ```

This approach provides several benefits:
- **Speed**: Tests run much faster without real network calls
- **Reliability**: No network-related flakiness
- **Isolation**: Each test runs in isolation
- **Coverage**: Easy to test error cases and edge conditions

### Test Setup Best Practices

1. **Fresh Instance Per Test**
   ```typescript
   let app: express.Application;
   
   beforeEach(() => {
     jest.clearAllMocks();  // Clear all mocks
     app = express();       // Fresh Express instance
     // Setup routes and middleware
   });
   ```

2. **Request Helpers**
   ```typescript
   // Create helper functions for common operations
   const makeAuthRequest = (token: string) => 
     request(app)
       .get('/api/protected')
       .set('Authorization', `Bearer ${token}`);
   ```

3. **Response Assertions**
   ```typescript
   // Create custom matchers for common assertions
   expect.extend({
     toBeSuccessful(response) {
       return {
         pass: response.status >= 200 && response.status < 300,
         message: () => `expected ${response.status} to be successful`
       };
     }
   });
   ```

### Common Testing Scenarios

1. **Authentication Testing**
   ```typescript
   describe('Protected Routes', () => {
     it('should require valid token', async () => {
       // Test without token
       let response = await request(app)
         .get('/api/protected');
       expect(response.status).toBe(401);

       // Test with invalid token
       response = await request(app)
         .get('/api/protected')
         .set('Authorization', 'Bearer invalid');
       expect(response.status).toBe(403);

       // Test with valid token
       response = await request(app)
         .get('/api/protected')
         .set('Authorization', `Bearer ${validToken}`);
       expect(response.status).toBe(200);
     });
   });
   ```

2. **Error Handling**
   ```typescript
   describe('Error Handling', () => {
     it('should handle database errors', async () => {
       // Mock database error
       prismaMock.user.findMany.mockRejectedValue(
         new Error('DB Error')
       );

       const response = await request(app)
         .get('/api/users');
       
       expect(response.status).toBe(500);
       expect(response.body).toEqual({
         error: 'Something went wrong!'
       });
     });
   });
   ```

3. **Validation Testing**
   ```typescript
   describe('Input Validation', () => {
     it('should validate request body', async () => {
       const response = await request(app)
         .post('/api/users')
         .send({
           email: 'invalid-email'  // Invalid email
         });

       expect(response.status).toBe(400);
       expect(response.body).toEqual({
         error: 'Invalid email format'
       });
     });
   });
   ```

## Best Practices

1. **Dependency Injection**
   - Always pass dependencies (like PrismaClient) through constructors
   - Makes testing and mocking easier

2. **Error Handling**
   - Use try-catch in controllers
   - Return appropriate HTTP status codes
   - Log errors properly

3. **Type Safety**
   - Define interfaces for all DTOs
   - Use TypeScript's strict mode
   - Validate incoming requests

4. **Testing**
   - Write tests before implementing features (TDD)
   - Mock external dependencies
   - Test error cases
   - Keep tests isolated

5. **Code Organization**
   - Follow the established module structure
   - Keep files focused and single-purpose
   - Use meaningful names for files and functions

## Common Tasks

### Adding a New Database Model
1. Add model to `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Create corresponding service and tests

### Adding New Routes
1. Add route handler to controller
2. Add route to router
3. Add integration tests
4. Add validation if needed

### Running Tests
```bash
# Run all tests
npm test

# Run specific tests
npm test -- src/__tests__/your-module

# Run with coverage
npm test -- --coverage
```

## Troubleshooting

### Common Issues

1. **Prisma Client Generation**
   ```bash
   npx prisma generate
   ```

2. **Database Migration**
   ```bash
   npx prisma migrate dev
   ```

3. **Test Database Setup**
   ```bash
   npx prisma migrate reset --force
   ```

### Debug Logging
- Set `DEBUG=* npm start` for detailed logs
- Check Prisma logs in development

## Contributing

1. Create a new branch for your feature
2. Follow the project structure
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## Environment Setup

Required environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
APP_URL="http://localhost:3000"
```

### Understanding Prisma Mocks in Tests

Our tests use `jest-mock-extended` to create a sophisticated mock of the Prisma client. Here's how it works:

1. **Mock Setup**
   ```typescript
   // In src/__tests__/setup.ts
   import { PrismaClient } from '@prisma/client';
   import { mockDeep } from 'jest-mock-extended';

   // Create a deep mock of PrismaClient
   export const prismaMock = mockDeep<PrismaClient>();

   // Tell Jest to use our mock instead of real PrismaClient
   jest.mock('@prisma/client', () => ({
     PrismaClient: jest.fn(() => prismaMock)
   }));
   ```

2. **How Mocking Works**
   ```typescript
   // In your actual code:
   const user = await prisma.user.findUnique({
     where: { email: 'test@example.com' }
   });

   // In your test:
   prismaMock.user.findUnique.mockResolvedValue({
     id: 1,
     email: 'test@example.com',
     name: 'Test User'
   });
   ```

3. **Mock Chain Examples**
   ```typescript
   // Mock a successful database query
   prismaMock.user.findMany.mockResolvedValue([
     { id: 1, name: 'User 1' },
     { id: 2, name: 'User 2' }
   ]);

   // Mock a database error
   prismaMock.user.create.mockRejectedValue(
     new Error('Unique constraint violation')
   );

   // Mock nested queries
   prismaMock.user.findUnique.mockResolvedValue({
     id: 1,
     posts: [
       { id: 1, title: 'Post 1' }
     ]
   });
   ```

4. **Verifying Calls**
   ```typescript
   // Test if a method was called
   expect(prismaMock.user.create).toHaveBeenCalled();

   // Test exact arguments
   expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
     where: { email: 'test@example.com' }
   });

   // Test call count
   expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
   ```

5. **Complex Scenarios**
   ```typescript
   // Different responses for different calls
   prismaMock.user.findUnique
     .mockResolvedValueOnce(null)        // First call returns null
     .mockResolvedValueOnce(mockUser)    // Second call returns user
     .mockRejectedValueOnce(new Error()) // Third call throws error

   // Conditional responses
   prismaMock.user.findUnique.mockImplementation((args) => {
     if (args.where.email === 'exists@example.com') {
       return Promise.resolve(mockUser);
     }
     return Promise.resolve(null);
   });
   ```

6. **Best Practices**
   ```typescript
   describe('UserService', () => {
     beforeEach(() => {
       // Clear all mocks before each test
       jest.clearAllMocks();
     });

     it('should create user', async () => {
       // Arrange: Setup your mocks
       prismaMock.user.create.mockResolvedValue(mockUser);

       // Act: Call the method you're testing
       const result = await userService.createUser(userData);

       // Assert: Verify the results
       expect(result).toEqual(mockUser);
       expect(prismaMock.user.create).toHaveBeenCalledWith({
         data: userData
       });
     });

     it('should handle errors', async () => {
       // Arrange: Mock an error
       prismaMock.user.create.mockRejectedValue(
         new Error('Database error')
       );

       // Act & Assert: Verify error handling
       await expect(
         userService.createUser(userData)
       ).rejects.toThrow('Database error');
     });
   });
   ```

7. **Common Patterns**
   ```typescript
   // Testing unique constraint violations
   it('should handle duplicate email', async () => {
     prismaMock.user.create.mockRejectedValue(
       new Error('P2002') // Prisma unique constraint error
     );
     
     await expect(
       userService.createUser(userData)
     ).rejects.toThrow('Email already exists');
   });

   // Testing related data
   it('should fetch user with posts', async () => {
     prismaMock.user.findUnique.mockResolvedValue({
       ...mockUser,
       posts: [
         { id: 1, title: 'Post 1' },
         { id: 2, title: 'Post 2' }
       ]
     });

     const result = await userService.getUserWithPosts(1);
     expect(result.posts).toHaveLength(2);
   });
   ```

This mocking approach provides several benefits:
- **No Database Required**: Tests run without a real database
- **Controlled Environment**: You decide exactly what data to return
- **Fast Execution**: No actual database operations
- **Predictable**: Tests aren't affected by database state
- **Comprehensive Testing**: Easy to test error cases and edge conditions

## Contributing

1. Create a new branch for your feature
2. Follow the project structure
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## Environment Setup

Required environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
APP_URL="http://localhost:3000"
``` 