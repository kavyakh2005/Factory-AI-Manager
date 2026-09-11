import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { Customer, Product, Set, Order, OrderItem, OrderStatus, OrderPriority, OrderItemDraft } from '../../types';
import { ProductService } from '../products/productService';

import { CustomerService } from '../customers/customerService';

let localOrdersMemory: Order[] = [];

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
    items: OrderItemDraft[];
  }): Promise<Order> {
    const customers = await this.getCustomers();
    const products = await this.getProducts();
    const sets = await this.getSetsWithSizes();
    const customer = customers.find((c) => c.id === params.customerId);

    // Compute Item-wise rows
    const generatedOrderItems: OrderItem[] = [];
    let subtotal = 0;
    let totalQuantity = 0;

    for (const itemDraft of params.items) {
      const product = products.find((p) => p.id === itemDraft.productId);
      const setObj = sets.find((s) => s.id === itemDraft.setId);
      const variant = product?.variants?.find((v) => v.id === itemDraft.variantId);

      for (const [sizeId, qty] of Object.entries(itemDraft.sizeQuantities)) {
        if (qty > 0) {
          const sizeObj = setObj?.setSizes?.find((ss) => ss.sizeId === sizeId)?.size;
          const lineRate = itemDraft.unitRate;
          const lineTotal = qty * lineRate * (1 + itemDraft.taxRate / 100);

          subtotal += qty * lineRate;
          totalQuantity += qty;

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
          });
        }
      }
    }

    const taxRate = 5;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: params.orderNumber,
      customerId: params.customerId,
      customer,
      orderDate: params.orderDate,
      deliveryDate: params.deliveryDate,
      status: params.status || 'CONFIRMED',
      priority: params.priority || 'NORMAL',
      paymentStatus: 'UNPAID',
      totalQuantity,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount: 0,
      grandTotal,
      paidAmount: 0,
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
              grand_total: newOrder.grandTotal,
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

    // Cache locally
    localOrdersMemory.unshift(newOrder);
    await LocalStorageManager.cacheItems('orders', localOrdersMemory);

    return newOrder;
  }

  // 6. Update Order Status (e.g. Draft -> Confirmed, or Cancelled)
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const order = localOrdersMemory.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
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
    localOrdersMemory = localOrdersMemory.filter((o) => o.id !== orderId);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('order_items').delete().eq('order_id', orderId);
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) throw error;
        await supabase.from('audit_logs').insert({
          action: 'DELETE_ORDER',
          entity: 'Order',
          entity_id: orderId,
        });
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

