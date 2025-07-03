# Assignment Utilities & External Integration

This documentation covers the utility methods and integration patterns for external systems to work with the restaurant assignment system.

---

## 🔧 AssignmentUtils Class

The `AssignmentUtils` class provides utility methods for external assignment algorithms and integrations. This class is designed to be used by external systems that need to programmatically manage assignments.

### Import and Setup

```typescript
import { PrismaClient } from '@prisma/client';
import { AssignmentUtils } from './src/apps/assignments/assignments.utils';

const prisma = new PrismaClient();
const assignmentUtils = new AssignmentUtils(prisma);
```

---

## 🔍 Driver Availability Methods

### 44. Get Available Drivers

Find drivers available for assignment on a specific date.

#### Method Signature
```typescript
async getAvailableDrivers(
  assignmentDate: string,      // YYYY-MM-DD format
  restaurantId?: string        // Optional restaurant filter
): Promise<Array<{
  id: number;
  name: string | null;
  email: string;
  serviceAreas: Array<{
    areaName: string;
    city: string;
    state: string;
    radiusKm: number;
  }>;
  currentAssignments: number;
}>>
```

#### Usage Example
```typescript
// Get all available drivers for January 15th, 2024
const availableDrivers = await assignmentUtils.getAvailableDrivers('2024-01-15');

console.log('Available drivers:', availableDrivers);
// Output:
// [
//   {
//     "id": 123,
//     "name": "John Doe",
//     "email": "john.doe@example.com",
//     "serviceAreas": [
//       {
//         "areaName": "Downtown Seattle",
//         "city": "Seattle",
//         "state": "WA",
//         "radiusKm": 15
//       }
//     ],
//     "currentAssignments": 2
//   }
// ]
```

#### Business Logic
- Only returns ACTIVE drivers
- Filters drivers who have schedules for the day of week
- Excludes drivers with availability blocks on the date
- Shows current assignment count for workload balancing

---

### 45. Check Driver Availability

Validate if a specific driver is available for assignment.

#### Method Signature
```typescript
async isDriverAvailable(
  driverId: number,
  assignmentDate: string,      // YYYY-MM-DD format
  restaurantId: string
): Promise<{
  isValid: boolean;
  errors: string[];
}>
```

#### Usage Example
```typescript
// Check if driver 123 is available for restaurant on Jan 15th
const validation = await assignmentUtils.isDriverAvailable(
  123, 
  '2024-01-15', 
  'restaurant-abc'
);

if (validation.isValid) {
  console.log('Driver is available for assignment');
} else {
  console.log('Driver not available:', validation.errors);
  // Output: ["Driver is not scheduled to work on this day"]
}
```

#### Validation Rules
- Driver must exist and be ACTIVE
- Driver must have a schedule for the day of week
- Driver must not be blocked on the specific date  
- Driver must not already be assigned to the same restaurant

---

## 📊 Analytics & Reporting Methods

### Get Driver Workload

Analyze driver workload over a date range.

#### Method Signature
```typescript
async getDriverWorkload(
  driverId: number,
  startDate: string,           // YYYY-MM-DD format
  endDate: string             // YYYY-MM-DD format  
): Promise<{
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  averageDeliveries: number;
  dates: Array<{
    date: Date;
    assignmentCount: number;
    totalDeliveries: number;
  }>;
}>
```

#### Usage Example
```typescript
// Get workload for driver 123 in January 2024
const workload = await assignmentUtils.getDriverWorkload(
  123,
  '2024-01-01',
  '2024-01-31'
);

console.log('Driver workload:', workload);
// Output:
// {
//   "totalAssignments": 20,
//   "pendingAssignments": 3,
//   "completedAssignments": 17,
//   "averageDeliveries": 22.5,
//   "dates": [
//     {
//       "date": "2024-01-15T00:00:00.000Z",
//       "assignmentCount": 1,
//       "totalDeliveries": 25
//     }
//   ]
// }
```

