export interface CustomerData {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  orderDetails?: {
    items: string[];
    totalAmount: number;
    notes?: string;
  };
}

export interface CustomerFetchOptions {
  restaurantId: string;
  assignmentDate: string;
  estimatedDeliveries?: number;
}

export class CustomersService {
  /**
   * Placeholder method to fetch customers from external service
   * In a real implementation, this would make HTTP calls to your customer/order management system
   */
  async fetchCustomersForDelivery(options: CustomerFetchOptions): Promise<CustomerData[]> {
    // TODO: Replace this with actual API call to your customer service
    // Example: const response = await fetch(`${CUSTOMER_API_URL}/restaurants/${options.restaurantId}/orders?date=${options.assignmentDate}`);
    
    console.log(`[CustomerService] Fetching customers for restaurant ${options.restaurantId} on ${options.assignmentDate}`);
    
    // Mock data - replace with real API call
    const mockCustomers: CustomerData[] = [
      {
        id: 'customer-001',
        name: 'John Doe',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'USA',
        },
        latitude: 37.7749,
        longitude: -122.4194,
        phone: '+1-555-0123',
        email: 'john.doe@example.com',
        orderDetails: {
          items: ['Margherita Pizza', 'Caesar Salad'],
          totalAmount: 24.99,
          notes: 'Doorstep delivery preferred',
        },
      },
      {
        id: 'customer-002',
        name: 'Jane Smith',
        address: {
          street: '456 Oak Ave',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94103',
          country: 'USA',
        },
        latitude: 37.7849,
        longitude: -122.4094,
        phone: '+1-555-0124',
        email: 'jane.smith@example.com',
        orderDetails: {
          items: ['Chicken Burrito', 'Guacamole'],
          totalAmount: 18.50,
        },
      },
      {
        id: 'customer-003',
        name: 'Bob Wilson',
        address: {
          street: '789 Pine St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94104',
          country: 'USA',
        },
        latitude: 37.7949,
        longitude: -122.3994,
        phone: '+1-555-0125',
        email: 'bob.wilson@example.com',
        orderDetails: {
          items: ['Pad Thai', 'Spring Rolls'],
          totalAmount: 31.75,
          notes: 'Ring doorbell twice',
        },
      },
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Limit to estimated deliveries if provided
    if (options.estimatedDeliveries && options.estimatedDeliveries > 0) {
      return mockCustomers.slice(0, Math.min(options.estimatedDeliveries, mockCustomers.length));
    }

    return mockCustomers;
  }

  /**
   * Get customer details by ID
   * Placeholder for fetching individual customer details
   */
  async getCustomerById(customerId: string): Promise<CustomerData | null> {
    // TODO: Replace with actual API call
    console.log(`[CustomerService] Fetching customer details for ${customerId}`);
    
    // Mock implementation
    const mockCustomer: CustomerData = {
      id: customerId,
      name: 'Sample Customer',
      address: {
        street: '123 Sample St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
      },
      latitude: 37.7749,
      longitude: -122.4194,
      phone: '+1-555-0000',
      email: 'sample@example.com',
    };

    return mockCustomer;
  }

  /**
   * Validate customer address and coordinates
   * In real implementation, this might geocode addresses or validate against known addresses
   */
  async validateCustomerLocation(customer: CustomerData): Promise<boolean> {
    // Basic validation - ensure coordinates are within reasonable bounds
    const { latitude, longitude } = customer;
    
    // Very basic validation for San Francisco area (extend as needed)
    const isValidLat = latitude >= 37.7 && latitude <= 37.8;
    const isValidLng = longitude >= -122.5 && longitude <= -122.3;
    
    return isValidLat && isValidLng;
  }
} 