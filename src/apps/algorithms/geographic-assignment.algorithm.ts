import { BaseAssignmentAlgorithm } from './algorithms.base';
import { DriverCandidate, RestaurantRequest } from './algorithms.types';

/**
 * Geographic Assignment Algorithm
 * 
 * This algorithm considers driver service areas and restaurant locations to assign
 * the most geographically suitable driver. It prioritizes drivers with smaller
 * service areas (more local) and those closest to the restaurant.
 */
export class GeographicAssignmentAlgorithm extends BaseAssignmentAlgorithm {
  getName(): string {
    return 'geographic-assignment';
  }

  protected async selectDriver(
    availableDrivers: DriverCandidate[],
    request: RestaurantRequest,
    assignmentDate: string
  ): Promise<{ driver: DriverCandidate; score?: number } | null> {
    if (availableDrivers.length === 0) {
      return null;
    }

    // Filter drivers who serve the restaurant's area
    const localDrivers = availableDrivers.filter(driver =>
      driver.serviceAreas.some(area =>
        area.city.toLowerCase() === request.city.toLowerCase() &&
        area.state.toLowerCase() === request.state.toLowerCase()
      )
    );

    if (localDrivers.length === 0) {
      // If no exact city match, fall back to any available driver
      return this.selectByProximity(availableDrivers, request);
    }

    // Score drivers based on geographic suitability
    const scoredDrivers = localDrivers.map(driver => {
      const score = this.calculateGeographicScore(driver, request);
      return { driver, score };
    });

    // Select driver with highest geographic score
    const selectedEntry = scoredDrivers.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    return selectedEntry;
  }

  private calculateGeographicScore(driver: DriverCandidate, request: RestaurantRequest): number {
    let score = 0;

    // Find matching service areas for the restaurant location
    const matchingAreas = driver.serviceAreas.filter(area =>
      area.city.toLowerCase() === request.city.toLowerCase() &&
      area.state.toLowerCase() === request.state.toLowerCase()
    );

    if (matchingAreas.length === 0) {
      return 0; // No geographic match
    }

    // Base score for city/state match
    score += 50;

    // Bonus for smaller service radius (more focused/local driver)
    const minRadius = Math.min(...matchingAreas.map(area => area.radiusKm));
    const radiusScore = Math.max(0, 50 - (minRadius / 2)); // Higher score for smaller radius
    score += radiusScore;

    // If restaurant coordinates are available, calculate distance bonus
    if (request.latitude && request.longitude && matchingAreas.length > 0) {
      const area = matchingAreas[0]; // Use first matching area
      const distance = this.calculateDistance(
        area.latitude,
        area.longitude,
        request.latitude,
        request.longitude
      );

      // Distance bonus (closer = higher score)
      const distanceScore = Math.max(0, 20 - distance); // Max 20 points for very close
      score += distanceScore;
    }

    // Workload balancing factor (prefer drivers with fewer assignments)
    const maxAssignments = 10; // Assume reasonable max
    const workloadScore = ((maxAssignments - driver.currentAssignments) / maxAssignments) * 10;
    score += workloadScore;

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  private selectByProximity(
    availableDrivers: DriverCandidate[],
    request: RestaurantRequest
  ): { driver: DriverCandidate; score: number } | null {
    if (!request.latitude || !request.longitude) {
      // No coordinates available, fall back to simple selection
      const driver = availableDrivers.reduce((prev, current) =>
        prev.currentAssignments < current.currentAssignments ? prev : current
      );
      return { driver, score: 25 }; // Low score for fallback
    }

    // Calculate proximity scores for all drivers
    const scoredDrivers = availableDrivers.map(driver => {
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

      // Score based on proximity (closer = higher score)
      const proximityScore = Math.max(0, 100 - bestDistance * 2);
      
      // Add workload balancing
      const workloadScore = ((10 - driver.currentAssignments) / 10) * 20;
      
      const totalScore = proximityScore + workloadScore;
      
      return { driver, score: Math.round(totalScore * 100) / 100 };
    });

    // Return driver with highest proximity score
    return scoredDrivers.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );
  }
} 