import { PrismaClient, DeliveryStatus } from '@prisma/client';

export interface DeliveryResponse {
  id: string;
  assignmentId: string;
  clientId: string;
  address: any;
  latitude: number;
  longitude: number;
  sequenceNumber: number;
  status: DeliveryStatus;
  proofImageUrl?: string;
  deliveredAt?: Date;
  deliveryNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryListResponse {
  deliveries: DeliveryResponse[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DeliveryFilters {
  status?: DeliveryStatus;
  assignmentId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export interface CompleteDeliveryRequest {
  deliveryId: string;
  proofImageUrl?: string;
  deliveryNotes?: string;
  deliveredAt?: Date;
}

export interface FailDeliveryRequest {
  deliveryId: string;
  reason: string;
  notes?: string;
}

export class DeliveriesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all deliveries for an assignment
   */
  async getDeliveriesForAssignment(assignmentId: string): Promise<DeliveryResponse[]> {
    const deliveries = await this.prisma.delivery.findMany({
      where: { assignmentId },
      orderBy: { sequenceNumber: 'asc' },
    });

    return deliveries.map(this.formatDeliveryResponse);
  }

  /**
   * Get delivery by ID
   */
  async getDeliveryById(deliveryId: string): Promise<DeliveryResponse | null> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    return delivery ? this.formatDeliveryResponse(delivery) : null;
  }

  /**
   * Search deliveries with filters
   */
  async searchDeliveries(filters: DeliveryFilters): Promise<DeliveryListResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.assignmentId) {
      where.assignmentId = filters.assignmentId;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        orderBy: [
          { sequenceNumber: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      deliveries: deliveries.map(this.formatDeliveryResponse),
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark delivery as picked up (bulk action when driver starts assignment)
   */
  async markDeliveriesAsPickedUp(assignmentId: string): Promise<{ success: boolean; updatedCount: number; error?: string }> {
    try {
      const result = await this.prisma.delivery.updateMany({
        where: {
          assignmentId,
          status: 'PENDING',
        },
        data: {
          status: 'PICKED_UP',
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        updatedCount: result.count,
      };
    } catch (error) {
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Start delivery (mark as in transit)
   */
  async startDelivery(deliveryId: string): Promise<{ success: boolean; delivery?: DeliveryResponse; error?: string }> {
    try {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        return {
          success: false,
          error: 'Delivery not found',
        };
      }

      if (!['PENDING', 'PICKED_UP'].includes(delivery.status)) {
        return {
          success: false,
          error: `Cannot start delivery with status: ${delivery.status}`,
        };
      }

      const updatedDelivery = await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'IN_TRANSIT',
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        delivery: this.formatDeliveryResponse(updatedDelivery),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Complete delivery
   */
  async completeDelivery(request: CompleteDeliveryRequest): Promise<{ success: boolean; delivery?: DeliveryResponse; error?: string }> {
    try {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: request.deliveryId },
      });

      if (!delivery) {
        return {
          success: false,
          error: 'Delivery not found',
        };
      }

      if (!['PICKED_UP', 'IN_TRANSIT'].includes(delivery.status)) {
        return {
          success: false,
          error: `Cannot complete delivery with status: ${delivery.status}`,
        };
      }

      const updatedDelivery = await this.prisma.delivery.update({
        where: { id: request.deliveryId },
        data: {
          status: 'DELIVERED',
          deliveredAt: request.deliveredAt || new Date(),
          proofImageUrl: request.proofImageUrl,
          deliveryNotes: request.deliveryNotes,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        delivery: this.formatDeliveryResponse(updatedDelivery),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fail delivery
   */
  async failDelivery(request: FailDeliveryRequest): Promise<{ success: boolean; delivery?: DeliveryResponse; error?: string }> {
    try {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: request.deliveryId },
      });

      if (!delivery) {
        return {
          success: false,
          error: 'Delivery not found',
        };
      }

      if (!['PICKED_UP', 'IN_TRANSIT'].includes(delivery.status)) {
        return {
          success: false,
          error: `Cannot fail delivery with status: ${delivery.status}`,
        };
      }

      const failureNotes = `FAILED: ${request.reason}${request.notes ? ` - ${request.notes}` : ''}`;

      const updatedDelivery = await this.prisma.delivery.update({
        where: { id: request.deliveryId },
        data: {
          status: 'FAILED',
          deliveryNotes: failureNotes,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        delivery: this.formatDeliveryResponse(updatedDelivery),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add delivery notes
   */
  async addDeliveryNotes(deliveryId: string, notes: string): Promise<{ success: boolean; delivery?: DeliveryResponse; error?: string }> {
    try {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        return {
          success: false,
          error: 'Delivery not found',
        };
      }

      const existingNotes = delivery.deliveryNotes || '';
      const updatedNotes = existingNotes 
        ? `${existingNotes}\n${new Date().toISOString()}: ${notes}`
        : notes;

      const updatedDelivery = await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          deliveryNotes: updatedNotes,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        delivery: this.formatDeliveryResponse(updatedDelivery),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Upload proof of delivery
   */
  async uploadProofOfDelivery(deliveryId: string, proofImageUrl: string): Promise<{ success: boolean; delivery?: DeliveryResponse; error?: string }> {
    try {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        return {
          success: false,
          error: 'Delivery not found',
        };
      }

      const updatedDelivery = await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          proofImageUrl,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        delivery: this.formatDeliveryResponse(updatedDelivery),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get delivery statistics for an assignment
   */
  async getDeliveryStats(assignmentId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { assignmentId },
    });

    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'PENDING').length,
      pickedUp: deliveries.filter(d => d.status === 'PICKED_UP').length,
      inTransit: deliveries.filter(d => d.status === 'IN_TRANSIT').length,
      delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
      failed: deliveries.filter(d => d.status === 'FAILED').length,
      cancelled: deliveries.filter(d => d.status === 'CANCELLED').length,
    };

    const completionRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
    const remainingDeliveries = stats.total - stats.delivered - stats.failed - stats.cancelled;

    return {
      ...stats,
      completionRate: Math.round(completionRate * 100) / 100,
      remainingDeliveries,
    };
  }

  /**
   * Format delivery response
   */
  private formatDeliveryResponse(delivery: any): DeliveryResponse {
    return {
      id: delivery.id,
      assignmentId: delivery.assignmentId,
      clientId: delivery.clientId,
      address: delivery.deliveryAddress,
      latitude: parseFloat(delivery.deliveryLatitude.toString()),
      longitude: parseFloat(delivery.deliveryLongitude.toString()),
      sequenceNumber: delivery.sequenceNumber,
      status: delivery.status,
      proofImageUrl: delivery.proofImageUrl,
      deliveredAt: delivery.deliveredAt,
      deliveryNotes: delivery.deliveryNotes,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }
} 