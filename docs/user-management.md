# User Management API

This section covers user CRUD operations for the driver system.

**Base URL**: `/api/users`

---

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

## Driver Status Values

- `PENDING`: Just signed up, not vetted yet
- `ACTIVE`: Can receive assignments
- `SUSPENDED`: Temporarily barred (e.g., for policy violation)
- `RETIRED`: No longer driving 