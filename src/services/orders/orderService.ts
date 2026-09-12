import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { Customer, Product, Set, Order, OrderItem, OrderStatus, OrderPriority, OrderItemDraft, OrderFulfillmentStatus } from '../../types';
import { ProductService } from '../products/productService';
import { CustomerService } from '../customers/customerService';
import { FinishedGoodsService } from '../inventory/finishedGoodsService';

let localOrdersMemory: Order[] = LocalStorageManager.getSyncItems<Order>('orders', []);

export class OrderService {
  // 1. Fetch Customers
  static async getCustomers(): Promise<Customer[]> {
    return CustomerService.getCustomers();
  }

  // 2. Fetch Products with Variants & Sets
  static async getProducts(): Promise<Product[]> {
    return ProductService.getProducts();
  }

  // 3. Fetch Sets with nested Sizes
  static async getSetsWithSizes(): Promise<Set[]> {
    return ProductService.getSetsWithSizes();
  }

  // 4. Fetch Orders
  static async getOrders(filters?: { status?: string; search?: string }): Promise<Order[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('orders')
          .select('*, customers(*), order_items(*, products(*), sets(*), sizes(*))')
          .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) {
          console.error('[Supabase Error] getOrders failed:', error.message, error);
          if (!navigator.onLine) {
            let filtered = [...localOrdersMemory];
            if (filters?.status && filters.status !== 'ALL') filtered = filtered.filter((o) => o.status === filters.status);
            return filtered;
          }
          throw new Error(`Failed to load orders from Supabase: ${error.message}`);
        }

