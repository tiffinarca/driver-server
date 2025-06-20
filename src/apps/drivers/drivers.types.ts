export interface CreateServiceAreaDto {
  areaName: string;
  postalCode?: string;
  city: string;
  state: string;
  country?: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export interface UpdateServiceAreaDto {
  areaName?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  isActive?: boolean;
}

export interface ServiceAreaResponse {
  id: string;
  driverId: number;
  areaName: string;
  postalCode: string | null;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ServiceAreaListResponse {
  serviceAreas: ServiceAreaResponse[];
  total: number;
}

// Schedule-related interfaces
export interface ScheduleResponse {
  id: string;
  driverId: number;
  dayOfWeek: number;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  isAvailable: boolean;
  maxDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduleDto {
  dayOfWeek: number;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  isAvailable?: boolean;
  maxDeliveries?: number;
}

export interface UpdateScheduleDto {
  startTime?: string; // HH:MM format
  endTime?: string;   // HH:MM format
  isAvailable?: boolean;
  maxDeliveries?: number;
}

export interface WeeklyScheduleResponse {
  schedules: ScheduleResponse[];
  coverage: {
    [key: number]: ScheduleResponse | null; // 0-6 for Sunday-Saturday
  };
}

export interface UpdateWeeklyScheduleDto {
  schedules: CreateScheduleDto[];
}

// Availability blocking interfaces (for date-specific blocks)
export interface CreateAvailabilityBlockDto {
  blockedDate: string; // YYYY-MM-DD format
  reason?: string;
  isFullDay?: boolean;
  startTime?: string; // HH:MM format (if not full day)
  endTime?: string;   // HH:MM format (if not full day)
}

export interface AvailabilityBlockResponse {
  id: string;
  driverId: number;
  blockedDate: Date;
  reason: string | null;
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
} 