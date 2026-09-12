import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { Payment, CreatePaymentInput, Customer, Supplier, Order, PurchaseOrder } from '../../types';
import { CustomerService } from '../customers/customerService';
import { SupplierService } from '../suppliers/supplierService';
import { OrderService } from '../orders/orderService';
import { PurchaseService } from '../purchases/purchaseService';

let localPayments: Payment[] = LocalStorageManager.getSyncItems<Payment>('payments', []);

export class PaymentService {
  static async getPayments(filters?: { paymentType?: string; search?: string }): Promise<Payment[]> {
    const [customers, suppliers, orders, pos] = await Promise.all([
      CustomerService.getCustomers(),
      SupplierService.getSuppliers(),
      OrderService.getOrders(),
      PurchaseService.getPurchaseOrders(),
    ]);

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('payments').select('*, customers(*), suppliers(*), orders(*), purchase_orders(*)').order('payment_date', { ascending: false });
        if (filters?.paymentType && filters.paymentType !== 'ALL') {
          query = query.eq('payment_type', filters.paymentType);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: Payment[] = data.map((p: any) => ({
            id: p.id,
            paymentNumber: p.payment_number,
            paymentType: p.payment_type,
            customerId: p.customer_id,
            supplierId: p.supplier_id,
            orderId: p.order_id,
            purchaseOrderId: p.purchase_order_id,
            amount: Number(p.amount || 0),
            paymentDate: p.payment_date,
            paymentMode: p.payment_mode || 'BANK_TRANSFER',
            transactionReference: p.transaction_reference,
            status: p.status || 'COMPLETED',
            notes: p.notes,
            customer: p.customers || customers.find((c) => c.id === p.customer_id),
            supplier: p.suppliers || suppliers.find((s) => s.id === p.supplier_id),
            order: p.orders || orders.find((o) => o.id === p.order_id),
            purchaseOrder: p.purchase_orders || pos.find((po) => po.id === p.purchase_order_id),
            createdAt: p.created_at,
          }));
          localPayments = mapped;
          LocalStorageManager.cacheItems('payments', mapped);
          return this.applyFilters(mapped, filters);
        }
      } catch (err) {
        console.warn('Payment query failed, using local ledger:', err);
      }
    }

    if (localPayments.length === 0) {
      const cached = await LocalStorageManager.getCachedItems<Payment>('payments', []);
      if (cached && cached.length > 0) {
        localPayments = cached;
      }
    }

    localPayments.forEach((p) => {
      p.customer = customers.find((c) => c.id === p.customerId);
      p.supplier = suppliers.find((s) => s.id === p.supplierId);
      p.order = orders.find((o) => o.id === p.orderId);
      p.purchaseOrder = pos.find((po) => po.id === p.purchaseOrderId);
    });

    return this.applyFilters(localPayments, filters);
  }

  private static applyFilters(list: Payment[], filters?: { paymentType?: string; search?: string }): Payment[] {
    let res = [...list];
    if (filters?.paymentType && filters.paymentType !== 'ALL') {
      res = res.filter((p) => p.paymentType === filters.paymentType);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(q) ||
          p.transactionReference?.toLowerCase().includes(q) ||
          p.customer?.name.toLowerCase().includes(q) ||
          p.supplier?.name.toLowerCase().includes(q) ||
          p.order?.orderNumber.toLowerCase().includes(q)
      );
    }
    return res;
  }

  static async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const newId = `pay-${Date.now()}`;
    const prefix = input.paymentType === 'CUSTOMER_RECEIPT' ? 'REC' : 'OUT';
    const paymentNumber = input.paymentNumber || `PAY-${prefix}-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newPayment: Payment = {
      id: newId,
      paymentNumber,
      paymentType: input.paymentType,
      customerId: input.customerId,
      supplierId: input.supplierId,
      orderId: input.orderId,
      purchaseOrderId: input.purchaseOrderId,
      amount: Math.max(0, input.amount),
      paymentDate: input.paymentDate ? new Date(input.paymentDate).toISOString() : now,
      paymentMode: input.paymentMode,
      transactionReference: input.transactionReference?.trim(),
      status: 'COMPLETED',
      notes: input.notes?.trim(),
      createdAt: now,
    };

    if (isSupabaseConfigured && navigator.onLine) {
      const { data: dbPay, error: payErr } = await supabase
        .from('payments')
        .insert({
          payment_number: newPayment.paymentNumber,
          payment_type: newPayment.paymentType,
          customer_id: newPayment.customerId || null,
          supplier_id: newPayment.supplierId || null,
          order_id: newPayment.orderId || null,
          purchase_order_id: newPayment.purchaseOrderId || null,
          amount: newPayment.amount,
          payment_date: newPayment.paymentDate,
          payment_mode: newPayment.paymentMode,
          transaction_reference: newPayment.transactionReference,
          status: newPayment.status,
          notes: newPayment.notes,
        })
        .select()
        .single();

      if (payErr) {
        console.error('[Supabase Error] createPayment failed:', payErr.message, payErr);
        throw new Error(`Supabase Error (${payErr.code || '400'}): ${payErr.message}`);
      }

      if (dbPay) {
        newPayment.id = dbPay.id;

        // If linked to an order, update paid_amount
        if (input.orderId) {
          try {
            const { data: orderData } = await supabase.from('orders').select('paid_amount, grand_total').eq('id', input.orderId).single();
            if (orderData) {
              const updatedPaid = (orderData.paid_amount || 0) + newPayment.amount;
              const payStatus = updatedPaid >= orderData.grand_total ? 'PAID' : updatedPaid > 0 ? 'PARTIAL' : 'UNPAID';
              await supabase.from('orders').update({ paid_amount: updatedPaid, payment_status: payStatus }).eq('id', input.orderId);
            }
          } catch (orderErr) {
            console.warn('Order payment status update warning:', orderErr);
          }
        }

        // If linked to a purchase order, update paid_amount
        if (input.purchaseOrderId) {
          try {
            const { data: poData } = await supabase.from('purchase_orders').select('paid_amount, total_amount').eq('id', input.purchaseOrderId).single();
            if (poData) {
              const updatedPaid = (poData.paid_amount || 0) + newPayment.amount;
              const payStatus = updatedPaid >= poData.total_amount ? 'PAID' : updatedPaid > 0 ? 'PARTIAL' : 'UNPAID';
              await supabase.from('purchase_orders').update({ paid_amount: updatedPaid, payment_status: payStatus }).eq('id', input.purchaseOrderId);
            }
          } catch (poErr) {
            console.warn('PO payment status update warning:', poErr);
          }
        }

        try {
          await supabase.from('audit_logs').insert({
            action: 'CREATE_PAYMENT',
            entity: 'Payment',
            entity_id: dbPay.id,
            new_value: {
              payment_number: newPayment.paymentNumber,
              type: newPayment.paymentType,
              amount: newPayment.amount,
              mode: newPayment.paymentMode,
            },
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('payments', 'INSERT', newPayment as unknown as Record<string, unknown>);
    }

    localPayments.unshift(newPayment);
    await LocalStorageManager.cacheItems('payments', localPayments);
    return newPayment;
  }

  static async getFinancialSummary(): Promise<{
    totalReceived: number;
    totalPaid: number;
    netReceivable: number;
    netPayable: number;
  }> {
    const [payments, orders, pos] = await Promise.all([
      this.getPayments(),
      OrderService.getOrders(),
      PurchaseService.getPurchaseOrders(),
    ]);

    let totalReceived = 0;
    let totalPaid = 0;

    for (const p of payments) {
      if (p.paymentType === 'CUSTOMER_RECEIPT') {
        totalReceived += p.amount;
      } else if (p.paymentType === 'SUPPLIER_PAYMENT') {
        totalPaid += p.amount;
      }
    }

    const totalOrderValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalPoValue = pos.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    const netReceivable = Math.max(0, totalOrderValue - totalReceived);
    const netPayable = Math.max(0, totalPoValue - totalPaid);

    return {
      totalReceived,
      totalPaid,
      netReceivable,
      netPayable,
    };
  }
}