---

### Get Restaurant Statistics

Analyze restaurant assignment statistics.

#### Method Signature
```typescript
async getRestaurantStats(
  restaurantId: string,
  startDate: string,           // YYYY-MM-DD format
  endDate: string             // YYYY-MM-DD format
): Promise<{
  totalAssignments: number;
  uniqueDrivers: number;
  averageDeliveries: number;
  totalDeliveries: number;
  completionRate: number;      // Percentage
}>
```

#### Usage Example
```typescript
// Get stats for restaurant in January 2024
const stats = await assignmentUtils.getRestaurantStats(
  'restaurant-123',
  '2024-01-01', 
  '2024-01-31'
);

console.log('Restaurant stats:', stats);
// Output:
// {
//   "totalAssignments": 31,
//   "uniqueDrivers": 8,
//   "averageDeliveries": 23.2,
//   "totalDeliveries": 719,
//   "completionRate": 96.77
// }
```

---

## 🚀 Bulk Operations

### Bulk Create Assignments

Create multiple assignments in a single operation with validation.

#### Method Signature
```typescript
async bulkCreateAssignments(
  assignments: CreateAssignmentDto[]
): Promise<{
  successful: number;
  failed: number;
  errors: Array<{
    assignment: CreateAssignmentDto;
    error: string;
  }>;
}>
```

#### Usage Example
```typescript
import { CreateAssignmentDto } from './src/apps/assignments/assignments.types';

const assignmentsToCreate: CreateAssignmentDto[] = [
  {
    driverId: 123,
    restaurantId: 'restaurant-abc',
    assignmentDate: '2024-01-15',
    pickupTime: '11:00',
    estimatedDeliveries: 25,
    paymentType: 'FIXED',
    paymentRate: 150.00,
    notes: 'Lunch rush'
  },
  {
    driverId: 124,
    restaurantId: 'restaurant-def', 
    assignmentDate: '2024-01-15',
    pickupTime: '10:30',
    estimatedDeliveries: 30,
    paymentType: 'PER_DELIVERY',
    paymentRate: 8.50
  }
];

const result = await assignmentUtils.bulkCreateAssignments(assignmentsToCreate);

console.log('Bulk creation result:', result);
// Output:
// {
//   "successful": 1,
//   "failed": 1,
//   "errors": [
//     {
//       "assignment": { ... },
//       "error": "Driver is not scheduled to work on this day"
//     }
//   ]
// }
```

#### Features
- Validates each assignment before creation
- Continues processing even if some assignments fail
- Returns detailed error information for failed assignments
- Atomic operation for each individual assignment

---

## 🤖 Algorithm Integration Patterns

### Pattern 1: Simple Assignment Algorithm

Basic algorithm that assigns drivers to restaurants based on availability.

```typescript
class SimpleAssignmentAlgorithm {
  constructor(private assignmentUtils: AssignmentUtils) {}

  async assignDriversForDate(date: string, restaurantRequests: Array<{
    restaurantId: string;
    estimatedDeliveries: number;
    pickupTime: string;
    paymentRate: number;
  }>) {
    const results = [];
    
    for (const request of restaurantRequests) {
      // Get available drivers
      const availableDrivers = await this.assignmentUtils.getAvailableDrivers(date);
      
      if (availableDrivers.length === 0) {
        results.push({
          restaurantId: request.restaurantId,
          success: false,
          error: 'No available drivers'
        });
        continue;
      }

      // Select driver with least current assignments (load balancing)
      const selectedDriver = availableDrivers.reduce((prev, current) => 
        prev.currentAssignments < current.currentAssignments ? prev : current
      );

      // Create assignment
      const assignments = await this.assignmentUtils.bulkCreateAssignments([{
        driverId: selectedDriver.id,
        restaurantId: request.restaurantId,
        assignmentDate: date,
        pickupTime: request.pickupTime,
        estimatedDeliveries: request.estimatedDeliveries,
        paymentRate: request.paymentRate,
        paymentType: 'FIXED'
      }]);

      results.push({
        restaurantId: request.restaurantId,
        success: assignments.successful > 0,
        driverId: assignments.successful > 0 ? selectedDriver.id : null,
        error: assignments.errors[0]?.error || null
      });
    }

    return results;
  }
}
```

