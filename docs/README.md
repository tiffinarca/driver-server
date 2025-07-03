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
6. [View pending assignments](./restaurant-assignments.md#get-pending-assignments)

## API Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Driver Management | 1-9 | Service areas, schedules, availability |
| User Management | 10-15 | User CRUD operations |
| Profile Management | 16-19 | Profile image handling |
| Vehicle Management | 20-24 | Vehicle CRUD operations |
| Authentication | 25-33 | Login, register, password management |
| Restaurant Assignments | 34-45 | Assignment management and workflow |

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

For detailed endpoint documentation, see the individual section files listed above. 