import { PaymentType } from '@prisma/client';

export interface DriverEarning {
  id: string;
  driverId: number;
  assignmentId: string;
  deliveryId?: string;
  earningDate: Date;
  amount: number;
  currency: string;
  calculationMethod: PaymentType;
  calculationDetails?: Record<string, any>;
  isProcessed: boolean;
  processedAt?: Date;
  stripeTransferId?: string;
  createdAt: Date;
}

export interface CreateEarningRequest {
  driverId: number;
  assignmentId: string;
  deliveryId?: string;
  earningDate: Date;
  amount: number;
  currency?: string;
  calculationMethod: PaymentType;
  calculationDetails?: Record<string, any>;
}

export interface UpdateEarningRequest {
  isProcessed?: boolean;
  processedAt?: Date;
  stripeTransferId?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  processedEarnings: number;
  pendingEarnings: number;
  totalDeliveries: number;
  averagePerDelivery: number;
  currency: string;
}

export interface DailyEarnings {
  date: string;
  earnings: number;
  deliveries: number;
  assignments: number;
}

export interface WeeklyEarnings {
  weekStart: string;
  weekEnd: string;
  totalEarnings: number;
  totalDeliveries: number;
  dailyBreakdown: DailyEarnings[];
}

export interface PendingEarnings {
  totalAmount: number;
  totalDeliveries: number;
  assignments: number;
  currency: string;
}

export interface EarningWithDetails extends DriverEarning {
  assignment: {
    id: string;
    restaurantId: string;
    assignmentDate: Date;
    status: string;
  };
  delivery?: {
    id: string;
    clientId: string;
    status: string;
    deliveredAt?: Date;
  };
} 