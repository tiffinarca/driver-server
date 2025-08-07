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
