import { OrderService } from '../orders/orderService';
import { ProductionService } from '../production/productionService';
import { InventoryService } from '../inventory/inventoryService';
import { PaymentService } from '../payments/paymentService';
import { DispatchService } from '../dispatch/dispatchService';
import { Order, ProductionOrder } from '../../types';

export interface DashboardMetrics {
  activeOrdersCount: number;
  todayPlannedQuantity: number;
  todayProducedQuantity: number;
  pendingProductionQuantity: number;
  delayedOrdersCount: number;
  lowStockItemsCount: number;
  totalReceivables: number;
  totalPayables: number;
  readyToDispatchCount: number;
  recentOrders: Order[];
  recentProduction: ProductionOrder[];
}

export class DashboardService {
  static async getLiveDashboardMetrics(): Promise<DashboardMetrics> {
    const [orders, prodStats, delayedOrders, delayedProd, lowStock, financial, dispatches, prodOrders] =
      await Promise.all([
        OrderService.getOrders(),
        ProductionService.getProductionStats(),
        OrderService.getDelayedOrders(),
        ProductionService.getDelayedProductionOrders(),
        InventoryService.getLowStockAlerts(),
        PaymentService.getFinancialSummary(),
        DispatchService.getDispatches(),
        ProductionService.getProductionOrders(),
      ]);

    const activeOrders = orders.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    const readyOrders = orders.filter((o: Order) => o.status === 'READY_FOR_DISPATCH' || o.status === 'CONFIRMED');

    return {
      activeOrdersCount: activeOrders.length,
      todayPlannedQuantity: prodStats.totalPlannedQuantity,
      todayProducedQuantity: prodStats.totalProducedQuantity,
      pendingProductionQuantity: prodStats.totalRemainingQuantity,
      delayedOrdersCount: delayedOrders.length + delayedProd.length,
      lowStockItemsCount: lowStock.length,
      totalReceivables: financial.netReceivable,
      totalPayables: financial.netPayable,
      readyToDispatchCount: readyOrders.length,
      recentOrders: orders.slice(0, 5),
      recentProduction: prodOrders.slice(0, 5),
    };
  }
}
