import { BaseAssignmentAlgorithm } from './algorithms.base';
import { DriverCandidate, RestaurantRequest, WeightConfig, DriverScore } from './algorithms.types';

/**
 * Weighted Scoring Assignment Algorithm (Perceptron-inspired)
 * 
 * This algorithm uses a weighted scoring system similar to a perceptron to evaluate
 * drivers based on multiple criteria:
 * - Location match (high weight): Does driver serve the restaurant's area?
 * - Geographic proximity (medium weight): How close is the driver to the restaurant?
 * - Performance record (low weight): Driver's past delivery performance
 * - Workload balance (configurable weight): Current assignment load
 * 
 * The algorithm is efficient as it doesn't need to load all drivers at once,
 * and uses database indexes for quick filtering.
 */
export class WeightedScoringAlgorithm extends BaseAssignmentAlgorithm {
  private weights: WeightConfig;

  constructor(prisma: any, config: any = {}, weights?: WeightConfig) {
    super(prisma, config);
    
    // Default weights based on perceptron principles
    this.weights = {
      locationWeight: 0.4,      // High weight (40%) - location is critical
      proximityWeight: 0.3,     // Medium weight (30%) - proximity matters
      performanceWeight: 0.15,  // Low weight (15%) - past performance
      workloadWeight: 0.15,     // Low weight (15%) - workload balance
      ...weights
    };

    // Normalize weights to ensure they sum to 1
    this.normalizeWeights();
  }

  getName(): string {
    return 'weighted-scoring';
  }

  protected async selectDriver(
    availableDrivers: DriverCandidate[],
    request: RestaurantRequest,
    assignmentDate: string
  ): Promise<{ driver: DriverCandidate; score?: number } | null> {
    if (availableDrivers.length === 0) {
      return null;
    }

    // Efficiently pre-filter drivers for location match to optimize performance
    const locationFilteredDrivers = this.preFilterByLocation(availableDrivers, request);
    const driversToScore = locationFilteredDrivers.length > 0 ? locationFilteredDrivers : availableDrivers;

    // Score all candidate drivers using the perceptron-inspired scoring
    const scoredDrivers = await Promise.all(
      driversToScore.map(async (driver) => {
        const score = await this.calculateWeightedScore(driver, request, assignmentDate);
        return { driver, score: score.totalScore, breakdown: score.breakdown };
      })
    );

    // Select driver with highest weighted score
    const selectedEntry = scoredDrivers.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    return {
      driver: selectedEntry.driver,
      score: selectedEntry.score
    };
  }

