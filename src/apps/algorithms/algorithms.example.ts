import { PrismaClient } from '@prisma/client';
import { AlgorithmsService } from './algorithms.service';
import { BulkAssignmentRequest } from './algorithms.types';

/**
 * Assignment Algorithms Usage Examples
 * 
 * This file demonstrates how to use the different assignment algorithms
 * with sample data and various configurations.
 */

const prisma = new PrismaClient();
const algorithmsService = new AlgorithmsService(prisma);

// Sample restaurant requests
const sampleRequest: BulkAssignmentRequest = {
  assignmentDate: '2024-01-15',
  restaurants: [
    {
      restaurantId: 'restaurant-downtown-seattle',
      name: 'Downtown Delights',
      city: 'Seattle',
      state: 'WA',
      latitude: 47.6062,
      longitude: -122.3321,
      estimatedDeliveries: 25,
      pickupTime: '11:00',
      paymentRate: 150,
      paymentType: 'FIXED'
    },
    {
      restaurantId: 'restaurant-bellevue-bistro',
      name: 'Bellevue Bistro',
      city: 'Bellevue',
      state: 'WA',
      latitude: 47.6101,
      longitude: -122.2015,
      estimatedDeliveries: 30,
      pickupTime: '11:30',
      paymentRate: 175,
      paymentType: 'FIXED'
    },
    {
      restaurantId: 'restaurant-fremont-foods',
      name: 'Fremont Foods',
      city: 'Seattle',
      state: 'WA',
      latitude: 47.6513,
      longitude: -122.3498,
      estimatedDeliveries: 20,
      pickupTime: '12:00',
      paymentRate: 140,
      paymentType: 'FIXED'
    }
  ]
};

/**
 * Example 1: Execute assignment with default weighted scoring algorithm
 */
