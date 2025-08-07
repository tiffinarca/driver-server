import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AlgorithmsController } from './algorithms.controller';

// Export a function that creates the router with an initialized prisma instance
export function createAlgorithmsRouter(prisma: PrismaClient) {
  const algorithmsController = new AlgorithmsController(prisma);
  const algorithmsRouter = Router();

  /**
   * Assignment Algorithms Routes
   * 
   * These routes provide access to all assignment algorithms including:
   * - Simple Assignment (load balancing)
   * - Geographic Assignment (location-based)
   * - Workload Balancing (historical analysis)
   * - Weighted Scoring (perceptron-inspired)
   */

  // Execute assignment using specified algorithm
  algorithmsRouter.post('/assign', async (req, res) => {
    await algorithmsController.executeAssignment(req, res);
  });

  // Compare multiple algorithms on the same request
  algorithmsRouter.post('/compare', async (req, res) => {
    await algorithmsController.compareAlgorithms(req, res);
  });

  // Get detailed scoring breakdown (weighted scoring algorithm)
  algorithmsRouter.post('/detailed-scoring', async (req, res) => {
    await algorithmsController.getDetailedScoring(req, res);
  });

  // Update algorithm weights for weighted scoring
  algorithmsRouter.put('/weights', async (req, res) => {
    await algorithmsController.updateWeights(req, res);
  });

  // Get current algorithm weights
  algorithmsRouter.get('/weights', async (req, res) => {
    await algorithmsController.getWeights(req, res);
  });

  // Get workload distribution analysis
  algorithmsRouter.get('/workload-distribution', async (req, res) => {
    await algorithmsController.getWorkloadDistribution(req, res);
  });

  // Get algorithm performance metrics
  algorithmsRouter.get('/metrics', async (req, res) => {
    await algorithmsController.getMetrics(req, res);
  });

  // Reset algorithm metrics
  algorithmsRouter.delete('/metrics', async (req, res) => {
    await algorithmsController.resetMetrics(req, res);
  });

  // Get available algorithms
  algorithmsRouter.get('/available', async (req, res) => {
    await algorithmsController.getAvailableAlgorithms(req, res);
  });

  // Benchmark algorithm performance
  algorithmsRouter.post('/benchmark', async (req, res) => {
    await algorithmsController.benchmarkAlgorithms(req, res);
  });

  // Health check
  algorithmsRouter.get('/health', async (req, res) => {
    await algorithmsController.healthCheck(req, res);
  });

  return algorithmsRouter;
} 