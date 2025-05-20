#!/bin/bash

# Check if app name is provided
if [ -z "$1" ]; then
    echo "Please provide an app name"
    echo "Usage: ./scripts/create-app.sh <app-name>"
    exit 1
fi

# Convert app name to lowercase
APP_NAME=$(echo "$1" | tr '[:upper:]' '[:lower:]')
APP_DIR="src/apps/$APP_NAME"
TEST_DIR="src/__tests__/$APP_NAME"

# Check if app already exists
if [ -d "$APP_DIR" ]; then
    echo "Error: App '$APP_NAME' already exists"
    exit 1
fi

# Create app and test directory structure
mkdir -p "$APP_DIR"
mkdir -p "$TEST_DIR"

# Create service file
cat > "$APP_DIR/$APP_NAME.service.ts" << EOL
import { PrismaClient } from '@prisma/client';

export class ${APP_NAME^}Service {
    constructor(private prisma: PrismaClient) {}

    // Add your service methods here
}
EOL

# Create controller file
cat > "$APP_DIR/$APP_NAME.controller.ts" << EOL
import { Request, Response } from 'express';
import { ${APP_NAME^}Service } from './${APP_NAME}.service';

export class ${APP_NAME^}Controller {
    constructor(private ${APP_NAME}Service: ${APP_NAME^}Service) {}

    // Add your controller methods here
}
EOL

# Create routes file
cat > "$APP_DIR/$APP_NAME.routes.ts" << EOL
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ${APP_NAME^}Controller } from './${APP_NAME}.controller';
import { ${APP_NAME^}Service } from './${APP_NAME}.service';

export const create${APP_NAME^}Router = (prisma: PrismaClient) => {
    const router = express.Router();
    const ${APP_NAME}Service = new ${APP_NAME^}Service(prisma);
    const ${APP_NAME}Controller = new ${APP_NAME^}Controller(${APP_NAME}Service);

    // Add your routes here
    // Example:
    // router.get('/', (req, res) => ${APP_NAME}Controller.someMethod(req, res));

    return router;
};
EOL

# Create types file
cat > "$APP_DIR/$APP_NAME.types.ts" << EOL
// Add your types and interfaces here
EOL

# Create integration test file
cat > "$TEST_DIR/$APP_NAME.integration.test.ts" << EOL
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../setup';
import { create${APP_NAME^}Router } from '../../apps/${APP_NAME}/${APP_NAME}.routes';

describe('${APP_NAME^} Integration Tests', () => {
    const baseUrl = '/api/${APP_NAME}';
    let testApp: express.Application;

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Create a fresh Express app for each test
        testApp = express();
        testApp.use(express.json());
        
        // Set up the routes with our mocked prisma
        const router = create${APP_NAME^}Router(prismaMock);
        testApp.use(baseUrl, router);
    });

    describe('Example Endpoint', () => {
        it('should do something successfully', async () => {
            // Arrange
            // TODO: Add test setup

            // Act
            const response = await request(testApp)
                .get(baseUrl);

            // Assert
            expect(response.status).toBe(200);
        });
    });
});
EOL

# Create unit test file
cat > "$TEST_DIR/$APP_NAME.unit.test.ts" << EOL
import { ${APP_NAME^}Service } from '../../apps/${APP_NAME}/${APP_NAME}.service';
import { prismaMock } from '../setup';

describe('${APP_NAME^}Service', () => {
    let ${APP_NAME}Service: ${APP_NAME^}Service;

    beforeEach(() => {
        jest.clearAllMocks();
        ${APP_NAME}Service = new ${APP_NAME^}Service(prismaMock);
    });

    describe('example method', () => {
        it('should do something successfully', async () => {
            // Arrange
            // TODO: Add test setup

            // Act
            // TODO: Add method call

            // Assert
            // TODO: Add assertions
        });
    });
});
EOL

echo "✨ Successfully created new app: $APP_NAME"
echo "📁 App Location: $APP_DIR"
echo "📁 Test Location: $TEST_DIR"
echo "
Generated files:
App files:
- ${APP_NAME}.service.ts
- ${APP_NAME}.controller.ts
- ${APP_NAME}.routes.ts
- ${APP_NAME}.types.ts

Test files:
- ${APP_NAME}.integration.test.ts
- ${APP_NAME}.unit.test.ts

Next steps:
1. Add your service methods in ${APP_NAME}.service.ts
2. Add your controller methods in ${APP_NAME}.controller.ts
3. Configure your routes in ${APP_NAME}.routes.ts
4. Define your types in ${APP_NAME}.types.ts
5. Register your app router in src/app.ts
6. Add integration tests in ${APP_NAME}.integration.test.ts
7. Add unit tests in ${APP_NAME}.unit.test.ts
" 