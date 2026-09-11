import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { NotificationItem } from '../../types';
import { InventoryService } from '../inventory/inventoryService';
import { OrderService } from '../orders/orderService';
import { ProductionService } from '../production/productionService';
import { PaymentService } from '../payments/paymentService';

let localNotificationsMemory: NotificationItem[] = [];

export class NotificationService {
  /**
   * Generates dynamic operational notifications by evaluating live factory data
   */
  static async getLiveAlerts(): Promise<NotificationItem[]> {
    const alerts: NotificationItem[] = [];

    try {
      // 1. Check Low Stock Items
      const lowStockItems = await InventoryService.getLowStockAlerts();
      for (const item of lowStockItems) {
        const threshold = item.minimumStockThreshold || item.minStockAlert || 10;
        const name = item.name || item.itemName || item.sku;
        alerts.push({
          id: `alert-stock-${item.id}`,
          title: `Low Stock: ${name}`,
          message: `Current balance is ${item.currentStock} ${item.unit} (Below minimum safety threshold of ${threshold} ${item.unit}). Immediate replenishment required.`,
          type: 'WARNING',
          module: 'INVENTORY',
          linkUrl: '/inventory',
          isRead: false,
          severity: item.currentStock <= 0 ? 'CRITICAL' : 'HIGH',
          createdAt: new Date().toISOString(),
        });
      }

      // 2. Check Delayed Orders
      const delayedOrders = await OrderService.getDelayedOrders();
      for (const order of delayedOrders) {
        const cust = order.customer?.name || order.customerName || 'Customer';
        alerts.push({
          id: `alert-order-${order.id}`,
          title: `Delayed Order: #${order.orderNumber}`,
          message: `Order for ${cust} (${order.totalQuantity} pcs) passed delivery deadline of ${order.deliveryDate}. Current status: ${order.status}.`,
          type: 'ERROR',
          module: 'ORDERS',
          linkUrl: '/orders',
          isRead: false,
          severity: 'HIGH',
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Check Production Bottlenecks & Delays
      const delayedProd = await ProductionService.getDelayedProductionOrders();
      for (const prod of delayedProd) {
        const stageName = prod.currentStage?.name || (prod as any).currentStageName || 'Floor';
        const pNum = prod.productionNumber || prod.orderId || 'Batch';
        const remaining = (prod.totalPlannedQty || 0) - (prod.totalCompletedQty || 0);
        alerts.push({
          id: `alert-prod-${prod.id}`,
          title: `Production Behind Schedule: #${pNum}`,
          message: `Stage '${stageName}' has ${remaining} pcs remaining. Rejections logged: ${prod.totalRejectedQty || 0} pcs.`,
          type: 'ALERT',
          module: 'PRODUCTION',
          linkUrl: '/production',
          isRead: false,
          severity: 'HIGH',
          createdAt: new Date().toISOString(),
        });
      }

      // 4. Check Payment Outstanding Summary
      const ledger = await PaymentService.getFinancialSummary();
      if (ledger.netReceivable > 1000000) {
        alerts.push({
          id: 'alert-cashflow-rec',
          title: `High Customer Receivables Alert`,
          message: `Total uncollected market dues stand at ₹${Math.round(ledger.netReceivable).toLocaleString('en-IN')}. Prioritize payment collection followup.`,
          type: 'WARNING',
          module: 'PAYMENTS',
          linkUrl: '/payments',
          isRead: false,
          severity: 'MEDIUM',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Failed to compute live rule-based alerts:', err);
    }

    // Combine with stored database notifications
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          const dbNotifs: NotificationItem[] = data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            module: n.module,
            linkUrl: n.link_url,
            isRead: n.is_read,
            severity: n.severity,
            createdAt: n.created_at,
          }));
          return [...alerts, ...dbNotifs];
        }
      } catch (err) {
        console.warn('Error fetching db notifications:', err);
      }
    }

    return alerts;
  }

  static async markAsRead(id: string): Promise<void> {
    const item = localNotificationsMemory.find((n) => n.id === id);
    if (item) item.isRead = true;

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (err) {
        console.warn('Error marking notification read in DB:', err);
      }
    }
  }

  static async markAllAsRead(): Promise<void> {
    localNotificationsMemory.forEach((n) => (n.isRead = true));
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      } catch (err) {
        console.warn('Error marking all notifications read:', err);
      }
    }
  }
}
