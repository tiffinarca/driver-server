# Driver Management API

This section covers driver-specific operations including service areas, schedules, and availability management.

**Base URL**: `/api/drivers`

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
    "error": "Availability block not found"
  }
  ``` 