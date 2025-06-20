# Authentication API

This section covers all authentication operations including registration, login, password management, and magic links.

**Base URL**: `/api/auth`

---

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

## Example Usage

### Register (cURL)
```bash
curl -X POST "https://api.example.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdriver@example.com",
    "password": "securePassword123",
    "name": "New Driver"
  }'
```

### Login (cURL)
```bash
curl -X POST "https://api.example.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "userPassword123"
  }'
```

### Get Current User (cURL)
```bash
curl -X GET "https://api.example.com/api/auth/me" \
  -H "Authorization: Bearer your-jwt-token"
``` 