### Pattern 2: Geographic Assignment Algorithm

Algorithm that considers driver service areas and restaurant locations.

```typescript
class GeographicAssignmentAlgorithm {
  constructor(private assignmentUtils: AssignmentUtils) {}

  async assignByLocation(date: string, restaurantRequests: Array<{
    restaurantId: string;
    city: string;
    state: string;
    estimatedDeliveries: number;
    pickupTime: string;
    paymentRate: number;
  }>) {
    const results = [];

    for (const request of restaurantRequests) {
      // Get available drivers
      const availableDrivers = await this.assignmentUtils.getAvailableDrivers(date);
      
      // Filter drivers by service area match
      const localDrivers = availableDrivers.filter(driver => 
        driver.serviceAreas.some(area => 
          area.city.toLowerCase() === request.city.toLowerCase() &&
          area.state.toLowerCase() === request.state.toLowerCase()
        )
      );

      if (localDrivers.length === 0) {
        results.push({
          restaurantId: request.restaurantId,
          success: false,
          error: 'No drivers available in the area'
        });
        continue;
      }

      // Select driver with smallest service radius (most local)
      const selectedDriver = localDrivers.reduce((prev, current) => {
        const prevMinRadius = Math.min(...prev.serviceAreas.map(sa => sa.radiusKm));
        const currentMinRadius = Math.min(...current.serviceAreas.map(sa => sa.radiusKm));
        return prevMinRadius < currentMinRadius ? prev : current;
      });

      // Create assignment
      const assignments = await this.assignmentUtils.bulkCreateAssignments([{
        driverId: selectedDriver.id,
        restaurantId: request.restaurantId,
        assignmentDate: date,
        pickupTime: request.pickupTime,
        estimatedDeliveries: request.estimatedDeliveries,
        paymentRate: request.paymentRate,
        paymentType: 'FIXED'
      }]);

      results.push({
        restaurantId: request.restaurantId,
        success: assignments.successful > 0,
        driverId: assignments.successful > 0 ? selectedDriver.id : null,
        error: assignments.errors[0]?.error || null
      });
    }

    return results;
  }
}
```

### Pattern 3: Workload Balancing Algorithm

Algorithm that balances workload across drivers over time.

```typescript
class WorkloadBalancingAlgorithm {
  constructor(private assignmentUtils: AssignmentUtils) {}

  async assignWithBalancing(
    date: string, 
    restaurantRequests: Array<{
      restaurantId: string;
      estimatedDeliveries: number;
      pickupTime: string;
      paymentRate: number;
    }>,
    lookbackDays: number = 7
  ) {
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - lookbackDays);
    const lookbackStart = startDate.toISOString().split('T')[0];

    const results = [];

    for (const request of restaurantRequests) {
      // Get available drivers
      const availableDrivers = await this.assignmentUtils.getAvailableDrivers(date);
      
      if (availableDrivers.length === 0) {
        results.push({
          restaurantId: request.restaurantId,
          success: false,
          error: 'No available drivers'
        });
        continue;
      }

      // Get workload for each driver over lookback period
      const driverWorkloads = await Promise.all(
        availableDrivers.map(async driver => {
          const workload = await this.assignmentUtils.getDriverWorkload(
            driver.id,
            lookbackStart,
            date
          );
          return {
            driver,
            workload: workload.totalAssignments,
            averageDeliveries: workload.averageDeliveries
          };
        })
      );

      // Select driver with lowest recent workload
      const selectedDriverInfo = driverWorkloads.reduce((prev, current) => 
        prev.workload < current.workload ? prev : current
      );

      // Create assignment
      const assignments = await this.assignmentUtils.bulkCreateAssignments([{
        driverId: selectedDriverInfo.driver.id,
        restaurantId: request.restaurantId,
        assignmentDate: date,
        pickupTime: request.pickupTime,
        estimatedDeliveries: request.estimatedDeliveries,
        paymentRate: request.paymentRate,
        paymentType: 'FIXED'
      }]);

      results.push({
        restaurantId: request.restaurantId,
        success: assignments.successful > 0,
        driverId: assignments.successful > 0 ? selectedDriverInfo.driver.id : null,
        previousWorkload: selectedDriverInfo.workload,
        error: assignments.errors[0]?.error || null
      });
    }

    return results;
  }
}
```

