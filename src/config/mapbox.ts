export interface MapboxConfig {
  apiKey: string;
  baseUrl: string;
  optimizationUrl: string;
  maxPollingAttempts: number;
  pollingIntervalMs: number;
}

export const mapboxConfig: MapboxConfig = {
  apiKey: process.env.MAPBOX_ACCESS_TOKEN || '',
  baseUrl: 'https://api.mapbox.com',
  optimizationUrl: 'https://api.mapbox.com/optimized-trips/v2',
  maxPollingAttempts: 30, // Maximum times to poll for results
  pollingIntervalMs: 2000, // Poll every 2 seconds
};

// Validate required environment variables
export function validateMapboxConfig(): void {
  if (!mapboxConfig.apiKey) {
    throw new Error('MAPBOX_ACCESS_TOKEN environment variable is required');
  }
} 