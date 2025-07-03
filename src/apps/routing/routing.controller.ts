import { Request, Response } from 'express';
import { RoutingService, RouteCalculationRequest } from './routing.service';

export class RoutingController {
  constructor(private routingService: RoutingService) {}

  /**
   * GET /api/assignments/:id/route - Get optimized route for assignment
   */
  getRoute = async (req: Request, res: Response) => {
    try {
      const { id: assignmentId } = req.params;

      const result = await this.routingService.getRoute(assignmentId);

      if (!result.success) {
        return res.status(404).json({
          error: result.error,
          message: 'Route not found',
        });
      }

      res.json({
        success: true,
        data: result.route,
      });
    } catch (error) {
      console.error('Error getting route:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get route',
      });
    }
  };

  /**
   * PUT /api/assignments/:id/route/recalculate - Recalculate route for assignment
   */
  recalculateRoute = async (req: Request, res: Response) => {
    try {
      const { id: assignmentId } = req.params;

      const result = await this.routingService.recalculateRoute(assignmentId);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to recalculate route',
        });
      }

      res.json({
        success: true,
        data: {
          routeId: result.routeId,
          deliveryIds: result.deliveryIds,
          estimatedDurationMinutes: result.estimatedDurationMinutes,
          totalDistanceKm: result.totalDistanceKm,
          optimizedSequence: result.optimizedSequence,
        },
        message: 'Route recalculated successfully',
      });
    } catch (error) {
      console.error('Error recalculating route:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to recalculate route',
      });
    }
  };

  /**
   * GET /api/assignments/:id/navigation - Get turn-by-turn navigation data
   */
  getNavigation = async (req: Request, res: Response) => {
    try {
      const { id: assignmentId } = req.params;

      const result = await this.routingService.getNavigationData(assignmentId);

      if (!result.success) {
        return res.status(404).json({
          error: result.error,
          message: 'Navigation data not found',
        });
      }

      res.json({
        success: true,
        data: result.navigation,
      });
    } catch (error) {
      console.error('Error getting navigation:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get navigation data',
      });
    }
  };

  /**
   * POST /api/assignments/:id/route/calculate - Calculate initial route for assignment
   */
  calculateRoute = async (req: Request, res: Response) => {
    try {
      const { id: assignmentId } = req.params;
      const { restaurantLocation, objectives } = req.body;

      if (!restaurantLocation) {
        return res.status(400).json({
          error: 'Missing restaurant location',
          message: 'Restaurant location data is required',
        });
      }

      const request: RouteCalculationRequest = {
        assignmentId,
        restaurantLocation,
        objectives,
      };

      const result = await this.routingService.calculateRoute(request);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: 'Failed to calculate route',
        });
      }

      res.json({
        success: true,
        data: {
          routeId: result.routeId,
          deliveryIds: result.deliveryIds,
          estimatedDurationMinutes: result.estimatedDurationMinutes,
          totalDistanceKm: result.totalDistanceKm,
          optimizedSequence: result.optimizedSequence,
        },
        message: 'Route calculated successfully',
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to calculate route',
      });
    }
  };
} 