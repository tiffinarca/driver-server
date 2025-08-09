# Earnings API

This section covers all earnings operations including earnings retrieval, summaries, calculations, and payment processing for drivers.

**Base URL**: `/api/earnings`

---

## Authentication Required

All earnings endpoints require authentication. Drivers can only access their own earnings data.

**Headers Required**:
```
Authorization: Bearer <jwt_token>
```

---

## Earnings Endpoints

### 46. Get Driver Earnings

**GET** `/api/earnings`

Retrieve paginated earnings for the authenticated driver.

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "earning-uuid-123",
      "driverId": 45,
      "assignmentId": "assignment-uuid-456",
      "deliveryId": "delivery-uuid-789",
      "earningDate": "2024-01-15",
      "amount": 85.50,
      "currency": "USD",
      "calculationMethod": "PER_DELIVERY",
      "calculationDetails": {
        "method": "PER_DELIVERY",
        "rate": 8.50,
        "completedDeliveries": 10
      },
      "isProcessed": true,
      "processedAt": "2024-01-16T10:30:00.000Z",
      "stripeTransferId": "tr_stripe123",
      "createdAt": "2024-01-15T08:00:00.000Z",
      "assignment": {
        "id": "assignment-uuid-456",
        "restaurant": {
          "name": "Pizza Palace",
          "address": "123 Main St"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 95,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Error Responses
- **400 Bad Request** (Invalid Driver ID)
  ```json
  {
    "error": "Valid Driver ID is required"
  }
  ```
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 47. Get Earnings Summary

**GET** `/api/earnings/summary`

Retrieve comprehensive earnings summary for the authenticated driver.

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "totalEarnings": 2450.75,
    "pendingEarnings": 145.50,
    "processedEarnings": 2305.25,
    "thisWeekEarnings": 320.00,
    "thisMonthEarnings": 1250.50,
    "averageDailyEarnings": 65.75,
    "totalDeliveries": 156,
    "earningsByMethod": {
      "FIXED": 1200.00,
      "PER_DELIVERY": 950.75,
      "HOURLY": 300.00
    },
    "lastPaymentDate": "2024-01-10T00:00:00.000Z",
    "nextPaymentDate": "2024-01-17T00:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (Invalid Driver ID)
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 48. Get Daily Earnings

**GET** `/api/earnings/daily/:date`

Retrieve earnings for a specific date.

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Path Parameters**:
  - `date`: Date in YYYY-MM-DD format (e.g., "2024-01-15")

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "totalEarnings": 95.50,
    "totalDeliveries": 8,
    "earnings": [
      {
        "id": "earning-uuid-123",
        "assignmentId": "assignment-uuid-456",
        "amount": 45.00,
        "calculationMethod": "FIXED",
        "restaurant": "Pizza Palace",
        "createdAt": "2024-01-15T08:00:00.000Z"
      },
      {
        "id": "earning-uuid-124",
        "assignmentId": "assignment-uuid-457",
        "amount": 50.50,
        "calculationMethod": "PER_DELIVERY",
        "restaurant": "Burger Barn",
        "createdAt": "2024-01-15T14:30:00.000Z"
      }
    ]
  }
}
```

#### Error Responses
- **400 Bad Request** (Invalid date format)
  ```json
  {
    "error": "Invalid date format. Use YYYY-MM-DD"
  }
  ```
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 49. Get Weekly Earnings

**GET** `/api/earnings/weekly/:week`

Retrieve earnings for a specific week (starting from the provided date).

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Path Parameters**:
  - `week`: Week start date in YYYY-MM-DD format (e.g., "2024-01-08")

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "weekStart": "2024-01-08",
    "weekEnd": "2024-01-14",
    "totalEarnings": 425.75,
    "totalDeliveries": 32,
    "dailyBreakdown": [
      {
        "date": "2024-01-08",
        "earnings": 65.50,
        "deliveries": 5
      },
      {
        "date": "2024-01-09",
        "earnings": 78.25,
        "deliveries": 6
      }
    ],
    "averageDailyEarnings": 60.82
  }
}
```

#### Error Responses
- **400 Bad Request** (Invalid date format)
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 50. Get Pending Earnings

**GET** `/api/earnings/pending`

