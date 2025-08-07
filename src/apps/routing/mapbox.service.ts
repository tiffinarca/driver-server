import { mapboxConfig } from '../../config/mapbox';
import { CustomerData } from '../customers/customers.service';

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RestaurantLocation extends Location {
  address: string;
  pickup_duration?: number; // seconds
}

export interface RouteOptimizationRequest {
  restaurant: RestaurantLocation;
  customers: CustomerData[];
  vehicleStartTime?: string; // ISO 8601 format
  objectives?: 'min-total-travel-duration' | 'min-schedule-completion-time';
}

export interface OptimizedStop {
  type: 'start' | 'service' | 'pickup' | 'dropoff' | 'end';
  location: string;
  eta: string;
  odometer: number;
  wait?: number;
  duration?: number;
  services?: string[];
  pickups?: string[];
  dropoffs?: string[];
}

export interface OptimizedRoute {
  vehicle: string;
  stops: OptimizedStop[];
}

export interface OptimizationSolution {
  dropped: {
    services: string[];
    shipments: string[];
  };
  routes: OptimizedRoute[];
}

// Mapbox API response types
interface MapboxSubmissionResponse {
  id: string;
  status: string;
  status_date?: string;
}

export interface RouteOptimizationResult {
  success: boolean;
  jobId?: string;
  solution?: OptimizationSolution;
  error?: string;
  estimatedDurationMinutes?: number;
  totalDistanceKm?: number;
  optimizedSequence?: Array<{
    customerId: string;
    sequenceNumber: number;
    customerName: string;
    address: string;
    latitude: number;
    longitude: number;
  }>;
}

export class MapboxService {
  private readonly baseUrl = mapboxConfig.optimizationUrl;
  private readonly accessToken = mapboxConfig.apiKey;

  /**
   * Submit a routing problem to Mapbox Optimization API v2
   */
  async submitRouteOptimization(request: RouteOptimizationRequest): Promise<{ jobId: string; success: boolean; error?: string }> {
    try {
      // Build the routing problem document
      const routingProblem = this.buildRoutingProblem(request);

      const response = await fetch(`${this.baseUrl}?access_token=${this.accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routingProblem),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          jobId: '',
          success: false,
          error: `Mapbox API error: ${response.status} - ${error}`,
        };
      }

      const result = await response.json() as MapboxSubmissionResponse;
      
      return {
        jobId: result.id,
        success: true,
      };
    } catch (error) {
      return {
        jobId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Retrieve optimization solution from Mapbox
   */
  async retrieveOptimizationSolution(jobId: string): Promise<RouteOptimizationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/${jobId}?access_token=${this.accessToken}`);

      if (response.status === 202) {
        // Still processing
        return {
          success: false,
          error: 'Solution not ready yet',
        };
      }

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Mapbox API error: ${response.status} - ${error}`,
        };
      }

      const solution = await response.json() as OptimizationSolution;
      
      return this.processSolution(solution);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get full route optimization with polling for completion
   */
  async getOptimizedRoute(request: RouteOptimizationRequest): Promise<RouteOptimizationResult> {
    // Submit the optimization request
    const submissionResult = await this.submitRouteOptimization(request);
    
    if (!submissionResult.success) {
      return {
        success: false,
        error: submissionResult.error,
      };
    }

    // Poll for results
    let attempts = 0;
    const maxAttempts = mapboxConfig.maxPollingAttempts;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, mapboxConfig.pollingIntervalMs));
      
      const result = await this.retrieveOptimizationSolution(submissionResult.jobId);
      
      if (result.success) {
        result.jobId = submissionResult.jobId;
        return result;
      }
      
      // If it's not just "not ready yet", return the error
      if (result.error !== 'Solution not ready yet') {
        return result;
      }
      
      attempts++;
    }

    return {
      success: false,
      error: 'Optimization timeout - solution took too long to compute',
    };
  }

  /**
   * Build Mapbox routing problem document
   */
  private buildRoutingProblem(request: RouteOptimizationRequest) {
    const { restaurant, customers, vehicleStartTime, objectives } = request;

    // Create locations
    const locations = [
      {
        name: restaurant.name,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      },
      ...customers.map(customer => ({
        name: `customer-${customer.id}`,
        latitude: customer.latitude,
        longitude: customer.longitude,
      })),
    ];

    // Create vehicles
    const vehicles = [
      {
        name: 'delivery-vehicle',
        start_location: restaurant.name,
        end_location: restaurant.name,
        ...(vehicleStartTime && {
          start_time: vehicleStartTime,
        }),
      },
    ];

    // Create services (deliveries)
    const services = customers.map((customer, index) => ({
      name: `delivery-${customer.id}`,
      location: `customer-${customer.id}`,
      duration: 300, // 5 minutes per delivery
      service_times: customer.orderDetails?.notes?.includes('specific time') 
        ? [
            {
              earliest: vehicleStartTime || new Date().toISOString(),
              latest: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours window
              type: 'soft_end' as const,
            },
          ]
        : undefined,
    }));

    // Build the routing problem
    const routingProblem = {
      version: 1,
      locations,
      vehicles,
      services,
      ...(objectives && {
        options: {
          objectives: [objectives],
        },
      }),
    };

    return routingProblem;
  }

  /**
   * Process Mapbox solution into our format
   */
  private processSolution(solution: OptimizationSolution): RouteOptimizationResult {
    try {
      if (!solution.routes || solution.routes.length === 0) {
        return {
          success: false,
          error: 'No routes found in solution',
        };
      }

      const route = solution.routes[0]; // We only have one vehicle
      let totalDistance = 0;
      let estimatedDuration = 0;
      const optimizedSequence: Array<{
        customerId: string;
        sequenceNumber: number;
        customerName: string;
        address: string;
        latitude: number;
        longitude: number;
      }> = [];

      // Process stops to extract delivery sequence
      let sequenceNumber = 1;
      for (const stop of route.stops) {
        if (stop.type === 'service' && stop.services) {
          for (const service of stop.services) {
            if (service.startsWith('delivery-')) {
              const customerId = service.replace('delivery-', '');
              
              optimizedSequence.push({
                customerId,
                sequenceNumber: sequenceNumber++,
                customerName: `Customer ${customerId}`, // Would be populated from customer data
                address: stop.location,
                latitude: 0, // Would be populated from location data
                longitude: 0, // Would be populated from location data
              });
            }
          }
        }

        // Calculate total distance and duration
        if (stop.odometer !== undefined) {
          totalDistance = Math.max(totalDistance, stop.odometer);
        }
      }

      // Calculate estimated duration from start to end
      if (route.stops.length > 0) {
        const startTime = new Date(route.stops[0].eta);
        const endTime = new Date(route.stops[route.stops.length - 1].eta);
        estimatedDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
      }

      return {
        success: true,
        solution,
        estimatedDurationMinutes: estimatedDuration,
        totalDistanceKm: Math.round((totalDistance / 1000) * 100) / 100, // Convert meters to km, round to 2 decimals
        optimizedSequence,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error processing solution: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // /**
  //  * Calculate distance between two points (Haversine formula)
  //  */
  // private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  //   const R = 6371; // Earth's radius in kilometers
  //   const dLat = this.toRadians(lat2 - lat1);
  //   const dLon = this.toRadians(lon2 - lon1);
  //   const a = 
  //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //     Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
  //     Math.sin(dLon / 2) * Math.sin(dLon / 2);
  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //   return R * c;
  // }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 