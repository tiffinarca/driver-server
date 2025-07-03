import { PrismaClient } from '@prisma/client';
import { MapboxService, RouteOptimizationRequest, RouteOptimizationResult } from './mapbox.service';
import { CustomersService, CustomerData } from '../customers/customers.service';

export interface RouteCalculationRequest {
  assignmentId: string;
  restaurantLocation: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  objectives?: 'min-total-travel-duration' | 'min-schedule-completion-time';
}

export interface RouteCalculationResult {
  success: boolean;
  routeId?: string;
  deliveryIds?: string[];
  error?: string;
  estimatedDurationMinutes?: number;
  totalDistanceKm?: number;
  optimizedSequence?: Array<{
    customerId: string;
    sequenceNumber: number;
    customerName: string;
    address: string;
  }>;
}

export interface DeliveryDetails {
  id: string;
  clientId: string;
  address: any;
  latitude: number;
  longitude: number;
  sequenceNumber: number;
  status: string;
}

export interface NavigationData {
  currentStep: number;
  totalSteps: number;
  nextDelivery?: DeliveryDetails;
  remainingDeliveries: DeliveryDetails[];
  estimatedTimeToNext?: number;
  estimatedTotalTime?: number;
}

export class RoutingService {
  private mapboxService: MapboxService;
  private customersService: CustomersService;

  constructor(private prisma: PrismaClient) {
    this.mapboxService = new MapboxService();
    this.customersService = new CustomersService();
  }

  /**
   * Calculate optimized route for an assignment
   */
  async calculateRoute(request: RouteCalculationRequest): Promise<RouteCalculationResult> {
    try {
      // Get assignment details
      const assignment = await this.prisma.restaurantAssignment.findUnique({
        where: { id: request.assignmentId },
      });

      if (!assignment) {
        return {
          success: false,
          error: 'Assignment not found',
        };
      }

      // Fetch customers for the delivery
      const customers = await this.customersService.fetchCustomersForDelivery({
        restaurantId: assignment.restaurantId,
        assignmentDate: assignment.assignmentDate.toISOString().split('T')[0],
        estimatedDeliveries: assignment.estimatedDeliveries,
      });

      if (customers.length === 0) {
        return {
          success: false,
          error: 'No customers found for delivery',
        };
      }

      // Build route optimization request
      const routeRequest: RouteOptimizationRequest = {
        restaurant: {
          name: request.restaurantLocation.name,
          address: request.restaurantLocation.address,
          latitude: request.restaurantLocation.latitude,
          longitude: request.restaurantLocation.longitude,
        },
        customers,
        vehicleStartTime: this.buildStartTime(assignment.assignmentDate, assignment.pickupTime),
        objectives: request.objectives || 'min-schedule-completion-time',
      };

      // Get optimized route from Mapbox
      const optimizationResult = await this.mapboxService.getOptimizedRoute(routeRequest);

      if (!optimizationResult.success) {
        return {
          success: false,
          error: optimizationResult.error,
        };
      }

      // Save route and deliveries to database
      const saveResult = await this.saveRouteAndDeliveries(
        request.assignmentId,
        optimizationResult,
        customers
      );

      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error,
        };
      }

