# Socket Communication API

This section covers real-time WebSocket communication, room management, and event handling for drivers and the system.

**Base URL**: WebSocket connection to server with Socket.IO

---

## Connection Setup

### WebSocket Configuration
- **Protocol**: Socket.IO with WebSocket and Polling fallback
- **CORS**: Configured for client applications
- **Transports**: WebSocket (primary), Polling (fallback)

### Client Connection
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:8000', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
```

---

## Room Management

### Driver Rooms
Drivers are automatically assigned to specific rooms upon authentication:

- **`driver:{driverId}`** - Individual driver room for targeted messages
- **`user:{userId}`** - User-specific room for account-related updates
- **`admin`** - Administrative room for system monitoring
- **`drivers`** - Broadcast room for all connected drivers

### Room Joining Process
1. Client connects to WebSocket
2. Client sends `driver:authenticate` event
3. Server validates driver credentials
4. Server assigns client to appropriate rooms

---

## Authentication Events

### 1. Driver Authentication

**Event**: `driver:authenticate`

Authenticate a driver and join appropriate rooms.

#### Client Sends
```javascript
socket.emit('driver:authenticate', {
  userId: 123,
  driverId: 45
});
```

#### Server Responses

**Success** (`driver:authenticated`):
```javascript
socket.on('driver:authenticated', (data) => {
  console.log(data); // { success: true }
});
```

**Error** (`error`):
```javascript
socket.on('error', (data) => {
  console.log(data); // { message: 'Unauthorized or pending driver' }
});
```

#### Requirements
- User must exist in database
- User must have active driver status (not `PENDING`)
- Valid userId and driverId must be provided

---

## Assignment Events

### 1. Assignment Update

**Event**: `assignment:update`

Update assignment status in real-time.

#### Client Sends
```javascript
socket.emit('assignment:update', {
  assignmentId: 'assignment-uuid-123',
  status: 'COMPLETED'
});
```

#### Server Responds

**Success** (`assignment:updated`):
```javascript
socket.on('assignment:updated', (data) => {
  console.log(data);
  // {
  //   assignmentId: 'assignment-uuid-123',
  //   status: 'COMPLETED',
  //   assignment: { /* full assignment object */ }
  // }
});
```

**Error** (`error`):
```javascript
socket.on('error', (data) => {
  console.log(data); // { message: 'Failed to update assignment' }
});
```

### 2. New Assignment Notification

**Event**: `assignment:new`

Server notifies driver of new assignment.

#### Server Sends
```javascript
socket.on('assignment:new', (data) => {
  console.log(data);
  // {
  //   assignment: {
  //     id: 'assignment-uuid-123',
  //     restaurant: { name: 'Pizza Palace' },
  //     assignmentDate: '2024-01-15',
  //     paymentType: 'PER_DELIVERY',
  //     paymentRate: 8.50
  //   },
  //   timestamp: '2024-01-15T10:30:00.000Z'
  // }
});
```

### 3. Assignment Status Change

**Event**: `assignment:status_changed`

Server notifies driver when assignment status changes.

#### Server Sends
```javascript
socket.on('assignment:status_changed', (data) => {
  console.log(data);
  // {
  //   assignmentId: 'assignment-uuid-123',
  //   status: 'CONFIRMED',
  //   timestamp: '2024-01-15T10:30:00.000Z'
  // }
});
```

---

## Delivery Events

### 1. Delivery Update

**Event**: `delivery:update`

Update delivery status with optional proof of delivery.

#### Client Sends
```javascript
socket.emit('delivery:update', {
  deliveryId: 'delivery-uuid-456',
  status: 'DELIVERED',
  proofImageUrl: 'https://cloudinary.com/proof123.jpg' // optional
});
```

#### Server Responds

**Success** (`delivery:updated`):
```javascript
socket.on('delivery:updated', (data) => {
  console.log(data);
  // {
  //   deliveryId: 'delivery-uuid-456',
  //   status: 'DELIVERED',
  //   delivery: { /* full delivery object */ }
  // }
});
```

### 2. New Delivery Notification

**Event**: `delivery:new`

Server notifies driver of new delivery.

#### Server Sends
```javascript
socket.on('delivery:new', (data) => {
  console.log(data);
  // {
  //   delivery: {
  //     id: 'delivery-uuid-456',
  //     customerAddress: '456 Oak Ave',
  //     estimatedDeliveryTime: '2024-01-15T18:00:00.000Z',
  //     specialInstructions: 'Ring doorbell twice'
  //   },
  //   timestamp: '2024-01-15T17:30:00.000Z'
  // }
});
```

### 3. Delivery Status Change

**Event**: `delivery:status_changed`

Server notifies driver when delivery status changes.

#### Server Sends
```javascript
socket.on('delivery:status_changed', (data) => {
  console.log(data);
  // {
  //   deliveryId: 'delivery-uuid-456',
  //   status: 'OUT_FOR_DELIVERY',
  //   timestamp: '2024-01-15T17:45:00.000Z'
  // }
});
```

---

## Location Events

### 1. Location Update

**Event**: `location:update`

Driver sends real-time location updates.

#### Client Sends
```javascript
socket.emit('location:update', {
  latitude: 47.6062,
  longitude: -122.3321
});
```

#### Server Responds

**Broadcast** (`location:updated`):
```javascript
// Broadcasted to relevant parties (admin dashboard, etc.)
socket.on('location:updated', (data) => {
  console.log(data);
  // {
  //   driverId: 45,
  //   latitude: 47.6062,
  //   longitude: -122.3321,
  //   timestamp: '2024-01-15T17:45:00.000Z'
  // }
});
```

### 2. Driver Location Update Notification

**Event**: `driver:location_updated`

Server notifies admin systems of driver location changes.

#### Server Sends (to admin room)
```javascript
socket.on('driver:location_updated', (data) => {
  console.log(data);
  // {
  //   driverId: 45,
  //   latitude: 47.6062,
  //   longitude: -122.3321,
  //   timestamp: '2024-01-15T17:45:00.000Z'
  // }
});
```

---

## Availability Events

### 1. Availability Update

**Event**: `availability:update`

Driver updates their availability status.

#### Client Sends
```javascript
socket.emit('availability:update', {
  isAvailable: true
});
```

#### Server Responds

**Success** (`availability:updated`):
```javascript
socket.on('availability:updated', (data) => {
  console.log(data);
  // {
  //   driverId: 45,
  //   isAvailable: true
  // }
});
```

**Error** (`error`):
```javascript
socket.on('error', (data) => {
  console.log(data); // { message: 'Failed to update availability' }
});
```

---

## Route Events

### 1. Route Optimization

**Event**: `route:optimized`

Server sends optimized route data to driver.

#### Server Sends
```javascript
socket.on('route:optimized', (data) => {
  console.log(data);
  // {
  //   routeData: {
  //     waypoints: [
  //       { lat: 47.6062, lng: -122.3321, address: 'Pizza Palace' },
  //       { lat: 47.6205, lng: -122.3493, address: '456 Oak Ave' }
  //     ],
  //     totalDistance: '5.2 miles',
  //     estimatedTime: '18 minutes',
  //     optimizationMethod: 'shortest_distance'
  //   },
  //   timestamp: '2024-01-15T17:30:00.000Z'
  // }
});
```

---

## 💳 Payment Events

### 1. Payment Update

**Event**: `payment:updated`

Server notifies driver of payment/earnings updates.

#### Server Sends
```javascript
socket.on('payment:updated', (data) => {
  console.log(data);
  // {
  //   paymentData: {
  //     earningId: 'earning-uuid-123',
  //     amount: 85.50,
  //     status: 'PROCESSED',
  //     stripeTransferId: 'tr_stripe123',
  //     processedAt: '2024-01-16T10:30:00.000Z'
  //   },
  //   timestamp: '2024-01-16T10:30:00.000Z'
  // }
});
```

---

## System Events

### 1. System Announcement

**Event**: `system:announcement`

Server sends system-wide announcements to drivers.

#### Server Sends
```javascript
socket.on('system:announcement', (data) => {
  console.log(data);
  // {
  //   message: 'System maintenance scheduled for tonight at 2 AM PST',
  //   timestamp: '2024-01-15T20:00:00.000Z'
  // }
});
```

---

## Connection Events

### 1. Connection Established

**Event**: `connect`

Fired when socket connection is established.

```javascript
socket.on('connect', () => {
  console.log('Connected to server');
  console.log('Socket ID:', socket.id);
});
```

### 2. Disconnection

**Event**: `disconnect`

Fired when socket connection is lost.

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Clean up local state
});
```

