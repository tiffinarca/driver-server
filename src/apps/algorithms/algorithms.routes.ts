import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AlgorithmsController } from './algorithms.controller';

const prisma = new PrismaClient();
const algorithmsController = new AlgorithmsController(prisma);
const router = Router();

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
router.post('/assign', async (req, res) => {
  await algorithmsController.executeAssignment(req, res);
});

// Compare multiple algorithms on the same request
router.post('/compare', async (req, res) => {
  await algorithmsController.compareAlgorithms(req, res);
});

// Get detailed scoring breakdown (weighted scoring algorithm)
router.post('/detailed-scoring', async (req, res) => {
  await algorithmsController.getDetailedScoring(req, res);
});

// Update algorithm weights for weighted scoring
router.put('/weights', async (req, res) => {
  await algorithmsController.updateWeights(req, res);
});

// Get current algorithm weights
router.get('/weights', async (req, res) => {
  await algorithmsController.getWeights(req, res);
});

// Get workload distribution analysis
router.get('/workload-distribution', async (req, res) => {
  await algorithmsController.getWorkloadDistribution(req, res);
});

// Get algorithm performance metrics
router.get('/metrics', async (req, res) => {
  await algorithmsController.getMetrics(req, res);
});

// Reset algorithm metrics
router.delete('/metrics', async (req, res) => {
  await algorithmsController.resetMetrics(req, res);
});

// Get available algorithms
router.get('/available', async (req, res) => {
  await algorithmsController.getAvailableAlgorithms(req, res);
});

// Benchmark algorithm performance
router.post('/benchmark', async (req, res) => {
  await algorithmsController.benchmarkAlgorithms(req, res);
});

// Health check
router.get('/health', async (req, res) => {
  await algorithmsController.healthCheck(req, res);
});

export default router; 