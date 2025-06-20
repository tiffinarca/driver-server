# Vehicle Management API

This section covers vehicle management operations for users.

**Base URL**: `/api/users`

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

## Vehicle Constraints

- **License plate**: Must be unique across all vehicles
- **Capacity**: Refers to number of seats or load capacity
- **Verification status**: Controlled by fleet admin
- **Required fields**: Make, model, and license plate are required
- **Optional fields**: Color and capacity can be added later

## Example Usage

### Add Vehicle (cURL)
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