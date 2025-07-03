import { PrismaClient } from '@prisma/client';
import { SimpleAssignmentAlgorithm } from './simple-assignment.algorithm';
import { GeographicAssignmentAlgorithm } from './geographic-assignment.algorithm';
import { WorkloadBalancingAlgorithm } from './workload-balancing.algorithm';
import { WeightedScoringAlgorithm } from './weighted-scoring.algorithm';
import {
  AlgorithmConfig,
  WeightConfig,
  BulkAssignmentRequest,
  AlgorithmResult,
  AlgorithmMetrics,
  DriverScore
} from './algorithms.types';

export type AlgorithmType = 'simple' | 'geographic' | 'workload-balancing' | 'weighted-scoring';

export interface AlgorithmServiceConfig {
  defaultAlgorithm?: AlgorithmType;
  algorithmConfig?: AlgorithmConfig;
  weightConfig?: WeightConfig;
}

/**
 * Algorithms Service
 * 
 * Main service that provides access to all assignment algorithms
 * and manages algorithm selection, execution, and performance tracking.
 */
export class AlgorithmsService {
  private algorithms: Map<AlgorithmType, any>;
  private config: AlgorithmServiceConfig;
  private metrics: Map<string, AlgorithmMetrics>;

  constructor(
    private prisma: PrismaClient,
    config: AlgorithmServiceConfig = {}
  ) {
    this.config = {
      defaultAlgorithm: 'weighted-scoring',
      algorithmConfig: {
        maxAssignmentsPerDriver: 3,
        workloadBalancingEnabled: true,
        geographicPriorityEnabled: true,
        lookbackDays: 7
      },
      ...config
    };

    this.algorithms = new Map();
    this.metrics = new Map();
    this.initializeAlgorithms();
  }

  /**
   * Initialize all available algorithms
   */
  private initializeAlgorithms(): void {
    const algorithmConfig = this.config.algorithmConfig!;
    const weightConfig = this.config.weightConfig;

    this.algorithms.set('simple', new SimpleAssignmentAlgorithm(this.prisma, algorithmConfig));
    this.algorithms.set('geographic', new GeographicAssignmentAlgorithm(this.prisma, algorithmConfig));
    this.algorithms.set('workload-balancing', new WorkloadBalancingAlgorithm(this.prisma, algorithmConfig));
    this.algorithms.set('weighted-scoring', new WeightedScoringAlgorithm(this.prisma, algorithmConfig, weightConfig));
  }