---

## 🔌 REST API Integration

For external systems that prefer REST API integration over direct database access:

### Direct API Calls

```javascript
// Example using fetch API
async function createAssignmentViaAPI(assignmentData) {
  const response = await fetch('http://localhost:3000/api/assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assignmentData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}

// Usage
try {
  const assignment = await createAssignmentViaAPI({
    driverId: 123,
    restaurantId: 'restaurant-abc',
    assignmentDate: '2024-01-15',
    pickupTime: '11:00',
    estimatedDeliveries: 25,
    paymentType: 'FIXED',
    paymentRate: 150.00,
    notes: 'Created via external API'
  });
  
  console.log('Assignment created:', assignment.id);
} catch (error) {
  console.error('Failed to create assignment:', error.message);
}
```

### Webhook Integration

For real-time updates, you can implement webhooks:

```typescript
// Example webhook handler
app.post('/webhooks/assignment-created', (req, res) => {
  const assignment = req.body;
  
  // Process assignment creation
  console.log('New assignment created:', assignment.id);
  
  // Notify relevant systems
  notifyDriverApp(assignment.driverId, assignment);
  updateRestaurantDashboard(assignment.restaurantId, assignment);
  
  res.status(200).json({ received: true });
});
```

---

## 📈 Performance Considerations

### Bulk Operations
- Use `bulkCreateAssignments()` for creating multiple assignments
- Batch requests when possible to reduce database round trips
- Consider implementing queue systems for large-scale operations

### Caching Strategies
```typescript
// Example: Cache available drivers for short periods
const driverCache = new Map();

async function getCachedAvailableDrivers(date: string) {
  const cacheKey = `drivers-${date}`;
  
  if (driverCache.has(cacheKey)) {
    const cached = driverCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
      return cached.data;
    }
  }
  
  const drivers = await assignmentUtils.getAvailableDrivers(date);
  driverCache.set(cacheKey, {
    data: drivers,
    timestamp: Date.now()
  });
  
  return drivers;
}
```

### Database Optimization
- Assignments are indexed by `assignmentDate` and `driverId` for fast queries
- Use date range queries efficiently
- Consider read replicas for analytics queries

---

## 🚨 Error Handling Best Practices

### Comprehensive Error Handling
```typescript
async function safelyCreateAssignment(assignmentData: CreateAssignmentDto) {
  try {
    // Validate driver availability first
    const validation = await assignmentUtils.isDriverAvailable(
      assignmentData.driverId,
      assignmentData.assignmentDate,
      assignmentData.restaurantId
    );
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        type: 'validation'
      };
    }
    
    // Create assignment
    const result = await assignmentUtils.bulkCreateAssignments([assignmentData]);
    
    if (result.failed > 0) {
      return {
        success: false,
        errors: result.errors.map(e => e.error),
        type: 'creation'
      };
    }
    
    return {
      success: true,
      assignmentId: result.successful > 0 ? 'created' : null
    };
    
  } catch (error) {
    console.error('Unexpected error creating assignment:', error);
    return {
      success: false,
      errors: ['Internal server error'],
      type: 'system'
    };
  }
}
```

