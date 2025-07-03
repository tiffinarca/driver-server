import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AlgorithmsService, AlgorithmType, AlgorithmServiceConfig } from './algorithms.service';
import { BulkAssignmentRequest, WeightConfig } from './algorithms.types';

export class AlgorithmsController {
  private algorithmsService: AlgorithmsService;

  constructor(prisma: PrismaClient) {
    this.algorithmsService = new AlgorithmsService(prisma);
  }

  /**
   * Execute assignment using specified algorithm
   * POST /api/algorithms/assign
   */
  async executeAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { request, algorithm } = req.body;
      
      // Validate request
      if (!request || !request.assignmentDate || !request.restaurants) {
        res.status(400).json({
          error: 'Invalid request. Must include assignmentDate and restaurants'
        });
        return;
      }

      const result = await this.algorithmsService.executeAssignment(
        request as BulkAssignmentRequest,
        algorithm as AlgorithmType
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Assignment execution failed'
      });
    }
  }

  /**
   * Compare multiple algorithms
   * POST /api/algorithms/compare
   */
  async compareAlgorithms(req: Request, res: Response): Promise<void> {
    try {
      const { request, algorithms } = req.body;
      
      if (!request || !request.assignmentDate || !request.restaurants) {
        res.status(400).json({
          error: 'Invalid request. Must include assignmentDate and restaurants'
        });
        return;
      }

      const results = await this.algorithmsService.compareAlgorithms(
        request as BulkAssignmentRequest,
        algorithms as AlgorithmType[]
      );

      // Convert Map to object for JSON response
      const resultsObject: Record<string, any> = {};
      results.forEach((value, key) => {
        resultsObject[key] = value;
      });

      res.json({
        success: true,
        data: resultsObject
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Algorithm comparison failed'
      });
    }
  }

  /**
   * Get detailed scoring breakdown
   * POST /api/algorithms/detailed-scoring
   */
  async getDetailedScoring(req: Request, res: Response): Promise<void> {
    try {
      const { request, driverIds } = req.body;
      
      if (!request || !request.assignmentDate || !request.restaurants) {
        res.status(400).json({
          error: 'Invalid request. Must include assignmentDate and restaurants'
        });
        return;
      }

      const scores = await this.algorithmsService.getDetailedScoring(
        request as BulkAssignmentRequest,
        driverIds as number[]
      );

      // Convert Map to object for JSON response
      const scoresObject: Record<string, any> = {};
      scores.forEach((value, key) => {
        scoresObject[key] = value;
      });

      res.json({
        success: true,
        data: scoresObject
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Scoring analysis failed'
      });
    }
  }

  /**
   * Update algorithm weights
   * PUT /api/algorithms/weights
   */
  async updateWeights(req: Request, res: Response): Promise<void> {
    try {
      const weights = req.body as Partial<WeightConfig>;
      
      // Validate weights
      const validWeightKeys = ['locationWeight', 'proximityWeight', 'performanceWeight', 'workloadWeight'];
      const invalidKeys = Object.keys(weights).filter(key => !validWeightKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        res.status(400).json({
          error: `Invalid weight keys: ${invalidKeys.join(', ')}`
        });
        return;
      }

      this.algorithmsService.updateWeights(weights);
      const currentWeights = this.algorithmsService.getWeights();

      res.json({
        success: true,
        data: {
          message: 'Weights updated successfully',
          currentWeights
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Weight update failed'
      });
    }
  }

  /**
   * Get current algorithm weights
   * GET /api/algorithms/weights
   */
  async getWeights(req: Request, res: Response): Promise<void> {
    try {
      const weights = this.algorithmsService.getWeights();
      
      res.json({
        success: true,
        data: weights
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get weights'
      });
    }
  }

  /**
   * Get workload distribution analysis
   * GET /api/algorithms/workload-distribution
   */
  async getWorkloadDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { assignmentDate, driverIds } = req.query;
      
      if (!assignmentDate) {
        res.status(400).json({
          error: 'assignmentDate query parameter is required'
        });
        return;
      }

      const driverIdArray = driverIds 
        ? (Array.isArray(driverIds) ? driverIds : [driverIds]).map(Number)
        : undefined;

      const distribution = await this.algorithmsService.getWorkloadDistribution(
        assignmentDate as string,
        driverIdArray
      );

      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Workload analysis failed'
      });
    }
  }

  /**
   * Get algorithm performance metrics
   * GET /api/algorithms/metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { algorithm } = req.query;
      
      const metrics = this.algorithmsService.getAlgorithmMetrics(algorithm as AlgorithmType);
      
      let responseData: any;
      if (metrics instanceof Map) {
        // Convert Map to object
        responseData = {};
        metrics.forEach((value, key) => {
          responseData[key] = value;
        });
      } else {
        responseData = metrics;
      }

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metrics'
      });
    }
  }

  /**
   * Reset algorithm metrics
   * DELETE /api/algorithms/metrics
   */
  async resetMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { algorithm } = req.query;
      
      this.algorithmsService.resetMetrics(algorithm as AlgorithmType);
      
      res.json({
        success: true,
        data: {
          message: algorithm 
            ? `Metrics reset for ${algorithm} algorithm`
            : 'All algorithm metrics reset'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset metrics'
      });
    }
  }

  /**
   * Get available algorithms
   * GET /api/algorithms/available
   */
  async getAvailableAlgorithms(req: Request, res: Response): Promise<void> {
    try {
      const algorithms = this.algorithmsService.getAvailableAlgorithms();
      
      res.json({
        success: true,
        data: {
          algorithms,
          descriptions: {
            'simple': 'Basic load balancing algorithm',
            'geographic': 'Location-based assignment with proximity scoring',
            'workload-balancing': 'Historical workload analysis for fair distribution',
            'weighted-scoring': 'Perceptron-inspired multi-criteria scoring system'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get algorithms'
      });
    }
  }

  /**
   * Benchmark algorithm performance
   * POST /api/algorithms/benchmark
   */
  async benchmarkAlgorithms(req: Request, res: Response): Promise<void> {
    try {
      const { sampleRequests, algorithms } = req.body;
      
      if (!sampleRequests || !Array.isArray(sampleRequests)) {
        res.status(400).json({
          error: 'sampleRequests must be an array of BulkAssignmentRequest objects'
        });
        return;
      }

      const results = await this.algorithmsService.benchmarkAlgorithms(
        sampleRequests as BulkAssignmentRequest[],
        algorithms as AlgorithmType[]
      );

      // Convert Map to object for JSON response
      const resultsObject: Record<string, any> = {};
      results.forEach((value, key) => {
        resultsObject[key] = value;
      });

      res.json({
        success: true,
        data: resultsObject
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Benchmark failed'
      });
    }
  }

  /**
   * Health check for algorithms service
   * GET /api/algorithms/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const algorithms = this.algorithmsService.getAvailableAlgorithms();
      const metrics = this.algorithmsService.getAlgorithmMetrics();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          availableAlgorithms: algorithms.length,
          algorithms,
          totalMetricsTracked: metrics instanceof Map ? metrics.size : 0,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: error instanceof Error ? error.message : 'Service unhealthy'
      });
    }
  }
} 