export async function example1_DefaultWeightedScoring() {
  console.log('Example 1: Default Weighted Scoring Algorithm');
  
  try {
    const result = await algorithmsService.executeAssignment(sampleRequest);
    
    console.log(`Algorithm: ${result.algorithm}`);
    console.log(`Success Rate: ${result.successfulAssignments}/${result.totalRequests}`);
    console.log(`Average Score: ${result.averageScore?.toFixed(2)}`);
    console.log(`Execution Time: ${result.executionTimeMs}ms`);
    
    result.results.forEach(assignment => {
      if (assignment.success) {
        console.log(`${assignment.restaurantId} → Driver ${assignment.driverId} (Score: ${assignment.score?.toFixed(2)})`);
      } else {
        console.log(`${assignment.restaurantId}: ${assignment.error}`);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Example 1 failed:', error);
  }
}

/**
 * Example 2: Compare all algorithms
 */
export async function example2_CompareAllAlgorithms() {
  console.log('\nExample 2: Comparing All Algorithms');
  
  try {
    const comparison = await algorithmsService.compareAlgorithms(sampleRequest);
    
    console.log('\nAlgorithm Comparison Results:');
    console.log('─'.repeat(80));
    
    comparison.forEach((result, algorithm) => {
      const successRate = ((result.successfulAssignments / result.totalRequests) * 100).toFixed(1);
      console.log(`${algorithm.padEnd(20)} | Success: ${successRate}% | Score: ${(result.averageScore || 0).toFixed(2)} | Time: ${result.executionTimeMs}ms`);
    });
    
    return comparison;
  } catch (error) {
    console.error('Example 2 failed:', error);
  }
}

/**
 * Example 3: Detailed scoring breakdown
 */
export async function example3_DetailedScoring() {
  console.log('\nExample 3: Detailed Scoring Breakdown');
  
  try {
    const scores = await algorithmsService.getDetailedScoring(sampleRequest);
    
    scores.forEach((driverScores, restaurantId) => {
      console.log(`\n${restaurantId}:`);
      console.log('Driver ID | Total Score | Location | Proximity | Performance | Workload');
      console.log('─'.repeat(70));
      
      driverScores.slice(0, 5).forEach(score => { // Show top 5 drivers
        const { breakdown } = score;
        console.log(
          `${score.driverId.toString().padEnd(9)} | ` +
          `${score.totalScore.toFixed(2).padEnd(11)} | ` +
          `${breakdown.locationScore.toFixed(1).padEnd(8)} | ` +
          `${breakdown.proximityScore.toFixed(1).padEnd(9)} | ` +
          `${breakdown.performanceScore.toFixed(1).padEnd(11)} | ` +
          `${breakdown.workloadScore.toFixed(1)}`
        );
      });
    });
    
    return scores;
  } catch (error) {
    console.error('Example 3 failed:', error);
  }
}

/**
 * Example 4: Custom weight configuration
 */
export async function example4_CustomWeights() {
  console.log('\nExample 4: Custom Weight Configuration');
  
  try {
    // Update weights to prioritize location heavily
    const newWeights = {
      locationWeight: 0.6,    // Increased from 0.4
      proximityWeight: 0.2,   // Decreased from 0.3
      performanceWeight: 0.1, // Decreased from 0.15
      workloadWeight: 0.1     // Decreased from 0.15
    };
    
    console.log('Current weights:', algorithmsService.getWeights());
    
    algorithmsService.updateWeights(newWeights);
    console.log('Updated weights:', algorithmsService.getWeights());
    
    const result = await algorithmsService.executeAssignment(sampleRequest, 'weighted-scoring');
    
    console.log(`\nResults with custom weights:`);
    console.log(`Success Rate: ${result.successfulAssignments}/${result.totalRequests}`);
    console.log(`Average Score: ${result.averageScore?.toFixed(2)}`);
    
    return result;
  } catch (error) {
    console.error('Example 4 failed:', error);
  }
}

/**
 * Example 5: Workload distribution analysis
 */
export async function example5_WorkloadAnalysis() {
  console.log('\nExample 5: Workload Distribution Analysis');
  
  try {
    const distribution = await algorithmsService.getWorkloadDistribution('2024-01-15');
    
    console.log('\nDriver Workload Distribution:');
    console.log('Driver ID | Name         | Current | Recent | Completion% | Avg Deliveries | Workload Score');
    console.log('─'.repeat(90));
    
    distribution.slice(0, 10).forEach(driver => { // Show top 10
      console.log(
        `${driver.driverId.toString().padEnd(9)} | ` +
        `${(driver.name || 'N/A').slice(0, 12).padEnd(12)} | ` +
        `${driver.currentAssignments.toString().padEnd(7)} | ` +
        `${driver.recentWorkload.toString().padEnd(6)} | ` +
        `${driver.completionRate.toFixed(1).padEnd(11)} | ` +
        `${driver.averageDeliveries.toFixed(1).padEnd(14)} | ` +
        `${driver.workloadScore.toFixed(2)}`
      );
    });
    
    return distribution;
  } catch (error) {
    console.error('Example 5 failed:', error);
  }
}

/**
 * Example 6: Algorithm benchmarking
 */
export async function example6_Benchmarking() {
  console.log('\nExample 6: Algorithm Benchmarking');
  
  try {
    // Create multiple sample requests for benchmarking
    const sampleRequests = [
      sampleRequest,
      {
        ...sampleRequest,
        assignmentDate: '2024-01-16',
        restaurants: sampleRequest.restaurants.map(r => ({
          ...r,
          estimatedDeliveries: r.estimatedDeliveries + 5
        }))
      },
      {
        ...sampleRequest,
        assignmentDate: '2024-01-17',
        restaurants: sampleRequest.restaurants.map(r => ({
          ...r,
          estimatedDeliveries: r.estimatedDeliveries - 3
        }))
      }
    ];
    
    const benchmarks = await algorithmsService.benchmarkAlgorithms(sampleRequests);
    
    console.log('\nBenchmark Results:');
    console.log('Algorithm         | Avg Time (ms) | Success Rate % | Avg Score | Total Runs');
    console.log('─'.repeat(75));
    
    benchmarks.forEach((metrics, algorithm) => {
      console.log(
        `${algorithm.padEnd(17)} | ` +
        `${metrics.averageExecutionTime.toString().padEnd(13)} | ` +
        `${(metrics.averageSuccessRate * 100).toFixed(1).padEnd(14)} | ` +
        `${metrics.averageScore.toFixed(2).padEnd(9)} | ` +
        `${metrics.totalRuns}`
      );
    });
    
    return benchmarks;
  } catch (error) {
    console.error('Example 6 failed:', error);
  }
}

/**
 * Example 7: Get algorithm metrics
 */
export async function example7_AlgorithmMetrics() {
  console.log('\nExample 7: Algorithm Performance Metrics');
  
  try {
    const metrics = algorithmsService.getAlgorithmMetrics();
    
    if (metrics instanceof Map) {
      console.log('\nAlgorithm Performance Metrics:');
      console.log('Algorithm         | Runs | Avg Time (ms) | Success Rate % | Avg Score');
      console.log('─'.repeat(70));
      
      metrics.forEach((metric, algorithm) => {
        console.log(
          `${algorithm.padEnd(17)} | ` +
          `${metric.totalRuns.toString().padEnd(4)} | ` +
          `${metric.averageExecutionTime.toFixed(1).padEnd(13)} | ` +
          `${(metric.successRate * 100).toFixed(1).padEnd(14)} | ` +
          `${metric.averageScore.toFixed(2)}`
        );
      });
    }
    
    return metrics;
  } catch (error) {
    console.error('Example 7 failed:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('Assignment Algorithms Examples\n');
  
  await example1_DefaultWeightedScoring();
  await example2_CompareAllAlgorithms();
  await example3_DetailedScoring();
  await example4_CustomWeights();
  await example5_WorkloadAnalysis();
  await example6_Benchmarking();
  await example7_AlgorithmMetrics();
  
  console.log('\nAll examples completed!');
}

// Export individual examples for selective testing
export const examples = {
  defaultWeightedScoring: example1_DefaultWeightedScoring,
  compareAllAlgorithms: example2_CompareAllAlgorithms,
  detailedScoring: example3_DetailedScoring,
  customWeights: example4_CustomWeights,
  workloadAnalysis: example5_WorkloadAnalysis,
  benchmarking: example6_Benchmarking,
  algorithmMetrics: example7_AlgorithmMetrics,
  runAll: runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Examples failed:', error);
      process.exit(1);
    });
} 