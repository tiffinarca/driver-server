import { BaseAssignmentAlgorithm } from './algorithms.base';
import { DriverCandidate, RestaurantRequest } from './algorithms.types';

/**
 * Simple Assignment Algorithm
 * 
 * This algorithm assigns drivers to restaurants based on availability and load balancing.
 * It selects the driver with the least current assignments to distribute workload evenly.
 */
export class SimpleAssignmentAlgorithm extends BaseAssignmentAlgorithm {
  getName(): string {
    return 'simple-assignment';
  }

  protected async selectDriver(
    availableDrivers: DriverCandidate[],
    request: RestaurantRequest,
    assignmentDate: string
  ): Promise<{ driver: DriverCandidate; score?: number } | null> {
    if (availableDrivers.length === 0) {
      return null;
    }

    // Filter drivers who haven't exceeded max assignments if configured
    let candidateDrivers = availableDrivers;
    if (this.config.maxAssignmentsPerDriver) {
      candidateDrivers = availableDrivers.filter(
        driver => driver.currentAssignments < (this.config.maxAssignmentsPerDriver || 3)
      );
    }

    if (candidateDrivers.length === 0) {
      // If all drivers are at max capacity, use all available drivers
      candidateDrivers = availableDrivers;
    }

    // Select driver with least current assignments (load balancing)
    const selectedDriver = candidateDrivers.reduce((prev, current) => 
      prev.currentAssignments < current.currentAssignments ? prev : current
    );

    // Calculate a simple score based on inverse of current assignments
    // Higher score = lower current workload
    const maxAssignments = Math.max(...candidateDrivers.map(d => d.currentAssignments), 1);
    const score = ((maxAssignments - selectedDriver.currentAssignments) / maxAssignments) * 100;

    return {
      driver: selectedDriver,
      score
    };
  }
} 