  /**
   * Calculate weighted score for a driver using perceptron-inspired approach
   */
  private async calculateWeightedScore(
    driver: DriverCandidate,
    request: RestaurantRequest,
    assignmentDate: string
  ): Promise<DriverScore> {
    // Calculate individual component scores (0-100 scale)
    const locationScore = this.calculateLocationScore(driver, request);
    const proximityScore = this.calculateProximityScore(driver, request);
    const performanceScore = this.calculatePerformanceScore(driver);
    const workloadScore = this.calculateWorkloadScore(driver);

    // Apply weights (perceptron-like weighted sum)
    const totalScore = 
      (locationScore * this.weights.locationWeight) +
      (proximityScore * this.weights.proximityWeight) +
      (performanceScore * this.weights.performanceWeight) +
      (workloadScore * this.weights.workloadWeight);

    return {
      driverId: driver.id,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        locationScore,
        proximityScore,
        performanceScore,
        workloadScore
      }
    };
  }

  /**
   * Location Score (High Weight)
   * Scores based on exact area match and service radius coverage
   */
  private calculateLocationScore(driver: DriverCandidate, request: RestaurantRequest): number {
    // Find matching service areas
    const matchingAreas = driver.serviceAreas.filter(area =>
      area.city.toLowerCase() === request.city.toLowerCase() &&
      area.state.toLowerCase() === request.state.toLowerCase()
    );

    if (matchingAreas.length === 0) {
      return 0; // No location match = 0 score
    }

    let score = 80; // Base score for location match

    // Bonus for smaller service radius (more focused/local driver)
    const minRadius = Math.min(...matchingAreas.map(area => area.radiusKm));
    if (minRadius <= 10) {
      score += 20; // Very local driver
    } else if (minRadius <= 20) {
      score += 15; // Reasonably local
    } else if (minRadius <= 35) {
      score += 10; // Moderately local
    } else {
      score += 5; // Large area coverage
    }

    return Math.min(100, score);
  }

  /**
   * Proximity Score (Medium Weight)
   * Scores based on geographic distance using Haversine formula
   */
  private calculateProximityScore(driver: DriverCandidate, request: RestaurantRequest): number {
    if (!request.latitude || !request.longitude) {
      // If no restaurant coordinates, use a moderate score
      return 50;
    }

    let bestDistance = Infinity;
    
    // Find closest service area to restaurant
    driver.serviceAreas.forEach(area => {
      const distance = this.calculateDistance(
        area.latitude,
        area.longitude,
        request.latitude!,
        request.longitude!
      );
      if (distance < bestDistance) {
        bestDistance = distance;
      }
    });

    // Convert distance to score (closer = higher score)
    if (bestDistance <= 5) {
      return 100; // Very close
    } else if (bestDistance <= 10) {
      return 90; // Close
    } else if (bestDistance <= 20) {
      return 75; // Reasonably close
    } else if (bestDistance <= 50) {
      return 50; // Moderate distance
    } else {
      return Math.max(0, 30 - (bestDistance - 50) / 10); // Decreasing score for far distances
    }
  }

  /**
   * Performance Score (Low Weight)
   * Scores based on past delivery performance and completion rate
   */
  private calculatePerformanceScore(driver: DriverCandidate): number {
    let score = 0;

    // Completion rate score (0-100)
    score += driver.completionRate * 0.6; // 60% of performance score

    // Experience score based on recent deliveries (0-40 points)
    const experienceScore = this.calculateExperienceScore(driver.recentDeliveries);
    score += experienceScore * 0.4; // 40% of performance score

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Workload Score (Low Weight)
   * Scores based on current assignment load for fair distribution
   */
  private calculateWorkloadScore(driver: DriverCandidate): number {
    const maxReasonableAssignments = 5; // Daily limit
    
    if (driver.currentAssignments >= maxReasonableAssignments) {
      return 0; // Overloaded driver
    }

    // Higher score for drivers with fewer current assignments
    const score = ((maxReasonableAssignments - driver.currentAssignments) / maxReasonableAssignments) * 100;
    return Math.round(score);
  }

  private calculateExperienceScore(recentDeliveries: number): number {
    // Optimal experience range: 15-30 deliveries
    if (recentDeliveries >= 15 && recentDeliveries <= 30) {
      return 100; // Optimal experience
    } else if (recentDeliveries < 15) {
      // Scale up for newer drivers
      return (recentDeliveries / 15) * 80; // Up to 80% for experience
    } else {
      // Scale down for very busy drivers to balance workload
      return Math.max(0, 100 - ((recentDeliveries - 30) * 2));
    }
  }

  /**
   * Pre-filter drivers by location for efficiency
   * This avoids loading unnecessary data for drivers who don't serve the area
   */
  private preFilterByLocation(drivers: DriverCandidate[], request: RestaurantRequest): DriverCandidate[] {
    return drivers.filter(driver =>
      driver.serviceAreas.some(area =>
        area.city.toLowerCase() === request.city.toLowerCase() &&
        area.state.toLowerCase() === request.state.toLowerCase()
      )
    );
  }

  /**
   * Normalize weights to ensure they sum to 1.0 for proper perceptron behavior
   */
  private normalizeWeights(): void {
    const sum = this.weights.locationWeight + 
                this.weights.proximityWeight + 
                this.weights.performanceWeight + 
                this.weights.workloadWeight;

    if (sum !== 1.0) {
      this.weights.locationWeight /= sum;
      this.weights.proximityWeight /= sum;
      this.weights.performanceWeight /= sum;
      this.weights.workloadWeight /= sum;
    }
  }

  /**
   * Get detailed scoring breakdown for analytics and debugging
   */
  async getDetailedScoring(
    request: RestaurantRequest,
    assignmentDate: string,
    driverIds?: number[]
  ): Promise<DriverScore[]> {
    // Get available drivers (filtered by IDs if provided)
    const allDrivers = await this.getAvailableDriversWithMetrics(assignmentDate, request);
    const targetDrivers = driverIds ? allDrivers.filter(d => driverIds.includes(d.id)) : allDrivers;

    // Calculate scores for all target drivers
    const scores = await Promise.all(
      targetDrivers.map(driver => this.calculateWeightedScore(driver, request, assignmentDate))
    );

    // Sort by total score (highest first)
    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Update weights dynamically (for algorithm optimization)
   */
  updateWeights(newWeights: Partial<WeightConfig>): void {
    this.weights = { ...this.weights, ...newWeights };
    this.normalizeWeights();
  }

  /**
   * Get current weights configuration
   */
  getWeights(): WeightConfig {
    return { ...this.weights };
  }
} 