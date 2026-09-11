import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { Dispatch, CreateDispatchInput, Order } from '../../types';
import { OrderService } from '../orders/orderService';
import { InventoryService } from '../inventory/inventoryService';

let localDispatches: Dispatch[] = [];

export class DispatchService {
  static async getDispatches(filters?: { status?: string; search?: string }): Promise<Dispatch[]> {
    const orders = await OrderService.getOrders();

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('dispatches').select('*, orders(*), customers(*)').order('created_at', { ascending: false });
        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('delivery_status', filters.status);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: Dispatch[] = data.map((d: any) => ({
            id: d.id,
            dispatchNumber: d.dispatch_number,
            orderId: d.order_id,
            customerId: d.customer_id,
            dispatchDate: d.dispatch_date,
            packingStatus: d.packing_status || 'PACKED',
            carrierName: d.carrier_name,
            trackingNumber: d.tracking_number,
            vehicleNumber: d.vehicle_number,
            deliveryStatus: d.delivery_status || 'IN_TRANSIT',
            totalPackages: Number(d.total_packages || 1),
            totalItemsCount: Number(d.total_items_count || 0),
            notes: d.notes,
            order: d.orders || orders.find((o) => o.id === d.order_id),
            customer: d.customers,
            createdAt: d.created_at,
          }));
          localDispatches = mapped;
          LocalStorageManager.cacheItems('dispatches', mapped);
          return this.applyFilters(mapped, filters);
        }
      } catch (err) {
        console.warn('Dispatch query error, using local fallback:', err);
      }
    }

    localDispatches.forEach((d) => {
      d.order = orders.find((o) => o.id === d.orderId);
      d.customer = d.order?.customer;
    });

    return this.applyFilters(localDispatches, filters);
  }

  private static applyFilters(list: Dispatch[], filters?: { status?: string; search?: string }): Dispatch[] {
    let res = [...list];
    if (filters?.status && filters.status !== 'ALL') {
      res = res.filter((d) => d.deliveryStatus === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter(
        (d) =>
          d.dispatchNumber.toLowerCase().includes(q) ||
          d.carrierName?.toLowerCase().includes(q) ||
          d.trackingNumber?.toLowerCase().includes(q) ||
          d.order?.orderNumber.toLowerCase().includes(q) ||
          d.order?.customer?.name.toLowerCase().includes(q)
      );
    }
    return res;
  }

  static async createDispatch(input: CreateDispatchInput): Promise<Dispatch> {
    const orders = await OrderService.getOrders();
    const order = orders.find((o) => o.id === input.orderId);
    const newId = `dsp-${Date.now()}`;
    const dispatchNumber = input.dispatchNumber || `DSP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newDispatch: Dispatch = {
      id: newId,
      dispatchNumber,
      orderId: input.orderId,
      customerId: input.customerId,
      order,
      customer: order?.customer,
      dispatchDate: now,
      packingStatus: 'PACKED',
      carrierName: input.carrierName?.trim(),
      trackingNumber: input.trackingNumber?.trim().toUpperCase(),
      vehicleNumber: input.vehicleNumber?.trim().toUpperCase(),
      deliveryStatus: 'IN_TRANSIT',
      totalPackages: Math.max(1, input.totalPackages),
      totalItemsCount: Math.max(1, input.totalItemsCount),
      notes: input.notes?.trim(),
      createdAt: now,
    };

    if (isSupabaseConfigured && navigator.onLine) {
      const { data: dbDsp, error: dspErr } = await supabase
        .from('dispatches')
        .insert({
          dispatch_number: newDispatch.dispatchNumber,
          order_id: newDispatch.orderId,
          customer_id: newDispatch.customerId,
          dispatch_date: newDispatch.dispatchDate,
          packing_status: newDispatch.packingStatus,
          carrier_name: newDispatch.carrierName,
          tracking_number: newDispatch.trackingNumber,
          vehicle_number: newDispatch.vehicleNumber,
          delivery_status: newDispatch.deliveryStatus,
          total_packages: newDispatch.totalPackages,
          total_items_count: newDispatch.totalItemsCount,
          notes: newDispatch.notes,
        })
        .select()
        .single();

      if (dspErr) {
        console.error('[Supabase Error] createDispatch failed:', dspErr.message, dspErr);
        throw new Error(`Supabase Error (${dspErr.code || '400'}): ${dspErr.message}`);
      }

      if (dbDsp) {
        newDispatch.id = dbDsp.id;

        // Update order status to COMPLETED
        try {
          await OrderService.updateOrderStatus(input.orderId, 'COMPLETED');
        } catch (orderErr) {
          console.warn('Order status update warning:', orderErr);
        }

        // Record Finished Goods OUT movement in immutable Inventory Ledger
        try {
          const invItems = await InventoryService.getInventoryItems({ itemType: 'FINISHED_GOODS' });
          if (invItems.length > 0) {
            await InventoryService.recordStockTransaction({
              itemId: invItems[0].id,
              transactionType: 'OUT',
              quantityChange: -newDispatch.totalItemsCount,
              unit: 'pcs',
              referenceType: 'DISPATCH',
              referenceId: newDispatch.dispatchNumber,
              reason: 'Finished Goods Dispatch',
              remarks: `Dispatched ${newDispatch.totalPackages} cartons to ${order?.customer?.name || 'Customer'} via ${newDispatch.carrierName || 'Courier'} (LR: ${newDispatch.trackingNumber || 'N/A'})`,
            });
          }
        } catch (invErr) {
          console.warn('Inventory dispatch ledger warning:', invErr);
        }

        // Audit Log
        try {
          await supabase.from('audit_logs').insert({
            action: 'CREATE_DISPATCH',
            entity: 'Dispatch',
            entity_id: dbDsp.id,
            new_value: {
              dispatch_number: newDispatch.dispatchNumber,
              order_number: order?.orderNumber,
              carrier: newDispatch.carrierName,
              packages: newDispatch.totalPackages,
            },
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('dispatches', 'INSERT', newDispatch as unknown as Record<string, unknown>);
    }

    localDispatches.unshift(newDispatch);
    await LocalStorageManager.cacheItems('dispatches', localDispatches);
    return newDispatch;
  }
}
