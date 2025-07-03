import { AssignmentStatus, PaymentType } from '@prisma/client';

// DTO for creating a new restaurant assignment
export interface CreateAssignmentDto {
  driverId: number;
  restaurantId: string;
  assignmentDate: string; // YYYY-MM-DD format
  pickupTime: string; // HH:MM format
  estimatedDeliveries: number;
  paymentType?: PaymentType;
  paymentRate: number;
  algorithmScore?: number; // Score from assignment algorithm
  notes?: string;
}

// DTO for starting an assignment
export interface StartAssignmentDto {
  notes?: string;
}

// DTO for completing an assignment
export interface CompleteAssignmentDto {
  actualDeliveries: number;
  notes?: string;
}

// DTO for updating an assignment
export interface UpdateAssignmentDto {
  assignmentDate?: string;
  pickupTime?: string;
  estimatedDeliveries?: number;
  actualDeliveries?: number;
  paymentType?: PaymentType;
  paymentRate?: number;
  algorithmScore?: number;
  notes?: string;
}

// Response format for assignments
export interface AssignmentResponse {
  id: string;
  driverId: number;
  driver: {
    id: number;
    name: string | null;
    email: string;
  };
  restaurantId: string;
  assignmentDate: string; // YYYY-MM-DD format
  pickupTime: string; // HH:MM format
  estimatedDeliveries: number;
  actualDeliveries: number | null;
  status: AssignmentStatus;
  paymentType: PaymentType;
  paymentRate: number;
  algorithmScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Response format for paginated assignment lists
export interface AssignmentListResponse {
  assignments: AssignmentResponse[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Query parameters for filtering assignments
export interface AssignmentFilters {
  status?: AssignmentStatus;
  restaurantId?: string;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  page?: number;
  limit?: number;
}

// Assignment summary data
export interface AssignmentSummary {
  totalAssignments: number;
  pendingAssignments: number;
  todayAssignments: number;
  completedThisWeek: number;
}

// Assignment summary response (for API)
export interface AssignmentSummaryResponse {
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  todayAssignments: number;
  upcomingAssignments: number;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Assignment validation (legacy interface for compatibility)
export interface AssignmentValidation {
  isValid: boolean;
  errors: string[];
}

// Restaurant info interface (for future expansion)
export interface RestaurantInfo {
  id: string;
  name: string;
  address: string;
  phone?: string;
} 