Retrieve all unprocessed earnings for the authenticated driver.

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "totalPendingAmount": 145.50,
    "pendingCount": 3,
    "oldestPendingDate": "2024-01-12",
    "earnings": [
      {
        "id": "earning-uuid-125",
        "amount": 55.00,
        "earningDate": "2024-01-14",
        "calculationMethod": "FIXED",
        "restaurant": "Taco Time",
        "daysWaiting": 3
      }
    ]
  }
}
```

#### Error Responses
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 51. Get Earning by ID

**GET** `/api/earnings/:id`

Retrieve detailed information about a specific earning.

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Path Parameters**:
  - `id`: Earning UUID

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "earning-uuid-123",
    "driverId": 45,
    "assignmentId": "assignment-uuid-456",
    "deliveryId": "delivery-uuid-789",
    "earningDate": "2024-01-15",
    "amount": 85.50,
    "currency": "USD",
    "calculationMethod": "PER_DELIVERY",
    "calculationDetails": {
      "method": "PER_DELIVERY",
      "rate": 8.50,
      "completedDeliveries": 10,
      "breakdown": {
        "baseRate": 8.50,
        "deliveries": 10,
        "total": 85.00
      }
    },
    "isProcessed": true,
    "processedAt": "2024-01-16T10:30:00.000Z",
    "stripeTransferId": "tr_stripe123",
    "assignment": {
      "id": "assignment-uuid-456",
      "restaurant": {
        "name": "Pizza Palace",
        "address": "123 Main St",
        "phone": "+1-555-0123"
      },
      "assignmentDate": "2024-01-15",
      "paymentType": "PER_DELIVERY",
      "paymentRate": 8.50
    },
    "delivery": {
      "id": "delivery-uuid-789",
      "customerAddress": "456 Oak Ave",
      "deliveredAt": "2024-01-15T18:45:00.000Z",
      "status": "DELIVERED"
    }
  }
}
```

#### Error Responses
- **400 Bad Request** (Missing earning ID)
  ```json
  {
    "error": "Earning ID is required"
  }
  ```
- **404 Not Found** (Earning not found)
  ```json
  {
    "success": false,
    "error": "Earning not found"
  }
  ```
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 52. Update Earning

**PUT** `/api/earnings/:id`

Update earning information (typically used by admin to mark as processed).

#### Request
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
  - `Content-Type: application/json`
- **Path Parameters**:
  - `id`: Earning UUID
- **Body**:
```json
{
  "isProcessed": true,
  "stripeTransferId": "tr_stripe123",
  "processedAt": "2024-01-16T10:30:00.000Z"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "earning-uuid-123",
    "isProcessed": true,
    "processedAt": "2024-01-16T10:30:00.000Z",
    "stripeTransferId": "tr_stripe123",
    "updatedAt": "2024-01-16T10:30:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (Missing earning ID)
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 53. Calculate Earnings for Assignment

**POST** `/api/earnings/calculate/assignment/:assignmentId`

Calculate and create earnings record for a completed assignment.

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Path Parameters**:
  - `assignmentId`: Assignment UUID

#### Success Response (200)
```json
{
  "success": true,
  "message": "Earnings calculated successfully for assignment"
}
```

#### Error Responses
- **400 Bad Request** (Missing assignment ID)
  ```json
  {
    "error": "Assignment ID is required"
  }
  ```
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

### 54. Calculate Earnings for Delivery

**POST** `/api/earnings/calculate/delivery/:deliveryId`

Calculate and create earnings record for a specific completed delivery.

#### Request
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Path Parameters**:
  - `deliveryId`: Delivery UUID

#### Success Response (200)
```json
{
  "success": true,
  "message": "Earnings calculated successfully for delivery"
}
```

#### Error Responses
- **400 Bad Request** (Missing delivery ID)
  ```json
  {
    "error": "Delivery ID is required"
  }
  ```
- **401 Unauthorized** (Missing/invalid token)
- **500 Internal Server Error**

---

## 💳 Payment Calculation Methods

### FIXED Payment
- Driver receives a fixed amount for the entire assignment
- Example: $50 for a full day shift

### PER_DELIVERY Payment
- Driver receives a set amount per completed delivery
- Example: $8.50 × 10 deliveries = $85.00

### HOURLY Payment
- Driver receives payment based on hours worked
- Calculated from assignment start time to estimated end time
- Example: $15/hour × 8 hours = $120.00

---

## Testing Examples

### Get Current Driver Earnings
```bash
curl -X GET "https://api.example.com/api/earnings?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### Get Weekly Earnings
```bash
curl -X GET "https://api.example.com/api/earnings/weekly/2024-01-08" \
  -H "Authorization: Bearer your-jwt-token"
```

### Calculate Assignment Earnings
```bash
curl -X POST "https://api.example.com/api/earnings/calculate/assignment/assignment-uuid-123" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## 📋 Important Notes

- All earnings are calculated automatically when assignments/deliveries are completed
- Drivers can only view their own earnings data
- Pending earnings are processed weekly (configurable)
- All monetary amounts are in USD with 2 decimal precision
- Earnings history is retained indefinitely for tax and reporting purposes
- Stripe is used for payment processing and transfers 