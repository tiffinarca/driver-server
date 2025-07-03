import { BaseAssignmentAlgorithm } from './algorithms.base';
import { DriverCandidate, RestaurantRequest } from './algorithms.types';

/**
 * Workload Balancing Assignment Algorithm
 * 
 * This algorithm balances workload across drivers over time by analyzing
 * historical assignment data. It prioritizes drivers with lower recent
 * workload to ensure fair distribution of assignments.
 */
export class WorkloadBalancingAlgorithm extends BaseAssignmentAlgorithm {
  getName(): string {
    return 'workload-balancing';
  }

  protected async selectDriver(
    availableDrivers: DriverCandidate[],
    request: RestaurantRequest,
    assignmentDate: string
  ): Promise<{ driver: DriverCandidate; score?: number } | null> {
    if (availableDrivers.length === 0) {
      return null;
    }

    // Get detailed workload information for each driver
    const driversWithWorkload = await Promise.all(
      availableDrivers.map(async (driver) => {
        const workloadData = await this.getDetailedWorkload(driver.id, assignmentDate);
        return {
          driver,
          workloadData
        };
      })
    );

    // Score drivers based on workload balancing criteria
    const scoredDrivers = driversWithWorkload.map(({ driver, workloadData }) => {
      const score = this.calculateWorkloadScore(driver, workloadData, request);
      return { driver, score };
    });

    // Select driver with highest workload balancing score
    const selectedEntry = scoredDrivers.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    return selectedEntry;
  }

  private async getDetailedWorkload(driverId: number, assignmentDate: string) {
    const startDate = new Date(assignmentDate);
    startDate.setDate(startDate.getDate() - (this.config.lookbackDays || 7));
    const lookbackStart = startDate.toISOString().split('T')[0];

    return await this.assignmentUtils.getDriverWorkload(
      driverId,
      lookbackStart,
      assignmentDate
    );
  }

  private calculateWorkloadScore(
    driver: DriverCandidate,
    workloadData: any,
    request: RestaurantRequest
  ): number {
    let score = 0;

    // Base workload balancing score (higher score for lower workload)
    const maxRecentAssignments = 20; // Reasonable maximum for the lookback period
    const recentAssignmentScore = ((maxRecentAssignments - workloadData.totalAssignments) / maxRecentAssignments) * 40;
    score += Math.max(0, recentAssignmentScore);

    // Current assignment balancing (prefer drivers with fewer current assignments)
    const maxCurrentAssignments = 5; // Max daily assignments
    const currentAssignmentScore = ((maxCurrentAssignments - driver.currentAssignments) / maxCurrentAssignments) * 30;
    score += Math.max(0, currentAssignmentScore);

    // Performance consistency bonus (prefer drivers with good completion rates)
    const performanceScore = (driver.completionRate / 100) * 15;
    score += performanceScore;

    // Experience factor (prefer drivers with some experience but not overloaded)
    const experienceScore = this.calculateExperienceScore(workloadData.averageDeliveries);
    score += experienceScore;

    // Geographic preference (bonus for local drivers)
    const geographicScore = this.calculateGeographicBonus(driver, request);
    score += geographicScore;

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  private calculateExperienceScore(averageDeliveries: number): number {
    // Optimal experience range: 15-30 deliveries on average
    if (averageDeliveries >= 15 && averageDeliveries <= 30) {
      return 10; // Full experience bonus
    } else if (averageDeliveries < 15) {
      // New drivers get some credit but less
      return (averageDeliveries / 15) * 7;
    } else {
      // Very busy drivers get reduced score to balance workload
      return Math.max(0, 10 - ((averageDeliveries - 30) / 10));
    }
  }

  private calculateGeographicBonus(driver: DriverCandidate, request: RestaurantRequest): number {
    // Small bonus for drivers who serve the restaurant's area
    const hasAreaMatch = driver.serviceAreas.some(area =>
      area.city.toLowerCase() === request.city.toLowerCase() &&
      area.state.toLowerCase() === request.state.toLowerCase()
    );

    if (hasAreaMatch) {
      // Additional bonus for smaller service areas (more focused drivers)
      const relevantAreas = driver.serviceAreas.filter(area =>
        area.city.toLowerCase() === request.city.toLowerCase() &&
        area.state.toLowerCase() === request.state.toLowerCase()
      );
      
      const minRadius = Math.min(...relevantAreas.map(area => area.radiusKm));
      const radiusBonus = Math.max(0, 5 - (minRadius / 10)); // Up to 5 points for very local
      
      return 5 + radiusBonus; // Base 5 points + radius bonus
    }

    return 0; // No geographic bonus
  }

  /**
   * Get workload distribution for analytics
   */
  async getWorkloadDistribution(
    assignmentDate: string,
    driverIds?: number[]
  ): Promise<Array<{
    driverId: number;
    name: string | null;
    currentAssignments: number;
    recentWorkload: number;
    completionRate: number;
    averageDeliveries: number;
    workloadScore: number;
  }>> {
    const drivers = await this.assignmentUtils.getAvailableDrivers(assignmentDate);
    const targetDrivers = driverIds ? drivers.filter(d => driverIds.includes(d.id)) : drivers;

    const workloadData = await Promise.all(
      targetDrivers.map(async (driver) => {
        const workload = await this.getDetailedWorkload(driver.id, assignmentDate);
        const metrics = await this.getWorkloadDriverMetrics(driver.id, assignmentDate);
        
        const mockRequest: RestaurantRequest = {
          restaurantId: 'temp',
          city: 'General',
          state: 'NA',
          estimatedDeliveries: 25,
          pickupTime: '11:00',
          paymentRate: 150
        };

        const workloadScore = this.calculateWorkloadScore(
          { ...driver, ...metrics },
          workload,
          mockRequest
        );

        return {
          driverId: driver.id,
          name: driver.name,
          currentAssignments: driver.currentAssignments,
          recentWorkload: workload.totalAssignments,
          completionRate: metrics.completionRate,
          averageDeliveries: workload.averageDeliveries,
          workloadScore
        };
      })
    );

    return workloadData.sort((a, b) => b.workloadScore - a.workloadScore);
  }

  private async getWorkloadDriverMetrics(driverId: number, assignmentDate: string) {
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
} 