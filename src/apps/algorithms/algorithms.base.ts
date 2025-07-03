import { PrismaClient } from '@prisma/client';
import { AssignmentUtils } from '../assignments/assignments.utils';
import { CreateAssignmentDto } from '../assignments/assignments.types';
import {
  DriverCandidate,
  RestaurantRequest,
  AssignmentResult,
  AlgorithmConfig,
  AlgorithmResult,
  BulkAssignmentRequest
} from './algorithms.types';

export abstract class BaseAssignmentAlgorithm {
  protected assignmentUtils: AssignmentUtils;
  protected config: AlgorithmConfig;

  constructor(
    protected prisma: PrismaClient,
    config: AlgorithmConfig = {}
  ) {
    this.assignmentUtils = new AssignmentUtils(prisma);
    this.config = {
      maxAssignmentsPerDriver: 3,
      workloadBalancingEnabled: true,
      geographicPriorityEnabled: true,
      lookbackDays: 7,
      ...config
    };
  }

  /**
   * Abstract method that each algorithm must implement
   */
  abstract getName(): string;

  /**
   * Abstract method for the main assignment logic
   */
  protected abstract selectDriver(
    availableDrivers: DriverCandidate[],
    request: RestaurantRequest,
    assignmentDate: string
  ): Promise<{ driver: DriverCandidate; score?: number } | null>;

  /**
   * Main entry point for assignment algorithms
   */
  async assignDrivers(request: BulkAssignmentRequest): Promise<AlgorithmResult> {
    const startTime = Date.now();
    const results: AssignmentResult[] = [];

    for (const restaurant of request.restaurants) {
      try {
        const result = await this.assignSingleDriver(restaurant, request.assignmentDate);
        results.push(result);
      } catch (error) {
        results.push({
          restaurantId: restaurant.restaurantId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const executionTime = Date.now() - startTime;
    const successfulAssignments = results.filter(r => r.success).length;
    const averageScore = this.calculateAverageScore(results);

    return {
      algorithm: this.getName(),
      assignmentDate: request.assignmentDate,
      results,
      totalRequests: request.restaurants.length,
      successfulAssignments,
      failedAssignments: request.restaurants.length - successfulAssignments,
      averageScore,
      executionTimeMs: executionTime
    };
  }

  /**
   * Assign a single driver to a restaurant
   */
  private async assignSingleDriver(
    request: RestaurantRequest,
    assignmentDate: string
  ): Promise<AssignmentResult> {
    // Get available drivers efficiently
    const availableDrivers = await this.getAvailableDriversWithMetrics(assignmentDate, request);

    if (availableDrivers.length === 0) {
      return {
        restaurantId: request.restaurantId,
        success: false,
        error: 'No available drivers found',
        reason: 'No drivers match availability criteria'
      };
    }

    // Use algorithm-specific selection logic
    const selection = await this.selectDriver(availableDrivers, request, assignmentDate);

    if (!selection) {
      return {
        restaurantId: request.restaurantId,
        success: false,
        error: 'No suitable driver found',
        reason: 'Algorithm could not select a driver'
      };
    }

    // Create the assignment
    const assignmentData: CreateAssignmentDto = {
      driverId: selection.driver.id,
      restaurantId: request.restaurantId,
      assignmentDate,
      pickupTime: request.pickupTime,
      estimatedDeliveries: request.estimatedDeliveries,
      paymentRate: request.paymentRate,
      paymentType: request.paymentType || 'FIXED',
      algorithmScore: selection.score || 0
    };

    const assignments = await this.assignmentUtils.bulkCreateAssignments([assignmentData]);

    if (assignments.successful > 0) {
      return {
        restaurantId: request.restaurantId,
        success: true,
        driverId: selection.driver.id,
        score: selection.score,
        reason: `Assigned by ${this.getName()} algorithm`
      };
    } else {
      return {
        restaurantId: request.restaurantId,
        success: false,
        error: assignments.errors[0]?.error || 'Failed to create assignment',
        reason: 'Database assignment creation failed'
      };
    }
  }

  /**
   * Get available drivers with performance metrics
   */
  protected async getAvailableDriversWithMetrics(
    assignmentDate: string,
    request: RestaurantRequest
  ): Promise<DriverCandidate[]> {
    // Get basic available drivers
    const basicDrivers = await this.assignmentUtils.getAvailableDrivers(assignmentDate);

    // Enhance with performance metrics
    const enhancedDrivers = await Promise.all(
      basicDrivers.map(async (driver) => {
        const metrics = await this.getDriverMetrics(driver.id, assignmentDate);
        return {
          ...driver,
          recentDeliveries: metrics.recentDeliveries,
          completionRate: metrics.completionRate
        };
      })
    );

    // Filter by geography if enabled
    if (this.config.geographicPriorityEnabled) {
      return enhancedDrivers.filter(driver =>
        driver.serviceAreas.some(area =>
          area.city.toLowerCase() === request.city.toLowerCase() &&
          area.state.toLowerCase() === request.state.toLowerCase()
        )
      );
    }

    return enhancedDrivers;
  }

  /**
   * Get driver performance metrics
   */
  private async getDriverMetrics(driverId: number, assignmentDate: string): Promise<{
    recentDeliveries: number;
    completionRate: number;
  }> {
    const startDate = new Date(assignmentDate);
    startDate.setDate(startDate.getDate() - (this.config.lookbackDays || 7));
    const lookbackStart = startDate.toISOString().split('T')[0];

    const workload = await this.assignmentUtils.getDriverWorkload(
      driverId,
      lookbackStart,
      assignmentDate
    );

    return {
      recentDeliveries: workload.averageDeliveries,
      completionRate: workload.totalAssignments > 0 
        ? (workload.completedAssignments / workload.totalAssignments) * 100 
        : 100
    };
  }

  /**
   * Calculate average score from results
   */
  private calculateAverageScore(results: AssignmentResult[]): number | undefined {
    const scoresWithValues = results.filter(r => r.score !== undefined && r.score !== null);
    if (scoresWithValues.length === 0) return undefined;

    const totalScore = scoresWithValues.reduce((sum, r) => sum + (r.score || 0), 0);
    return totalScore / scoresWithValues.length;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  protected calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
      Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 