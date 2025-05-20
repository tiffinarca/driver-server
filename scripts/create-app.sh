#!/bin/bash

# Check if app name is provided
if [ -z "$1" ]; then
    echo "Please provide an app name"
    echo "Usage: ./scripts/create-app.sh <app-name>"
    exit 1
fi

# Convert app name to lowercase and create capitalized version
APP_NAME=$(echo "$1" | tr '[:upper:]' '[:lower:]')
APP_NAME_CAPITAL=$(echo "$APP_NAME" | perl -pe 's/^(.)/\u$1/')
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

# Function to perform sed replacement on macOS
replace_in_file() {
    local file=$1
    local search=$2
    local replace=$3
    local temp_file="${file}.tmp"
    sed "s|${search}|${replace}|g" "$file" > "$temp_file" && mv "$temp_file" "$file"
}

# Create service file
cat > "$APP_DIR/$APP_NAME.service.ts" << 'EOL'
import { PrismaClient } from '@prisma/client';

export class APPSERVICE {
    constructor(private prisma: PrismaClient) {}

    // Add your service methods here
}
EOL
replace_in_file "$APP_DIR/$APP_NAME.service.ts" "APPSERVICE" "${APP_NAME_CAPITAL}Service"

# Create controller file
cat > "$APP_DIR/$APP_NAME.controller.ts" << 'EOL'
import { Request, Response } from 'express';
import { APPSERVICE } from './APP.service';

export class APPCONTROLLER {
    constructor(private appService: APPSERVICE) {}

    // Add your controller methods here
}
EOL
replace_in_file "$APP_DIR/$APP_NAME.controller.ts" "APPSERVICE" "${APP_NAME_CAPITAL}Service"
replace_in_file "$APP_DIR/$APP_NAME.controller.ts" "APPCONTROLLER" "${APP_NAME_CAPITAL}Controller"
replace_in_file "$APP_DIR/$APP_NAME.controller.ts" "appService" "${APP_NAME}Service"
replace_in_file "$APP_DIR/$APP_NAME.controller.ts" "APP.service" "${APP_NAME}.service"

# Create routes file
cat > "$APP_DIR/$APP_NAME.routes.ts" << 'EOL'
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { APPCONTROLLER } from './APP.controller';
import { APPSERVICE } from './APP.service';

export const createAPPRouter = (prisma: PrismaClient) => {
    const router = express.Router();
    const appService = new APPSERVICE(prisma);
    const appController = new APPCONTROLLER(appService);

    // Add your routes here
    // Example:
    // router.get('/', (req, res) => appController.someMethod(req, res));

    return router;
};
EOL
replace_in_file "$APP_DIR/$APP_NAME.routes.ts" "APPCONTROLLER" "${APP_NAME_CAPITAL}Controller"
replace_in_file "$APP_DIR/$APP_NAME.routes.ts" "APPSERVICE" "${APP_NAME_CAPITAL}Service"
replace_in_file "$APP_DIR/$APP_NAME.routes.ts" "APP.controller" "${APP_NAME}.controller"
replace_in_file "$APP_DIR/$APP_NAME.routes.ts" "APP.service" "${APP_NAME}.service"
replace_in_file "$APP_DIR/$APP_NAME.routes.ts" "createAPPRouter" "create${APP_NAME_CAPITAL}Router"
replace_in_file "$APP_DIR/$APP_NAME.routes.ts" "appService" "${APP_NAME}Service"
replace_in_file "$APP_DIR/$APP_NAME.routes.ts" "appController" "${APP_NAME}Controller"

# Create types file
cat > "$APP_DIR/$APP_NAME.types.ts" << 'EOL'
// Add your types and interfaces here
EOL

# Create integration test file
cat > "$TEST_DIR/$APP_NAME.integration.test.ts" << 'EOL'
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../setup';
import { createAPPRouter } from '../../apps/APP/APP.routes';

describe('APP Integration Tests', () => {
    const baseUrl = '/api/APP';
    let testApp: express.Application;

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Create a fresh Express app for each test
        testApp = express();
        testApp.use(express.json());
        
        // Set up the routes with our mocked prisma
        const router = createAPPRouter(prismaMock);
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
replace_in_file "$TEST_DIR/$APP_NAME.integration.test.ts" "APP" "${APP_NAME}"
replace_in_file "$TEST_DIR/$APP_NAME.integration.test.ts" "createappRouter" "create${APP_NAME_CAPITAL}Router"

# Create unit test file
cat > "$TEST_DIR/$APP_NAME.unit.test.ts" << 'EOL'
import { APPSERVICE } from '../../apps/APP/APP.service';
import { prismaMock } from '../setup';

describe('APPSERVICE', () => {
    let appService: APPSERVICE;

    beforeEach(() => {
        jest.clearAllMocks();
        appService = new APPSERVICE(prismaMock);
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
replace_in_file "$TEST_DIR/$APP_NAME.unit.test.ts" "APPSERVICE" "${APP_NAME_CAPITAL}Service"
replace_in_file "$TEST_DIR/$APP_NAME.unit.test.ts" "APP" "${APP_NAME}"
replace_in_file "$TEST_DIR/$APP_NAME.unit.test.ts" "appService" "${APP_NAME}Service"

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