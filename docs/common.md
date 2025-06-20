# Common Reference

This section contains common data types, constraints, HTTP status codes, and testing examples used across all API endpoints.

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

### Authentication Header
All authenticated requests require the following header:
```
Authorization: Bearer <jwt_token>
```

### cURL Examples

#### Driver Management

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

#### Authentication

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

#### User & Vehicle Management

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

---

## 📋 Request/Response Patterns

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Authentication Error Response
```json
{
  "error": "Authentication required"
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation error message",
  "details": {
    "field": "Specific field error"
  }
}
```

---

## 🔍 Common Query Parameters

While most endpoints don't use query parameters, when they do, they follow these patterns:

- **Pagination**: `?page=1&limit=20`
- **Filtering**: `?status=ACTIVE&verified=true`
- **Sorting**: `?sort=createdAt&order=desc`
- **Search**: `?search=term`

---

## 🛠️ Development Tips

### Testing Workflow
1. Register a new account or login to get a JWT token
2. Test driver management endpoints (service areas, schedules)
3. Test user management endpoints (profile, vehicles)
4. Test error scenarios (invalid data, unauthorized access)

### Token Management
- JWT tokens are included in all authenticated requests
- Tokens expire after a configurable time period
- Use the `/api/auth/me` endpoint to verify token validity
- Store tokens securely on the client side

### Error Handling
- Always check the HTTP status code first
- Parse error messages from the response body
- Handle authentication errors by prompting for re-login
- Implement retry logic for temporary server errors (500)

### Best Practices
- Always include proper `Content-Type` headers
- Use HTTPS in production
- Validate data on the client side before sending requests
- Handle network errors gracefully
- Implement proper loading states in UI applications 