      return {
        success: true,
        routeId: saveResult.routeId,
        deliveryIds: saveResult.deliveryIds,
        estimatedDurationMinutes: optimizationResult.estimatedDurationMinutes,
        totalDistanceKm: optimizationResult.totalDistanceKm,
        optimizedSequence: optimizationResult.optimizedSequence,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Recalculate route for an assignment
   */
  async recalculateRoute(assignmentId: string): Promise<RouteCalculationResult> {
    try {
      // Get assignment with current route
      const assignment = await this.prisma.restaurantAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          deliveryRoutes: {
            where: { isActive: true },
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
          deliveries: true,
        },
      });

      if (!assignment) {
        return {
          success: false,
          error: 'Assignment not found',
        };
      }

      // Deactivate current route
      if (assignment.deliveryRoutes.length > 0) {
        await this.prisma.deliveryRoute.update({
          where: { id: assignment.deliveryRoutes[0].id },
          data: { isActive: false },
        });
      }

      // For recalculation, we need restaurant location - this would come from your restaurant service
      // For now, using placeholder data
      const restaurantLocation = {
        name: `Restaurant ${assignment.restaurantId}`,
        address: 'Restaurant Address', // TODO: Get from restaurant service
        latitude: 37.7749, // TODO: Get actual coordinates
        longitude: -122.4194,
      };

      // Recalculate with same parameters
      return await this.calculateRoute({
        assignmentId,
        restaurantLocation,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get current route for assignment
   */
  async getRoute(assignmentId: string) {
    try {
      const route = await this.prisma.deliveryRoute.findFirst({
        where: {
          assignmentId,
          isActive: true,
        },
        include: {
          assignment: {
            include: {
              deliveries: {
                orderBy: { sequenceNumber: 'asc' },
              },
            },
          },
        },
      });

      if (!route) {
        return {
          success: false,
          error: 'No active route found for assignment',
        };
      }

      return {
        success: true,
        route: {
          id: route.id,
          totalDistanceKm: route.totalDistanceKm,
          estimatedDurationMinutes: route.estimatedDurationMinutes,
          optimizedStopSequence: route.optimizedStopSequence,
          routeMetadata: route.routeMetadata,
          calculatedAt: route.calculatedAt,
          deliveries: route.assignment.deliveries.map(delivery => ({
            id: delivery.id,
            clientId: delivery.clientId,
            address: delivery.deliveryAddress,
            latitude: delivery.deliveryLatitude,
            longitude: delivery.deliveryLongitude,
            sequenceNumber: delivery.sequenceNumber,
            status: delivery.status,
            deliveredAt: delivery.deliveredAt,
            deliveryNotes: delivery.deliveryNotes,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get navigation data for driver
   */
  async getNavigationData(assignmentId: string): Promise<{ success: boolean; navigation?: NavigationData; error?: string }> {
    try {
      const assignment = await this.prisma.restaurantAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          deliveries: {
            where: {
              status: {
                in: ['PENDING', 'PICKED_UP', 'IN_TRANSIT'],
              },
            },
            orderBy: { sequenceNumber: 'asc' },
          },
        },
      });

      if (!assignment) {
        return {
          success: false,
          error: 'Assignment not found',
        };
      }

      const remainingDeliveries = assignment.deliveries;
      const totalSteps = assignment.estimatedDeliveries;
      const currentStep = totalSteps - remainingDeliveries.length + 1;

      let nextDelivery: DeliveryDetails | undefined;
      if (remainingDeliveries.length > 0) {
        const next = remainingDeliveries[0];
        nextDelivery = {
          id: next.id,
          clientId: next.clientId,
          address: next.deliveryAddress,
          latitude: parseFloat(next.deliveryLatitude.toString()),
          longitude: parseFloat(next.deliveryLongitude.toString()),
          sequenceNumber: next.sequenceNumber,
          status: next.status,
        };
      }

      return {
        success: true,
        navigation: {
          currentStep,
          totalSteps,
          nextDelivery,
          remainingDeliveries: remainingDeliveries.map(delivery => ({
            id: delivery.id,
            clientId: delivery.clientId,
            address: delivery.deliveryAddress,
            latitude: parseFloat(delivery.deliveryLatitude.toString()),
            longitude: parseFloat(delivery.deliveryLongitude.toString()),
            sequenceNumber: delivery.sequenceNumber,
            status: delivery.status,
          })),
          // TODO: Calculate estimated times based on current location and route data
          estimatedTimeToNext: undefined,
          estimatedTotalTime: undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Save optimized route and deliveries to database
   */
  private async saveRouteAndDeliveries(
    assignmentId: string,
    optimizationResult: RouteOptimizationResult,
    customers: CustomerData[]
  ): Promise<{ success: boolean; routeId?: string; deliveryIds?: string[]; error?: string }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create delivery route record
        const deliveryRoute = await tx.deliveryRoute.create({
          data: {
            assignmentId,
            routePolyline: null, // Mapbox doesn't provide polyline in optimization response
            totalDistanceKm: optimizationResult.totalDistanceKm || 0,
            estimatedDurationMinutes: optimizationResult.estimatedDurationMinutes || 0,
            optimizedStopSequence: optimizationResult.optimizedSequence || [],
            routeMetadata: optimizationResult.solution ? JSON.parse(JSON.stringify(optimizationResult.solution)) : undefined,
            isActive: true,
          },
        });

        // Create delivery records based on optimized sequence
        const deliveryIds: string[] = [];
        
        if (optimizationResult.optimizedSequence) {
          for (const stop of optimizationResult.optimizedSequence) {
            const customer = customers.find(c => c.id === stop.customerId);
            
            if (customer) {
              const delivery = await tx.delivery.create({
                data: {
                  assignmentId,
                  clientId: customer.id,
                  deliveryAddress: {
                    street: customer.address.street,
                    city: customer.address.city,
                    state: customer.address.state,
                    zipCode: customer.address.zipCode,
                    country: customer.address.country,
                    customerName: customer.name,
                    phone: customer.phone,
                    orderDetails: customer.orderDetails,
                  },
                  deliveryLatitude: customer.latitude,
                  deliveryLongitude: customer.longitude,
                  sequenceNumber: stop.sequenceNumber,
                  status: 'PENDING',
                },
              });
              
              deliveryIds.push(delivery.id);
            }
          }
        } else {
          // Fallback: create deliveries in original order if optimization failed to provide sequence
          for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            const delivery = await tx.delivery.create({
              data: {
                assignmentId,
                clientId: customer.id,
                deliveryAddress: {
                  street: customer.address.street,
                  city: customer.address.city,
                  state: customer.address.state,
                  zipCode: customer.address.zipCode,
                  country: customer.address.country,
                  customerName: customer.name,
                  phone: customer.phone,
                  orderDetails: customer.orderDetails,
                },
                deliveryLatitude: customer.latitude,
                deliveryLongitude: customer.longitude,
                sequenceNumber: i + 1,
                status: 'PENDING',
              },
            });
            
            deliveryIds.push(delivery.id);
          }
        }

        return {
          success: true,
          routeId: deliveryRoute.id,
          deliveryIds,
        };
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database error occurred',
      };
    }
  }

  /**
   * Build start time for optimization from assignment date and pickup time
   */
  private buildStartTime(assignmentDate: Date, pickupTime: Date): string {
    // Combine assignment date with pickup time
    const startDateTime = new Date(assignmentDate);
    const pickupHours = pickupTime.getUTCHours();
    const pickupMinutes = pickupTime.getUTCMinutes();
    
    startDateTime.setHours(pickupHours, pickupMinutes, 0, 0);
    
    return startDateTime.toISOString();
  }
} 