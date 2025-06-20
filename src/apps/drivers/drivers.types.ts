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