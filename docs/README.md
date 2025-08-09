# Driver API Documentation

This documentation covers all driver-related API endpoints for service areas, schedules, and availability management.

## Authentication

**All endpoints require authentication.** Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Base URL

All routes are prefixed with `/api/drivers` unless otherwise specified.

## Documentation Sections

### 🚗 Driver Operations
- [**Driver Management**](./driver-management.md) - Service areas, schedules, and availability blocking
  - Service Area Management (endpoints 1-4)
  - Schedule Management (endpoints 5-7)  
  - Availability Blocking (endpoints 8-9)

### 📋 Restaurant Assignment Operations
- [**Restaurant Assignments**](./restaurant-assignments.md) - Assignment management and driver workflow
  - Driver Assignment Operations (endpoints 34-40)
  - External/Admin Assignment Operations (endpoints 41-43)
- [**Assignment Utilities**](./assignment-utilities.md) - External integration and utility methods
  - Driver Availability Methods (endpoints 44-45)
  - Analytics & Bulk Operations
  - Algorithm Integration Patterns

### 💰 Earnings & Payments
- [**Earnings**](./earnings.md) - Driver earnings management and payment processing
  - Earnings Retrieval (daily, weekly, summary views) (endpoints 46-54)
  - Payment Calculation Methods (fixed, per-delivery, hourly)
  - Pending Earnings and Payment Processing

### 🔌 Real-time Communication
- [**Socket Communication**](./socket-communication.md) - WebSocket events and real-time updates
  - Authentication and Room Management
  - Assignment, Delivery, and Location Events
  - System Announcements and Notifications
  - REST API Integration (endpoints 55-58)

### 👤 User Operations  
- [**User Management**](./user-management.md) - User CRUD operations (endpoints 10-15)
- [**Profile Management**](./profile-management.md) - Profile image management (endpoints 16-19)
- [**Vehicle Management**](./vehicle-management.md) - Vehicle management (endpoints 20-24)

### 🔐 Authentication
- [**Authentication**](./authentication.md) - Login, register, and auth operations (endpoints 25-33)

### 📚 Reference
- [**Common Reference**](./common.md) - Data types, HTTP status codes, and testing examples

## Quick Start

1. [Register a new account](./authentication.md#register) or [login](./authentication.md#login)
2. [Set up service areas](./driver-management.md#create-service-area) 
3. [Configure weekly schedule](./driver-management.md#update-weekly-schedule)
4. [Add vehicle information](./vehicle-management.md#add-vehicle)
5. [Upload profile image](./profile-management.md#upload-profile-image)
6. [Connect via WebSocket](./socket-communication.md#connection-setup) for real-time updates
7. [View pending assignments](./restaurant-assignments.md#get-pending-assignments)
8. [Check earnings summary](./earnings.md#get-earnings-summary)

## API Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Driver Management | 1-9 | Service areas, schedules, availability |
| User Management | 10-15 | User CRUD operations |
| Profile Management | 16-19 | Profile image handling |
| Vehicle Management | 20-24 | Vehicle CRUD operations |
| Authentication | 25-33 | Login, register, password management |
| Restaurant Assignments | 34-45 | Assignment management and workflow |
| Earnings | 46-54 | Driver earnings and payment processing |
| Socket Communication | 55-58 | Real-time connection monitoring and announcements |

## Assignment System Overview

The restaurant assignment system enables:
- **Automated Assignment**: External algorithms can assign drivers to restaurants
- **Driver Workflow**: Drivers can start and complete assignments  
- **Real-time Tracking**: Monitor assignment status and progress
- **Analytics**: Track performance and workload distribution

### Assignment Status Flow
```
PENDING → STARTED → COMPLETED
    ↓
CANCELLED (optional)
```

## Real-time Communication

The system supports real-time communication through WebSocket connections:
- **Driver Authentication**: Secure socket authentication and room assignment
- **Live Updates**: Real-time assignment, delivery, and payment notifications
- **Location Tracking**: Live driver location updates for route optimization
- **System Announcements**: Broadcast important messages to drivers

## Earnings System

Driver earnings are calculated and tracked automatically:
- **Multiple Payment Methods**: Fixed, per-delivery, and hourly payment structures
- **Real-time Calculation**: Automatic earnings calculation upon assignment/delivery completion
- **Payment Processing**: Integration with Stripe for secure payment transfers
- **Comprehensive Reporting**: Daily, weekly, and summary earnings views

For detailed endpoint documentation, see the individual section files listed above. 