  /**
   * Execute assignment using specified algorithm
   */
  async executeAssignment(
    request: BulkAssignmentRequest,
    algorithmType?: AlgorithmType
  ): Promise<AlgorithmResult> {
    const algorithm = algorithmType || this.config.defaultAlgorithm!;
    const algorithmInstance = this.algorithms.get(algorithm);

    if (!algorithmInstance) {
      throw new Error(`Algorithm '${algorithm}' not found`);
    }

    try {
      const result = await algorithmInstance.assignDrivers(request);
      this.updateMetrics(algorithm, result);
      return result;
    } catch (error) {
      throw new Error(`Algorithm execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare multiple algorithms on the same assignment request
   */
  async compareAlgorithms(
    request: BulkAssignmentRequest,
    algorithms?: AlgorithmType[]
  ): Promise<Map<AlgorithmType, AlgorithmResult>> {
    const algorithmsToTest = algorithms || ['simple', 'geographic', 'workload-balancing', 'weighted-scoring'];
    const results = new Map<AlgorithmType, AlgorithmResult>();

    // Run algorithms in parallel for comparison
    const promises = algorithmsToTest.map(async (algorithmType) => {
      try {
        // Create a copy of the request to avoid interference
        const requestCopy = JSON.parse(JSON.stringify(request));
        const result = await this.executeAssignment(requestCopy, algorithmType);
        return { algorithmType, result };
      } catch (error) {
        return {
          algorithmType,
          result: {
            algorithm: algorithmType,
            assignmentDate: request.assignmentDate,
            results: [],
            totalRequests: request.restaurants.length,
            successfulAssignments: 0,
            failedAssignments: request.restaurants.length,
            executionTimeMs: 0
          } as AlgorithmResult
        };
      }
    });

    const algorithmResults = await Promise.all(promises);
    
    algorithmResults.forEach(({ algorithmType, result }) => {
      results.set(algorithmType, result);
    });

    return results;
  }

  /**
   * Get detailed scoring breakdown for weighted scoring algorithm
   */
  async getDetailedScoring(
    request: BulkAssignmentRequest,
    driverIds?: number[]
  ): Promise<Map<string, DriverScore[]>> {
    const weightedAlgorithm = this.algorithms.get('weighted-scoring') as WeightedScoringAlgorithm;
    
    if (!weightedAlgorithm) {
      throw new Error('Weighted scoring algorithm not available');
    }

    const scoringResults = new Map<string, DriverScore[]>();

    for (const restaurant of request.restaurants) {
      const scores = await weightedAlgorithm.getDetailedScoring(
        restaurant,
        request.assignmentDate,
        driverIds
      );
      scoringResults.set(restaurant.restaurantId, scores);
    }

    return scoringResults;
  }

  /**
   * Update algorithm weights for weighted scoring
   */
  updateWeights(newWeights: Partial<WeightConfig>): void {
    const weightedAlgorithm = this.algorithms.get('weighted-scoring') as WeightedScoringAlgorithm;
    
    if (weightedAlgorithm) {
      weightedAlgorithm.updateWeights(newWeights);
    }
  }

  /**
   * Get current weights configuration
   */
  getWeights(): WeightConfig | null {
    const weightedAlgorithm = this.algorithms.get('weighted-scoring') as WeightedScoringAlgorithm;
    return weightedAlgorithm ? weightedAlgorithm.getWeights() : null;
  }

  /**
   * Get workload distribution analysis
   */
  async getWorkloadDistribution(
    assignmentDate: string,
    driverIds?: number[]
  ): Promise<any[]> {
    const workloadAlgorithm = this.algorithms.get('workload-balancing') as WorkloadBalancingAlgorithm;
    
    if (!workloadAlgorithm) {
      throw new Error('Workload balancing algorithm not available');
    }

    return await workloadAlgorithm.getWorkloadDistribution(assignmentDate, driverIds);
  }

  /**
   * Get algorithm performance metrics
   */
  getAlgorithmMetrics(algorithmType?: AlgorithmType): AlgorithmMetrics | Map<string, AlgorithmMetrics> {
    if (algorithmType) {
      return this.metrics.get(algorithmType) || {
        algorithm: algorithmType,
        totalRuns: 0,
        averageExecutionTime: 0,
        successRate: 0,
        averageScore: 0
      };
    }

    return this.metrics;
  }

  /**
   * Reset algorithm metrics
   */
  resetMetrics(algorithmType?: AlgorithmType): void {
    if (algorithmType) {
      this.metrics.delete(algorithmType);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get available algorithms
   */
  getAvailableAlgorithms(): AlgorithmType[] {
    return Array.from(this.algorithms.keys());
  }

  /**
   * Test algorithm performance with sample data
   */
  async benchmarkAlgorithms(
    sampleRequests: BulkAssignmentRequest[],
    algorithms?: AlgorithmType[]
  ): Promise<Map<AlgorithmType, {
    averageExecutionTime: number;
    averageSuccessRate: number;
    averageScore: number;
    totalRuns: number;
  }>> {
    const algorithmsToTest = algorithms || this.getAvailableAlgorithms();
    const benchmarkResults = new Map();

    for (const algorithmType of algorithmsToTest) {
      const results: AlgorithmResult[] = [];
      
      for (const request of sampleRequests) {
        try {
          const result = await this.executeAssignment(request, algorithmType);
          results.push(result);
        } catch (error) {
          // Skip failed runs
          continue;
        }
      }

      if (results.length > 0) {
        const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTimeMs, 0) / results.length;
        const avgSuccessRate = results.reduce((sum, r) => sum + (r.successfulAssignments / r.totalRequests), 0) / results.length;
        const scoresWithValues = results.filter(r => r.averageScore !== undefined);
        const avgScore = scoresWithValues.length > 0 
          ? scoresWithValues.reduce((sum, r) => sum + (r.averageScore || 0), 0) / scoresWithValues.length 
          : 0;

        benchmarkResults.set(algorithmType, {
          averageExecutionTime: Math.round(avgExecutionTime),
          averageSuccessRate: Math.round(avgSuccessRate * 100) / 100,
          averageScore: Math.round(avgScore * 100) / 100,
          totalRuns: results.length
        });
      }
    }

    return benchmarkResults;
  }

  /**
   * Update algorithm performance metrics
   */
  private updateMetrics(algorithmType: AlgorithmType, result: AlgorithmResult): void {
    const existing = this.metrics.get(algorithmType) || {
      algorithm: algorithmType,
      totalRuns: 0,
      averageExecutionTime: 0,
      successRate: 0,
      averageScore: 0
    };

    const successRate = result.totalRequests > 0 ? result.successfulAssignments / result.totalRequests : 0;
    
    existing.totalRuns += 1;
    existing.averageExecutionTime = (existing.averageExecutionTime * (existing.totalRuns - 1) + result.executionTimeMs) / existing.totalRuns;
    existing.successRate = (existing.successRate * (existing.totalRuns - 1) + successRate) / existing.totalRuns;
    
    if (result.averageScore !== undefined) {
      existing.averageScore = (existing.averageScore * (existing.totalRuns - 1) + result.averageScore) / existing.totalRuns;
    }

    this.metrics.set(algorithmType, existing);
  }
} 