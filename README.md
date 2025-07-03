# Driver Server

A comprehensive backend service for managing food delivery drivers, assignments, and route optimization.

## 🚀 Features

### Core Features
- **Driver Management**: Registration, profile management, and status tracking
- **Assignment System**: Automated driver-to-restaurant assignment with multiple algorithms
- **Authentication**: JWT-based authentication with email verification and magic links
- **File Upload**: Cloudinary integration for profile images and delivery proofs
- **Service Areas**: Geographic zones for driver availability management
- **Scheduling**: Driver availability and blocked time management

### 🆕 Route Optimization (New!)
- **Mapbox Integration**: Uses Mapbox Optimization API v2 for efficient route planning
- **Delivery Management**: Track individual deliveries with status updates
- **Turn-by-turn Navigation**: Provides navigation data for drivers
- **Proof of Delivery**: Photo uploads and delivery notes
- **Real-time Tracking**: Monitor delivery progress and completion rates

## 📊 Database Models

### Core Models
- `User` - Driver profiles and authentication
- `Vehicle` - Driver vehicle information
- `DriverServiceArea` - Geographic service zones
- `DriverSchedule` - Weekly availability schedules
- `DriverAvailabilityBlock` - Blocked time periods
- `RestaurantAssignment` - Driver-restaurant assignments

### Route Optimization Models
- `DeliveryRoute` - Optimized route information with distance and duration
- `Delivery` - Individual delivery records with status tracking
- `DeliveryStatus` - Enum for delivery states (PENDING → PICKED_UP → IN_TRANSIT → DELIVERED/FAILED)

## 🛣️ API Endpoints

### Authentication & Users
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Driver Management
- `GET /api/drivers/profile` - Get driver profile
- `PUT /api/drivers/profile` - Update driver profile
- `POST /api/drivers/service-areas` - Add service area
- `POST /api/drivers/schedules` - Set availability schedule
- `POST /api/drivers/upload-image` - Upload profile image

### Assignment Management
- `GET /api/assignments` - List driver assignments
- `GET /api/assignments/pending` - Get pending assignments
- `GET /api/assignments/today` - Get today's assignments
- `PUT /api/assignments/:id/start` - Start assignment
- `PUT /api/assignments/:id/complete` - Complete assignment

### 🆕 Route Optimization
- `GET /api/assignments/:id/route` - Get optimized route
- `PUT /api/assignments/:id/route/recalculate` - Recalculate route
- `GET /api/assignments/:id/navigation` - Get navigation data
- `POST /api/assignments/:id/route/calculate` - Calculate initial route

### 🆕 Delivery Management
- `GET /api/assignments/:id/deliveries` - List deliveries for assignment
- `GET /api/deliveries/:id` - Get delivery details
- `PUT /api/deliveries/:id/start` - Start delivery (mark in transit)
- `PUT /api/deliveries/:id/complete` - Complete delivery
- `POST /api/deliveries/:id/proof` - Upload proof of delivery
- `PUT /api/deliveries/:id/fail` - Mark delivery as failed
- `POST /api/deliveries/:id/notes` - Add delivery notes
- `GET /api/deliveries/search` - Search deliveries

## 🔧 Environment Variables

### Required
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/driver_server"
JWT_SECRET="your-jwt-secret"
REDIS_URL="redis://localhost:6379"
```

### Email (Optional)
```bash
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-password"
EMAIL_FROM="noreply@example.com"
```

### Cloudinary (Optional)
```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 🆕 Mapbox (Required for Route Optimization)
```bash
MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm run build
npm start
```

## 🏗️ Architecture

### Core Services
- **AuthService**: Authentication and authorization
- **DriverService**: Driver profile and vehicle management
- **AssignmentService**: Assignment creation and management
- **AssignmentUtils**: Driver availability and assignment utilities

### 🆕 Route Optimization Services
- **MapboxService**: Integration with Mapbox Optimization API v2
- **RoutingService**: Route calculation and delivery setup
- **CustomersService**: Customer data integration (placeholder)
- **DeliveriesService**: Individual delivery management

### Assignment Algorithms
- **SimpleAssignmentAlgorithm**: Load-balanced driver selection
- **GeographicAssignmentAlgorithm**: Location-based driver selection
- **WorkloadAssignmentAlgorithm**: Historical workload balancing

## 📈 Route Optimization Workflow

1. **Assignment Start**: Driver starts assignment
2. **Customer Fetch**: System fetches customer data for deliveries
3. **Route Calculation**: Mapbox API calculates optimal delivery sequence
4. **Delivery Creation**: Individual delivery records created with optimized order
5. **Status Tracking**: Real-time delivery status updates
6. **Completion**: Assignment completed with delivery statistics

## 🔗 Integration Points

### Customer Service Integration
The system includes a placeholder `CustomersService` that needs to be connected to your customer/order management system:

```typescript
// TODO: Replace with actual API integration
const customers = await fetch(`${CUSTOMER_API_URL}/restaurants/${restaurantId}/orders?date=${date}`);
```

### Restaurant Service Integration
Restaurant location data needs to be provided for route optimization:

```typescript
// TODO: Integrate with restaurant service
const restaurantLocation = await restaurantService.getLocation(restaurantId);
```

## 📖 Documentation

- [Restaurant Assignment API](docs/restaurant-assignments.md)
- [Assignment Utilities](docs/assignment-utilities.md)
- [🆕 Mapbox Integration](docs/mapbox-integration.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management
- **Authentication**: JWT tokens
- **File Storage**: Cloudinary
- **🆕 Route Optimization**: Mapbox Optimization API v2
- **Logging**: Winston with daily log rotation
- **Testing**: Jest

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions and support:
- Check the [documentation](docs/)
- Create an issue on GitHub
- Review the application logs for debugging

---

## 🚀 Quick Start for Route Optimization

1. **Set up Mapbox**: Get your access token from [Mapbox](https://account.mapbox.com/access-tokens/)
2. **Add environment variable**: `MAPBOX_ACCESS_TOKEN=your_token_here`
3. **Run migrations**: `npx prisma migrate dev`
4. **Start server**: `npm run dev`
5. **Test routes**: Use the new delivery and routing endpoints

See [Mapbox Integration Documentation](docs/mapbox-integration.md) for detailed setup and usage instructions. 