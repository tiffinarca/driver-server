# Driver API Documentation

This documentation covers all driver-related API endpoints for service areas, schedules, and availability management.

## Authentication

**All endpoints require authentication.** Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Base URL

All routes are prefixed with `/api/drivers`

---

## 🗺️ Service Area Management

### 1. Get Driver's Service Areas

**GET** `/api/drivers/service-areas`

Get all service areas for the authenticated driver.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Body**: None

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "serviceAreas": [
      {
        "id": "uuid-string",
        "driverId": 123,
        "areaName": "Downtown Seattle",
        "postalCode": "98101",
        "city": "Seattle",
        "state": "WA",
        "country": "USA",
        "latitude": 47.6062,
        "longitude": -122.3321,
        "radiusKm": 15,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "success": false,
    "error": "Failed to get service areas"
  }
  ```

---

### 2. Create Service Area

**POST** `/api/drivers/service-areas`

Add a new service area for the authenticated driver.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body**:
```json
{
  "areaName": "Downtown Seattle",        // Required: string
  "city": "Seattle",                     // Required: string
  "state": "WA",                         // Required: string
  "postalCode": "98101",                 // Optional: string
  "country": "USA",                      // Optional: string (defaults to "USA")
  "latitude": 47.6062,                   // Required: number
  "longitude": -122.3321,                // Required: number
  "radiusKm": 15                         // Optional: number (defaults to 10)
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Service area created successfully",
  "data": {
    "id": "uuid-string",
    "driverId": 123,
    "areaName": "Downtown Seattle",
    "postalCode": "98101",
    "city": "Seattle",
    "state": "WA",
    "country": "USA",
    "latitude": 47.6062,
    "longitude": -122.3321,
    "radiusKm": 15,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (Missing required fields)
  ```json
  {
    "success": false,
    "error": "Area name, city, and state are required"
  }
  ```

- **400 Bad Request** (Invalid coordinates)
  ```json
  {
    "success": false,
    "error": "Valid latitude and longitude coordinates are required"
  }
  ```

- **409 Conflict** (Duplicate area name)
  ```json
  {
    "success": false,
    "error": "Service area with this name already exists for this driver"
  }
  ```

---

### 3. Update Service Area

**PUT** `/api/drivers/service-areas/:id`

Update an existing service area. Only the driver who owns the service area can update it.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Parameters**: `id` (service area UUID)
- **Body** (all fields optional):
```json
{
  "areaName": "Updated Area Name",
  "city": "Updated City",
  "state": "Updated State",
  "postalCode": "12345",
  "country": "USA",
  "latitude": 47.6062,
  "longitude": -122.3321,
  "radiusKm": 20,
  "isActive": false
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Service area updated successfully",
  "data": {
    "id": "uuid-string",
    "driverId": 123,
    "areaName": "Updated Area Name",
    // ... other fields
  }
}
```

#### Error Responses
- **400 Bad Request** (Missing ID)
  ```json
  {
    "success": false,
    "error": "Service area ID is required"
  }
  ```

- **403 Forbidden** (Not owner)
  ```json
  {
    "success": false,
    "error": "Unauthorized to update this service area"
  }
  ```

- **404 Not Found**
  ```json
  {
    "success": false,
    "error": "Service area not found"
  }
  ```

---

### 4. Delete Service Area

**DELETE** `/api/drivers/service-areas/:id`

Delete a service area. Only the driver who owns the service area can delete it.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `id` (service area UUID)
- **Body**: None

#### Success Response (200)
```json
{
  "success": true,
  "message": "Service area deleted successfully"
}
```

#### Error Responses
- **403 Forbidden** (Not owner)
  ```json
  {
    "success": false,
    "error": "Unauthorized to delete this service area"
  }
  ```

- **404 Not Found**
  ```json
  {
    "success": false,
    "error": "Service area not found"
  }
  ```

---

## 📅 Schedule Management

### 5. Get Driver's Weekly Schedule

**GET** `/api/drivers/schedules`

Get the complete weekly schedule for the authenticated driver.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Body**: None

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "uuid-string",
        "driverId": 123,
        "dayOfWeek": 1,                    // 0=Sunday, 1=Monday, ..., 6=Saturday
        "startTime": "09:00",              // HH:MM format (24-hour)
        "endTime": "17:00",                // HH:MM format (24-hour)
        "isAvailable": true,
        "maxDeliveries": 70,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "coverage": {
      "0": null,          // Sunday: not scheduled
      "1": { /* schedule object */ },  // Monday: scheduled
      "2": { /* schedule object */ },  // Tuesday: scheduled
      "3": null,          // Wednesday: not scheduled
      "4": { /* schedule object */ },  // Thursday: scheduled
      "5": { /* schedule object */ },  // Friday: scheduled
      "6": null           // Saturday: not scheduled
    }
  }
}
```

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "success": false,
    "error": "Failed to get schedule"
  }
  ```

---

### 6. Update Weekly Schedule

**PUT** `/api/drivers/schedules`

Replace the entire weekly schedule. This will delete all existing schedules and create new ones.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body**:
```json
{
  "schedules": [
    {
      "dayOfWeek": 1,                    // Required: 0-6 (Sunday-Saturday)
      "startTime": "09:00",              // Required: HH:MM format
      "endTime": "17:00",                // Required: HH:MM format
      "isAvailable": true,               // Optional: boolean (defaults to true)
      "maxDeliveries": 80                // Optional: number (defaults to 70)
    },
    {
      "dayOfWeek": 2,
      "startTime": "10:00",
      "endTime": "18:00",
      "isAvailable": true,
      "maxDeliveries": 70
    }
  ]
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Weekly schedule updated successfully",
  "data": {
    "schedules": [
      // Array of created schedule objects
    ],
    "coverage": {
      // Coverage map as shown in GET response
    }
  }
}
```

#### Error Responses
- **400 Bad Request** (Missing schedules array)
  ```json
  {
    "success": false,
    "error": "Schedules array is required"
  }
  ```

- **400 Bad Request** (Invalid day of week)
  ```json
  {
    "success": false,
    "error": "Day of week must be between 0 (Sunday) and 6 (Saturday)"
  }
  ```

- **400 Bad Request** (Missing time fields)
  ```json
  {
    "success": false,
    "error": "Start time and end time are required for each schedule"
  }
  ```

---

### 7. Update Single Day Schedule

**PUT** `/api/drivers/schedules/:day`

Update the schedule for a specific day of the week.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Parameters**: `day` (0-6, where 0=Sunday, 1=Monday, ..., 6=Saturday)
- **Body** (all fields optional):
```json
{
  "startTime": "08:00",              // Optional: HH:MM format
  "endTime": "16:00",                // Optional: HH:MM format
  "isAvailable": true,               // Optional: boolean
  "maxDeliveries": 60                // Optional: number
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Day schedule updated successfully",
  "data": {
    "id": "uuid-string",
    "driverId": 123,
    "dayOfWeek": 1,
    "startTime": "08:00",
    "endTime": "16:00",
    "isAvailable": true,
    "maxDeliveries": 60,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (Invalid day parameter)
  ```json
  {
    "success": false,
    "error": "Day must be between 0 (Sunday) and 6 (Saturday)"
  }
  ```

- **404 Not Found** (No schedule for that day)
  ```json
  {
    "success": false,
    "error": "Schedule not found for this day"
  }
  ```

---

## 🚫 Availability Blocking

### 8. Block Specific Date

**POST** `/api/drivers/availability/block`

Block availability for a specific date. Can be full day or partial day blocking.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body**:

**Full Day Block:**
```json
{
  "blockedDate": "2024-12-25",       // Required: YYYY-MM-DD format
  "reason": "Christmas Day",         // Optional: string
  "isFullDay": true                  // Optional: boolean (defaults to true)
}
```

**Partial Day Block:**
```json
{
  "blockedDate": "2024-12-24",       // Required: YYYY-MM-DD format
  "reason": "Doctor appointment",    // Optional: string
  "isFullDay": false,                // Required for partial blocks
  "startTime": "14:00",              // Required for partial blocks: HH:MM
  "endTime": "16:00"                 // Required for partial blocks: HH:MM
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Availability block created successfully",
  "data": {
    "id": "uuid-string",
    "driverId": 123,
    "blockedDate": "2024-12-25T00:00:00.000Z",
    "reason": "Christmas Day",
    "isFullDay": true,
    "startTime": null,
    "endTime": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (Missing blocked date)
  ```json
  {
    "success": false,
    "error": "Blocked date is required (YYYY-MM-DD format)"
  }
  ```

- **400 Bad Request** (Invalid date format)
  ```json
  {
    "success": false,
    "error": "Invalid date format. Use YYYY-MM-DD"
  }
  ```

- **400 Bad Request** (Missing time for partial block)
  ```json
  {
    "success": false,
    "error": "Start time and end time are required for partial day blocks"
  }
  ```

---

### 9. Remove Date Block

**DELETE** `/api/drivers/availability/block/:id`

Remove a previously created availability block.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `id` (availability block UUID)
- **Body**: None

#### Success Response (200)
```json
{
  "success": true,
  "message": "Availability block deleted successfully"
}
```

#### Error Responses
- **400 Bad Request** (Missing block ID)
  ```json
  {
    "success": false,
    "error": "Block ID is required"
  }
  ```

- **403 Forbidden** (Not owner)
  ```json
  {
    "success": false,
    "error": "Unauthorized to delete this availability block"
  }
  ```

- **404 Not Found**
  ```json
  {
    "success": false,
    "error": "Availability block not found"
  }
  ```

---

# 👤 User Management API

All user management routes are prefixed with `/api/users`

## 👥 User CRUD Operations

### 10. Create User

**POST** `/api/users`

Create a new user account. This is a public endpoint.

#### Request
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "driver@example.com",     // Required: string (unique)
  "name": "John Driver"              // Optional: string
}
```

#### Success Response (201)
```json
{
  "id": 123,
  "email": "driver@example.com",
  "name": "John Driver",
  "driverStatus": "PENDING",
  "verified": false,
  "profileImageUrl": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Error Responses
- **400 Bad Request** (Email already exists or invalid data)
  ```json
  {
    "error": "Failed to create user"
  }
  ```

---

### 11. Get All Users

**GET** `/api/users`

Get all users. This is a public endpoint (typically for admin use).

#### Request
- **Headers**: None required
- **Body**: None

#### Success Response (200)
```json
[
  {
    "id": 123,
    "email": "driver@example.com",
    "name": "John Driver",
    "driverStatus": "ACTIVE",
    "verified": true,
    "profileImageUrl": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "vehicles": [
      {
        "id": 1,
        "make": "Toyota",
        "model": "Corolla",
        "licensePlate": "ABC123",
        "color": "White",
        "capacity": 5,
        "verified": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
]
```

#### Error Responses
- **500 Internal Server Error**
  ```json
  {
    "error": "Failed to get users"
  }
  ```

---

### 12. Get User by Email

**GET** `/api/users/:email`

Get a specific user by email. This is a public endpoint.

#### Request
- **Headers**: None required
- **Parameters**: `email` (user's email address)
- **Body**: None

#### Success Response (200)
```json
{
  "id": 123,
  "email": "driver@example.com",
  "name": "John Driver",
  "driverStatus": "ACTIVE",
  "verified": true,
  "profileImageUrl": "https://res.cloudinary.com/...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "vehicles": [...]
}
```

#### Error Responses
- **404 Not Found**
  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "error": "Failed to get user"
  }
  ```

---

### 13. Update User

**PUT** `/api/users/:id`

Update user information. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Parameters**: `id` (user ID)
- **Body** (all fields optional):
```json
{
  "email": "newemail@example.com",   // Optional: string
  "name": "Updated Name",            // Optional: string
  "driverStatus": "ACTIVE"           // Optional: "PENDING" | "ACTIVE" | "SUSPENDED" | "RETIRED"
}
```

#### Success Response (200)
```json
{
  "id": 123,
  "email": "newemail@example.com",
  "name": "Updated Name",
  "driverStatus": "ACTIVE",
  "verified": true,
  "profileImageUrl": "https://res.cloudinary.com/...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "vehicles": [...]
}
```

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden** (Not authorized to update this user)
  ```json
  {
    "error": "Access denied"
  }
  ```

- **400 Bad Request**
  ```json
  {
    "error": "Failed to update user"
  }
  ```

---

### 14. Delete User

**DELETE** `/api/users/:id`

Delete a user account. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `id` (user ID)
- **Body**: None

#### Success Response (204)
No content returned.

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Access denied"
  }
  ```

- **400 Bad Request**
  ```json
  {
    "error": "Failed to delete user"
  }
  ```

---

### 15. Update Driver Status

**PUT** `/api/users/:userId/status`

Update the driver status of a user. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Parameters**: `userId` (user ID)
- **Body**:
```json
{
  "status": "ACTIVE"                 // Required: "PENDING" | "ACTIVE" | "SUSPENDED" | "RETIRED"
}
```

#### Success Response (200)
```json
{
  "id": 123,
  "email": "driver@example.com",
  "name": "John Driver",
  "driverStatus": "ACTIVE",
  "verified": true,
  "profileImageUrl": "https://res.cloudinary.com/...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "vehicles": [...]
}
```

#### Error Responses
- **400 Bad Request** (Invalid status)
  ```json
  {
    "error": "Invalid driver status"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Access denied"
  }
  ```

---

## 📷 Profile Image Management

### 16. Upload Profile Image

**POST** `/api/users/:userId/profile-image`

Upload a new profile image for a user. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Parameters**: `userId` (user ID)
- **Body**: Form data with image file
  - `image`: Image file (JPEG, PNG, etc.)

#### Success Response (201)
```json
{
  "message": "Profile image uploaded successfully",
  "data": {
    "id": 123,
    "profileImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456789/profile_images/abc123.jpg",
    "profileImagePublicId": "profile_images/abc123",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (No file provided)
  ```json
  {
    "error": "No image file provided"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Access denied"
  }
  ```

---

### 17. Update Profile Image

**PUT** `/api/users/:userId/profile-image`

Replace an existing profile image. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Parameters**: `userId` (user ID)
- **Body**: Form data with image file
  - `image`: New image file

#### Success Response (200)
```json
{
  "message": "Profile image updated successfully",
  "data": {
    "id": 123,
    "profileImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456790/profile_images/def456.jpg",
    "profileImagePublicId": "profile_images/def456",
    "updatedAt": "2024-01-01T13:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (No file provided)
  ```json
  {
    "error": "No image file provided"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

### 18. Delete Profile Image

**DELETE** `/api/users/:userId/profile-image`

Delete the user's profile image. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `userId` (user ID)
- **Body**: None

#### Success Response (200)
```json
{
  "message": "Profile image deleted successfully",
  "data": {
    "id": 123,
    "profileImageUrl": null,
    "profileImagePublicId": null,
    "updatedAt": "2024-01-01T14:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (No image to delete)
  ```json
  {
    "error": "User does not have a profile image"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

### 19. Get Profile Image

**GET** `/api/users/:userId/profile-image`

Get the user's profile image URL. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `userId` (user ID)
- **Body**: None

#### Success Response (200)
```json
{
  "profileImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456789/profile_images/abc123.jpg"
}
```

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "error": "Failed to get profile image"
  }
  ```

---

## 🚗 Vehicle Management

### 20. Add Vehicle

**POST** `/api/users/:userId/vehicles`

Add a new vehicle for a user. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Parameters**: `userId` (user ID)
- **Body**:
```json
{
  "make": "Toyota",                  // Required: string
  "model": "Corolla",                // Required: string
  "licensePlate": "ABC123",          // Required: string (unique)
  "color": "White",                  // Optional: string
  "capacity": 5                      // Optional: number
}
```

#### Success Response (201)
```json
{
  "id": 1,
  "make": "Toyota",
  "model": "Corolla",
  "licensePlate": "ABC123",
  "color": "White",
  "capacity": 5,
  "verified": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Error Responses
- **400 Bad Request**
  ```json
  {
    "error": "Failed to add vehicle"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

### 21. Get User Vehicles

**GET** `/api/users/:userId/vehicles`

Get all vehicles for a user. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `userId` (user ID)
- **Body**: None

#### Success Response (200)
```json
[
  {
    "id": 1,
    "make": "Toyota",
    "model": "Corolla",
    "licensePlate": "ABC123",
    "color": "White",
    "capacity": 5,
    "verified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "make": "Honda",
    "model": "Civic",
    "licensePlate": "XYZ789",
    "color": "Blue",
    "capacity": 5,
    "verified": false,
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "error": "Failed to get user vehicles"
  }
  ```

---

### 22. Get Specific Vehicle

**GET** `/api/users/:userId/vehicles/:vehicleId`

Get details of a specific vehicle. Requires authentication and authorization for both user and vehicle access.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `userId` (user ID), `vehicleId` (vehicle ID)
- **Body**: None

#### Success Response (200)
```json
{
  "id": 1,
  "make": "Toyota",
  "model": "Corolla",
  "licensePlate": "ABC123",
  "color": "White",
  "capacity": 5,
  "verified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "driver": {
    "id": 123,
    "email": "driver@example.com",
    "name": "John Driver"
  }
}
```

#### Error Responses
- **404 Not Found**
  ```json
  {
    "error": "Vehicle not found"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Access denied"
  }
  ```

---

### 23. Update Vehicle

**PUT** `/api/users/:userId/vehicles/:vehicleId`

Update vehicle information. Requires authentication and authorization for both user and vehicle access.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Parameters**: `userId` (user ID), `vehicleId` (vehicle ID)
- **Body** (all fields optional):
```json
{
  "make": "Honda",                   // Optional: string
  "model": "Civic",                  // Optional: string
  "licensePlate": "XYZ789",          // Optional: string
  "color": "Blue",                   // Optional: string
  "capacity": 4,                     // Optional: number
  "verified": true                   // Optional: boolean
}
```

#### Success Response (200)
```json
{
  "id": 1,
  "make": "Honda",
  "model": "Civic",
  "licensePlate": "XYZ789",
  "color": "Blue",
  "capacity": 4,
  "verified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

#### Error Responses
- **400 Bad Request**
  ```json
  {
    "error": "Failed to update vehicle"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Access denied"
  }
  ```

---

### 24. Delete Vehicle

**DELETE** `/api/users/:userId/vehicles/:vehicleId`

Delete a vehicle. Requires authentication and authorization for both user and vehicle access.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `userId` (user ID), `vehicleId` (vehicle ID)
- **Body**: None

#### Success Response (204)
No content returned.

#### Error Responses
- **400 Bad Request**
  ```json
  {
    "error": "Failed to delete vehicle"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Access denied"
  }
  ```

---

# 🔐 Authentication API

All authentication routes are prefixed with `/api/auth`

## 🚪 Public Authentication Endpoints

### 25. Register

**POST** `/api/auth/register`

Register a new user account. This is a public endpoint.

#### Request
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "newdriver@example.com",  // Required: string (unique)
  "password": "securePassword123",   // Required: string
  "name": "New Driver"               // Optional: string
}
```

#### Success Response (201)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 124,
    "email": "newdriver@example.com",
    "name": "New Driver",
    "driverStatus": "PENDING",
    "verified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses
- **400 Bad Request** (Email already exists)
  ```json
  {
    "error": "Email already registered"
  }
  ```

- **400 Bad Request** (Invalid data)
  ```json
  {
    "error": "Invalid registration data"
  }
  ```

---

### 26. Login

**POST** `/api/auth/login`

Authenticate a user and receive a JWT token. This is a public endpoint.

#### Request
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "driver@example.com",     // Required: string
  "password": "userPassword123"      // Required: string
}
```

#### Success Response (200)
```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "driver@example.com",
    "name": "John Driver",
    "driverStatus": "ACTIVE",
    "verified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses
- **401 Unauthorized** (Invalid credentials)
  ```json
  {
    "error": "Invalid email or password"
  }
  ```

- **400 Bad Request**
  ```json
  {
    "error": "Login failed"
  }
  ```

---

### 27. Forgot Password

**POST** `/api/auth/forgot-password`

Request a password reset email. This is a public endpoint.

#### Request
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "driver@example.com"      // Required: string
}
```

#### Success Response (200)
```json
{
  "message": "Password reset email sent successfully"
}
```

#### Error Responses
- **404 Not Found** (Email not found)
  ```json
  {
    "error": "Email not found"
  }
  ```

- **400 Bad Request**
  ```json
  {
    "error": "Failed to send password reset email"
  }
  ```

---

### 28. Reset Password

**POST** `/api/auth/reset-password`

Reset password using a reset token. This is a public endpoint.

#### Request
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "token": "reset-token-from-email",  // Required: string
  "newPassword": "newSecurePassword"  // Required: string
}
```

#### Success Response (200)
```json
{
  "message": "Password reset successfully"
}
```

#### Error Responses
- **400 Bad Request** (Invalid or expired token)
  ```json
  {
    "error": "Invalid or expired reset token"
  }
  ```

- **400 Bad Request**
  ```json
  {
    "error": "Password reset failed"
  }
  ```

---

### 29. Request Magic Link

**POST** `/api/auth/magic-link`

Request a magic link for passwordless login. This is a public endpoint.

#### Request
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "driver@example.com"      // Required: string
}
```

#### Success Response (200)
```json
{
  "message": "Magic link sent successfully"
}
```

#### Error Responses
- **404 Not Found** (Email not found)
  ```json
  {
    "error": "Email not found"
  }
  ```

- **400 Bad Request**
  ```json
  {
    "error": "Failed to send magic link"
  }
  ```

---

### 30. Verify Magic Link

**GET** `/api/auth/verify-magic-link`

Verify and authenticate using a magic link token. This is a public endpoint.

#### Request
- **Headers**: None required
- **Query Parameters**: `token` (magic link token from email)
- **Body**: None

#### Success Response (200)
```json
{
  "message": "Magic link verified successfully",
  "user": {
    "id": 123,
    "email": "driver@example.com",
    "name": "John Driver",
    "driverStatus": "ACTIVE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses
- **400 Bad Request** (Invalid or expired token)
  ```json
  {
    "error": "Invalid or expired magic link"
  }
  ```

---

### 31. Verify Email

**GET** `/api/auth/verify-email`

Verify email address using verification token. This is a public endpoint.

#### Request
- **Headers**: None required
- **Query Parameters**: `token` (verification token from email)
- **Body**: None

#### Success Response (200)
```json
{
  "message": "Email verified successfully"
}
```

#### Error Responses
- **400 Bad Request** (Invalid or expired token)
  ```json
  {
    "error": "Invalid or expired verification token"
  }
  ```

---

## 🔒 Protected Authentication Endpoints

### 32. Change Password

**POST** `/api/auth/change-password`

Change password for authenticated user. Requires authentication.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body**:
```json
{
  "currentPassword": "oldPassword123", // Required: string
  "newPassword": "newSecurePassword"   // Required: string
}
```

#### Success Response (200)
```json
{
  "message": "Password changed successfully"
}
```

#### Error Responses
- **400 Bad Request** (Wrong current password)
  ```json
  {
    "error": "Current password is incorrect"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

### 33. Get Current User

**GET** `/api/auth/me`

Get current authenticated user information. Requires authentication.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Body**: None

#### Success Response (200)
```json
{
  "id": 123,
  "email": "driver@example.com",
  "name": "John Driver",
  "driverStatus": "ACTIVE",
  "verified": true,
  "profileImageUrl": "https://res.cloudinary.com/...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

## 📊 Data Types & Constraints

### Day of Week Values
- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

### Time Format
- All times use 24-hour format: `HH:MM` (e.g., "09:00", "17:30")
- Times are stored as time-only (no date component)

### Date Format
- All dates use ISO format: `YYYY-MM-DD` (e.g., "2024-12-25")

### Coordinate Constraints
- Latitude: Decimal with 8 decimal places (-90 to 90)
- Longitude: Decimal with 8 decimal places (-180 to 180)

### Service Area Constraints
- Area name must be unique per driver
- Radius defaults to 10km if not specified
- Country defaults to "USA" if not specified

### Schedule Constraints
- Only one schedule per driver per day of week
- Max deliveries defaults to 70 if not specified
- Availability defaults to true if not specified

### Driver Status Values
- `PENDING`: Just signed up, not vetted yet
- `ACTIVE`: Can receive assignments
- `SUSPENDED`: Temporarily barred (e.g., for policy violation)
- `RETIRED`: No longer driving

### Image Upload Constraints
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 10MB
- Images are automatically optimized and stored on Cloudinary

### Vehicle Constraints
- License plate must be unique across all vehicles
- Capacity refers to number of seats or load capacity
- Verification status controlled by fleet admin

---

## 🔧 Common HTTP Status Codes

- **200 OK**: Successful GET, PUT, DELETE operations
- **201 Created**: Successful POST operations
- **204 No Content**: Successful DELETE operations with no response body
- **400 Bad Request**: Invalid request data or missing required fields
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid token but insufficient permissions (not the owner)
- **404 Not Found**: Requested resource doesn't exist
- **409 Conflict**: Resource already exists (duplicate email, license plate, etc.)
- **500 Internal Server Error**: Server-side error

---

## 🧪 Testing Examples

### cURL Examples

**Get schedules:**
```bash
curl -X GET "https://api.example.com/api/drivers/schedules" \
  -H "Authorization: Bearer your-jwt-token"
```

**Create service area:**
```bash
curl -X POST "https://api.example.com/api/drivers/service-areas" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "areaName": "Downtown",
    "city": "Seattle",
    "state": "WA",
    "latitude": 47.6062,
    "longitude": -122.3321
  }'
```

**Update weekly schedule:**
```bash
curl -X PUT "https://api.example.com/api/drivers/schedules" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "schedules": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ]
  }'
```

**Block a full day:**
```bash
curl -X POST "https://api.example.com/api/drivers/availability/block" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "blockedDate": "2024-12-25",
    "reason": "Christmas Day",
    "isFullDay": true
  }'
```

**Register new user:**
```bash
curl -X POST "https://api.example.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdriver@example.com",
    "password": "securePassword123",
    "name": "New Driver"
  }'
```

**Login:**
```bash
curl -X POST "https://api.example.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "userPassword123"
  }'
```

**Add vehicle:**
```bash
curl -X POST "https://api.example.com/api/users/123/vehicles" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "make": "Toyota",
    "model": "Corolla",
    "licensePlate": "ABC123",
    "color": "White",
    "capacity": 5
  }'
```

**Upload profile image:**
```bash
curl -X POST "https://api.example.com/api/users/123/profile-image" \
  -H "Authorization: Bearer your-jwt-token" \
  -F "image=@/path/to/profile-photo.jpg"
``` 