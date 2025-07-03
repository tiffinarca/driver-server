// Assignment Algorithms - Main Exports

// Main service and controller
export { AlgorithmsService, AlgorithmType, AlgorithmServiceConfig } from './algorithms.service';
export { AlgorithmsController } from './algorithms.controller';

// Individual algorithms
export { SimpleAssignmentAlgorithm } from './simple-assignment.algorithm';
export { GeographicAssignmentAlgorithm } from './geographic-assignment.algorithm';
export { WorkloadBalancingAlgorithm } from './workload-balancing.algorithm';
export { WeightedScoringAlgorithm } from './weighted-scoring.algorithm';

// Base algorithm class
export { BaseAssignmentAlgorithm } from './algorithms.base';

// Types and interfaces
export * from './algorithms.types';

// Routes
export { default as algorithmsRoutes } from './algorithms.routes';

/**
 * Assignment Algorithms Module
 * 
 * This module provides a comprehensive suite of assignment algorithms for
 * matching drivers to restaurant delivery assignments. It includes:
 * 
 * 1. **Simple Assignment Algorithm**: Basic load balancing
 * 2. **Geographic Assignment Algorithm**: Location-based matching
 * 3. **Workload Balancing Algorithm**: Historical workload analysis
 * 4. **Weighted Scoring Algorithm**: Perceptron-inspired multi-criteria scoring
 * 
 * Features:
 * - Efficient database queries with proper indexing
 * - Configurable algorithm parameters
 * - Performance metrics and benchmarking
 * - Real-time weight adjustment for weighted scoring
 * - Comprehensive API endpoints
 * - Support for bulk operations
 * 
 * Usage Example:
 * ```typescript
 * import { AlgorithmsService } from './src/apps/algorithms';
 * 
 * const algorithmsService = new AlgorithmsService(prisma);
 * 
 * const result = await algorithmsService.executeAssignment({
 *   assignmentDate: '2024-01-15',
 *   restaurants: [
 *     {
 *       restaurantId: 'restaurant-123',
 *       city: 'Seattle',
 *       state: 'WA',
 *       estimatedDeliveries: 25,
 *       pickupTime: '11:00',
 *       paymentRate: 150
 *     }
 *   ]
 * }, 'weighted-scoring');
 * ```
 */ 