---

## REST API Integration

### 55. Connected Drivers Count

**GET** `/api/socket/connected-drivers/count`

Get the count of currently connected drivers.

#### Success Response (200)
```json
{
  "connectedDrivers": 24,
  "timestamp": "2024-01-15T17:45:00.000Z"
}
```

### 56. Connected Drivers List

**GET** `/api/socket/connected-drivers`

Get list of all connected drivers.

#### Success Response (200)
```json
{
  "drivers": [
    {
      "userId": 123,
      "driverId": 45,
      "socketId": "socket-abc123"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-15T17:45:00.000Z"
}
```

### 57. Check Driver Connection

**GET** `/api/socket/connected-drivers/:driverId`

Check if a specific driver is connected.

#### Success Response (200)
```json
{
  "driverId": 45,
  "isConnected": true,
  "timestamp": "2024-01-15T17:45:00.000Z"
}
```

### 58. Send System Announcement

**POST** `/api/socket/announcement`

Send system announcement to all connected drivers.

#### Request Body
```json
{
  "message": "System maintenance in 30 minutes",
  "targetDrivers": [45, 67] // optional - if omitted, sends to all
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Announcement sent successfully",
  "targetCount": 24
}
```

---

## Testing Examples

### Basic Client Setup
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:8000');

// Authenticate as driver
socket.emit('driver:authenticate', {
  userId: 123,
  driverId: 45
});

// Listen for assignment updates
socket.on('assignment:new', (data) => {
  console.log('New assignment received:', data);
});

// Update location every 30 seconds
setInterval(() => {
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('location:update', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  });
}, 30000);
```

### Delivery Status Update
```javascript
// Mark delivery as completed
socket.emit('delivery:update', {
  deliveryId: 'delivery-uuid-456',
  status: 'DELIVERED',
  proofImageUrl: 'https://cloudinary.com/proof123.jpg'
});
```

### Check Connection Status (REST)
```bash
curl -X GET "https://api.example.com/api/socket/connected-drivers/45" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## 📋 Important Notes

- WebSocket connections require driver authentication before receiving targeted events
- Location updates should be sent periodically (recommended: every 30 seconds when active)
- All events include timestamps for ordering and debugging
- Connection automatically retries on disconnect
- Room assignments persist until explicit disconnect
- Admin events are restricted to authenticated admin users
- All sensitive data in events follows the same security patterns as REST APIs
- Events are logged for debugging and audit purposes 