        if (data) {
          const mapped: Order[] = data.map((o) => ({
            id: o.id,
            orderNumber: o.order_number,
            customerId: o.customer_id,
            customer: o.customers ? {
              id: o.customers.id,
              name: o.customers.name,
              companyName: o.customers.company_name,
              phone: o.customers.phone,
              email: o.customers.email,
              status: o.customers.status,
            } : undefined,
            orderDate: o.order_date,
            deliveryDate: o.delivery_date,
            status: o.status as OrderStatus,
            priority: o.priority as OrderPriority,
            paymentStatus: o.payment_status,
            totalQuantity: o.total_quantity,
            subtotal: Number(o.subtotal),
            taxRate: Number(o.tax_rate),
            taxAmount: Number(o.tax_amount),
            discountAmount: Number(o.discount_amount || 0),
            grandTotal: Number(o.grand_total),
            paidAmount: Number(o.paid_amount || 0),
            notes: o.notes,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            orderItems: o.order_items?.map((item: any) => ({
              id: item.id,
              orderId: item.order_id,
              productId: item.product_id,
              product: item.products,
              variantId: item.variant_id,
              variant: undefined,
              setId: item.set_id,
              set: item.sets,
              sizeId: item.size_id,
              size: item.sizes,
              quantity: item.quantity,
              unitRate: Number(item.unit_rate),
              taxRate: Number(item.tax_rate || 5),
              lineTotal: Number(item.line_total),
            })),
          }));
          localOrdersMemory = mapped;
          LocalStorageManager.cacheItems('orders', mapped);
          return mapped;
        }
      } catch (err: any) {
        console.error('Supabase order fetch exception:', err);
        if (navigator.onLine && err?.message?.includes('Supabase')) {
          throw err;
        }
      }
    }

    if (localOrdersMemory.length === 0) {
      const cached = await LocalStorageManager.getCachedItems<Order>('orders');
      if (cached && cached.length > 0) {
        localOrdersMemory = cached;
      }
    }

    let filtered = [...localOrdersMemory];
    if (filters?.status && filters.status !== 'ALL') {
      filtered = filtered.filter((o) => o.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer?.name.toLowerCase().includes(q) ||
          o.customer?.companyName?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  // 5. Create Order with Full Multi-Item Size Matrix
  static async createOrder(params: {
    orderNumber: string;
    customerId: string;
    orderDate: string;
    deliveryDate: string;
    priority: OrderPriority;
    status: OrderStatus;
    notes?: string;
    discountAmount?: number;
    paidAmount?: number;
    paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
    items: OrderItemDraft[];
  }): Promise<Order> {
    const customers = await this.getCustomers();
    const products = await this.getProducts();
    const sets = await this.getSetsWithSizes();
    const customer = customers.find((c) => c.id === params.customerId);

    // Compute Item-wise rows & stock availability
    const generatedOrderItems: OrderItem[] = [];
    let subtotal = 0;
    let totalQuantity = 0;
    let totalShortage = 0;
    let totalReserved = 0;

    for (const itemDraft of params.items) {
      const product = products.find((p) => p.id === itemDraft.productId);
      const setObj = sets.find((s) => s.id === itemDraft.setId);
      const variant = product?.variants?.find((v) => v.id === itemDraft.variantId);

      // Check stock availability
      const availCheck = await FinishedGoodsService.checkStockAvailability(
        itemDraft.productId,
        itemDraft.setId,
        itemDraft.sizeQuantities
      );

      for (const [sizeId, qty] of Object.entries(itemDraft.sizeQuantities)) {
        if (qty > 0) {
          const sizeObj = setObj?.setSizes?.find((ss) => ss.sizeId === sizeId)?.size;
          const lineRate = itemDraft.unitRate;
          const lineTotal = qty * lineRate * (1 + itemDraft.taxRate / 100);

          subtotal += qty * lineRate;
          totalQuantity += qty;

          const sizeAvail = availCheck.sizes.find((s) => s.sizeId === sizeId);
          const dispatchable = sizeAvail ? sizeAvail.dispatchableStock : 0;
          const shortage = Math.max(0, qty - dispatchable);
          const reserved = Math.min(qty, dispatchable);

          totalShortage += shortage;
          totalReserved += reserved;

          generatedOrderItems.push({
            productId: itemDraft.productId,
            product,
            variantId: itemDraft.variantId,
            variant,
            setId: itemDraft.setId,
            set: setObj,
            sizeId,
            size: sizeObj,
            quantity: qty,
            unitRate: lineRate,
            taxRate: itemDraft.taxRate,
            lineTotal,
            availableStock: dispatchable,
            reservedStock: reserved,
            shortageQuantity: shortage,
          });
        }
      }
    }

    let fulfillmentStatus: OrderFulfillmentStatus = 'FULLY_AVAILABLE';
    if (totalShortage > 0) {
      fulfillmentStatus = totalReserved > 0 ? 'PARTIALLY_AVAILABLE' : 'SHORTAGE';
    }

    let calculatedSubtotal = subtotal;
    const discountAmount = Number(params.discountAmount || 0);
    const taxableSubtotal = Math.max(0, calculatedSubtotal - discountAmount);
    const taxRate = 5;
    const taxAmount = (taxableSubtotal * taxRate) / 100;
    const grandTotal = taxableSubtotal + taxAmount;
    const paidAmount = Number(params.paidAmount || 0);

    let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = params.paymentStatus || 'UNPAID';
    if (paidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: params.orderNumber,
      customerId: params.customerId,
      customer,
      orderDate: params.orderDate,
      deliveryDate: params.deliveryDate,
      status: params.status || 'CONFIRMED',
      fulfillmentStatus,
      priority: params.priority || 'NORMAL',
      paymentStatus,
      totalQuantity,
      subtotal: calculatedSubtotal,
      taxRate,
      taxAmount,
      discountAmount,
      grandTotal,
      paidAmount,
      shortageQuantity: totalShortage,
      reservedQuantity: totalReserved,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderItems: generatedOrderItems,
    };

    // 1. Supabase Persistence if Online
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        let targetOrderNumber = newOrder.orderNumber;
        let insertedOrder: any = null;
        let attempts = 0;

        while (!insertedOrder && attempts < 3) {
          attempts++;
          const { data: orderRecord, error: orderErr } = await supabase
            .from('orders')
            .insert({
              id: newOrder.id,
              order_number: targetOrderNumber,
              customer_id: newOrder.customerId,
              order_date: newOrder.orderDate,
              delivery_date: newOrder.deliveryDate,
              status: newOrder.status,
              priority: newOrder.priority,
              payment_status: newOrder.paymentStatus,
              total_quantity: newOrder.totalQuantity,
              subtotal: newOrder.subtotal,
              tax_rate: newOrder.taxRate,
              tax_amount: newOrder.taxAmount,
              discount_amount: newOrder.discountAmount,
              grand_total: newOrder.grandTotal,
              paid_amount: newOrder.paidAmount,
              notes: newOrder.notes,
            })
            .select()
            .single();

          if (orderErr) {
            // If duplicate order number constraint error, regenerate and retry
            if (orderErr.code === '23505' || orderErr.message?.includes('orders_order_number_key') || orderErr.message?.includes('duplicate key')) {
              targetOrderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;
              newOrder.orderNumber = targetOrderNumber;
              continue;
            }
            throw orderErr;
          }
          insertedOrder = orderRecord;
        }

        if (!insertedOrder) {
          throw new Error('Failed to insert order after multiple attempts.');
        }

        const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        // Insert Order Items Size Matrix
        const itemInserts = generatedOrderItems.map((item) => ({
          order_id: newOrder.id,
          product_id: item.productId,
          variant_id: isUuid(item.variantId) ? item.variantId : null,
          set_id: item.setId,
          size_id: item.sizeId,
          quantity: item.quantity,
          unit_rate: item.unitRate,
          tax_rate: item.taxRate || 5,
          line_total: item.lineTotal,
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(itemInserts);
        if (itemsErr) throw itemsErr;

        // Write Audit Log
        try {
          await supabase.from('audit_logs').insert({
            action: 'CREATE_ORDER',
            entity: 'Order',
            entity_id: newOrder.id,
            new_value: {
              order_number: newOrder.orderNumber,
              customer: customer?.name,
              total_quantity: newOrder.totalQuantity,
              grand_total: newOrder.grandTotal,
            },
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      } catch (err: any) {
        console.error('[Supabase Error] createOrder failed:', err?.message, err);
        throw new Error(`Failed to save order to Supabase: ${err?.message || 'Unknown database error'}`);
      }
    } else {
      // Offline mode: Enqueue in IndexedDB Outbox
      await LocalStorageManager.enqueueOfflineMutation('orders', 'INSERT', newOrder as unknown as Record<string, unknown>);
    }

    // 2. Perform Live Stock Reservation & Shortage Replenishment Setup
    if (newOrder.status === 'CONFIRMED' || (newOrder.status as string) === 'ACTIVE') {
      await FinishedGoodsService.reserveStockForOrder(newOrder.id, newOrder.orderItems || []);

      // If shortages exist, record Replenishment Requirements
      for (const item of generatedOrderItems) {
        if (item.shortageQuantity && item.shortageQuantity > 0) {
          await FinishedGoodsService.createProductionRequirement({
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            customerName: customer?.name,
            productId: item.productId,
            setId: item.setId,
            sizeId: item.sizeId,
            requiredQuantity: item.shortageQuantity,
            priority: newOrder.priority || 'HIGH',
            notes: `Shortage replenishment for Order ${newOrder.orderNumber}`,
          });
        }
      }
    }

    // Cache locally
    localOrdersMemory.unshift(newOrder);
    await LocalStorageManager.cacheItems('orders', localOrdersMemory);

    return newOrder;
  }

  // 6. Update Order Status (e.g. Draft -> Confirmed -> In Production -> Ready for Dispatch -> Completed / Cancelled)
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const order = localOrdersMemory.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
    }

    // If cancelled, release stock reservation
    if (status === 'CANCELLED') {
      await FinishedGoodsService.releaseOrderReservation(orderId);
    } else if (status === 'CONFIRMED' && order?.orderItems) {
      await FinishedGoodsService.reserveStockForOrder(orderId, order.orderItems);
    }

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
        await supabase.from('audit_logs').insert({
          action: 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entity_id: orderId,
          new_value: { new_status: status },
        });
      } catch (err) {
        console.warn('Supabase status update error:', err);
        await LocalStorageManager.enqueueOfflineMutation('orders', 'UPDATE', { id: orderId, status });
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('orders', 'UPDATE', { id: orderId, status });
    }

    await LocalStorageManager.cacheItems('orders', localOrdersMemory);
  }

  // 7. Update Order Payment Details
  static async updateOrderPayment(orderId: string, paidAmount: number, notes?: string): Promise<Order | null> {
    const order = localOrdersMemory.find((o) => o.id === orderId);
    const newPaid = Math.max(0, Number(paidAmount));
    let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
    
    if (order) {
      if (newPaid >= order.grandTotal && order.grandTotal > 0) {
        paymentStatus = 'PAID';
      } else if (newPaid > 0) {
        paymentStatus = 'PARTIAL';
      }
      order.paidAmount = newPaid;
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
    }

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('orders').update({
          paid_amount: newPaid,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        }).eq('id', orderId);

        await supabase.from('audit_logs').insert({
          action: 'UPDATE_ORDER_PAYMENT',
          entity: 'Order',
          entity_id: orderId,
          new_value: { paid_amount: newPaid, payment_status: paymentStatus, notes },
        });
      } catch (err) {
        console.warn('Supabase payment update error:', err);
        await LocalStorageManager.enqueueOfflineMutation('orders', 'UPDATE', { id: orderId, paid_amount: newPaid, payment_status: paymentStatus });
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('orders', 'UPDATE', { id: orderId, paid_amount: newPaid, payment_status: paymentStatus });
    }

    await LocalStorageManager.cacheItems('orders', localOrdersMemory);
    return order || null;
  }

  // 7. Quick Create Customer during Order Placement
  static async createCustomerQuick(data: { name: string; companyName?: string; phone: string; email?: string; city?: string }): Promise<Customer> {
    return CustomerService.createCustomer({
      name: data.name,
      companyName: data.companyName,
      phone: data.phone,
      email: data.email,
      city: data.city,
    });
  }

  static async getDelayedOrders(): Promise<Order[]> {
    const orders = await this.getOrders();
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter(
      (o) =>
        o.deliveryDate < today &&
        o.status !== 'COMPLETED' &&
        o.status !== 'CANCELLED' &&
        (o.status as string) !== 'DELIVERED'
    );
  }

  static async deleteOrder(orderId: string): Promise<void> {
    // 1. Release any active stock reservations
    try {
      await FinishedGoodsService.releaseOrderReservation(orderId);
    } catch (e) {
      console.warn('Could not release stock reservation:', e);
    }

    localOrdersMemory = localOrdersMemory.filter((o) => o.id !== orderId);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        // 2. Cascade delete associated dispatches
        await supabase.from('dispatches').delete().eq('order_id', orderId);

        // 3. Unlink any production orders that reference this order (preserving batches)
        await supabase.from('production_orders').update({ order_id: null }).eq('order_id', orderId);

        // 4. Delete order items
        await supabase.from('order_items').delete().eq('order_id', orderId);

        // 5. Delete the order itself
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) throw error;

        // 6. Log audit entry
        try {
          await supabase.from('audit_logs').insert({
            action: 'DELETE_ORDER',
            entity: 'Order',
            entity_id: orderId,
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      } catch (err: any) {
        console.error('Supabase deleteOrder error:', err);
        throw new Error(`Failed to delete order: ${err?.message || 'Unknown error'}`);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('orders', 'DELETE', { id: orderId });
    }

    await LocalStorageManager.cacheItems('orders', localOrdersMemory);
  }
}

