// Algorithm types and interfaces

export interface DriverCandidate {
  id: number;
  name: string | null;
  email: string;
  serviceAreas: Array<{
    areaName: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
  }>;
  currentAssignments: number;
  recentDeliveries: number;
  averageRating?: number;
  completionRate: number;
}

export interface RestaurantRequest {
  restaurantId: string;
  name?: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  estimatedDeliveries: number;
  pickupTime: string;
  paymentRate: number;
  paymentType?: 'FIXED' | 'PER_DELIVERY' | 'HOURLY';
  priority?: number; // Higher number = higher priority
}

export interface AssignmentResult {
  restaurantId: string;
  success: boolean;
  driverId?: number;
  score?: number;
  error?: string;
  reason?: string;
}

export interface AlgorithmConfig {
  maxAssignmentsPerDriver?: number;
  workloadBalancingEnabled?: boolean;
  geographicPriorityEnabled?: boolean;
  lookbackDays?: number;
}

// Weighted algorithm specific types
export interface WeightConfig {
  locationWeight: number;     // High weight for location match
  proximityWeight: number;    // Medium weight for geographic proximity
  performanceWeight: number;  // Low weight for past performance
  workloadWeight: number;     // Weight for current workload balance
}

export interface DriverScore {
  driverId: number;
  totalScore: number;
  breakdown: {
    locationScore: number;
    proximityScore: number;
    performanceScore: number;
    workloadScore: number;
  };
}

export interface AlgorithmResult {
  algorithm: string;
  assignmentDate: string;
  results: AssignmentResult[];
  totalRequests: number;
  successfulAssignments: number;
  failedAssignments: number;
  averageScore?: number;
  executionTimeMs: number;
}

// Bulk assignment request
export interface BulkAssignmentRequest {
  assignmentDate: string;
  restaurants: RestaurantRequest[];
  config?: AlgorithmConfig;
  weightConfig?: WeightConfig;
}

// Algorithm performance metrics
export interface AlgorithmMetrics {
  algorithm: string;
  totalRuns: number;
  averageExecutionTime: number;
  successRate: number;
  averageScore: number;
} 