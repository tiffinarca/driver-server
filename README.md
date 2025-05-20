# Driver Server

A TypeScript-based Express.js server with PostgreSQL database integration using Prisma ORM.

## 🚀 Features

- **TypeScript** for type-safe code
- **Express.js** for robust API development
- **PostgreSQL** database integration
- **Prisma ORM** for type-safe database queries
- **Hot Reload** development environment
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

### Health Check
- **GET** `/api/monitoring/health`
  - Returns system health status including database connectivity
  - Response example:
    ```json
    {
      "status": "healthy",
      "timestamp": "2024-02-20T12:00:00Z",
      "database": "connected",
      "service": "driver-server"
    }
    ```

## 📁 Project Structure

```
driver-server/
├── src/
│   ├── index.ts        # Entry point
│   ├── app.ts          # Express app setup
│   └── routes/
│       └── monitoring.ts # Monitoring routes
├── prisma/
│   └── schema.prisma   # Prisma schema
├── dist/               # Compiled JavaScript
└── node_modules/       # Dependencies
```

## 🛠 Scripts

- `yarn dev`: Start development server with hot-reload
- `yarn build`: Build for production
- `yarn start`: Start production server

## 📝 License

[MIT License](LICENSE) 