### Retry Logic
```typescript
async function createAssignmentWithRetry(
  assignmentData: CreateAssignmentDto,
  maxRetries: number = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await safelyCreateAssignment(assignmentData);
      
      if (result.success) {
        return result;
      }
      
      // Don't retry validation errors
      if (result.type === 'validation') {
        return result;
      }
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

---

## 📚 Integration Examples

### Complete Integration Example

```typescript
import { PrismaClient } from '@prisma/client';
import { AssignmentUtils } from './src/apps/assignments/assignments.utils';

class RestaurantAssignmentManager {
  private assignmentUtils: AssignmentUtils;
  
  constructor() {
    const prisma = new PrismaClient();
    this.assignmentUtils = new AssignmentUtils(prisma);
  }

  async scheduleWeeklyAssignments(
    weekStartDate: string,
    restaurantRequests: Array<{
      restaurantId: string;
      city: string;
      state: string;
      dailyRequirements: Array<{
        dayOffset: number; // 0-6 for Monday-Sunday
        pickupTime: string;
        estimatedDeliveries: number;
        paymentRate: number;
      }>;
    }>
  ) {
    const results = [];
    
    for (const restaurant of restaurantRequests) {
      for (const requirement of restaurant.dailyRequirements) {
        const assignmentDate = new Date(weekStartDate);
        assignmentDate.setDate(assignmentDate.getDate() + requirement.dayOffset);
        const dateStr = assignmentDate.toISOString().split('T')[0];
        
        // Get available drivers for this date
        const availableDrivers = await this.assignmentUtils.getAvailableDrivers(dateStr);
        
        // Filter by service area
        const localDrivers = availableDrivers.filter(driver =>
          driver.serviceAreas.some(area =>
            area.city.toLowerCase() === restaurant.city.toLowerCase() &&
            area.state.toLowerCase() === restaurant.state.toLowerCase()
          )
        );
        
        if (localDrivers.length === 0) {
          results.push({
            restaurantId: restaurant.restaurantId,
            date: dateStr,
            success: false,
            error: 'No local drivers available'
          });
          continue;
        }
        
        // Select driver with least current assignments
        const selectedDriver = localDrivers.reduce((prev, current) =>
          prev.currentAssignments < current.currentAssignments ? prev : current
        );
        
        // Create assignment
        const assignment = await this.assignmentUtils.bulkCreateAssignments([{
          driverId: selectedDriver.id,
          restaurantId: restaurant.restaurantId,
          assignmentDate: dateStr,
          pickupTime: requirement.pickupTime,
          estimatedDeliveries: requirement.estimatedDeliveries,
          paymentRate: requirement.paymentRate,
          paymentType: 'FIXED'
        }]);
        
        results.push({
          restaurantId: restaurant.restaurantId,
          date: dateStr,
          success: assignment.successful > 0,
          driverId: assignment.successful > 0 ? selectedDriver.id : null,
          error: assignment.errors[0]?.error || null
        });
      }
    }
    
    return results;
  }
}

// Usage
const manager = new RestaurantAssignmentManager();

const weeklyResults = await manager.scheduleWeeklyAssignments('2024-01-15', [
  {
    restaurantId: 'restaurant-123',
    city: 'Seattle',
    state: 'WA',
    dailyRequirements: [
      { dayOffset: 0, pickupTime: '11:00', estimatedDeliveries: 25, paymentRate: 150 }, // Monday
      { dayOffset: 2, pickupTime: '11:30', estimatedDeliveries: 30, paymentRate: 175 }, // Wednesday
      { dayOffset: 4, pickupTime: '11:00', estimatedDeliveries: 35, paymentRate: 200 }  // Friday
    ]
  }
]);

console.log('Weekly assignment results:', weeklyResults);
```

This comprehensive documentation provides everything needed for external systems to integrate with the restaurant assignment system, from simple API calls to complex algorithmic assignment strategies. 