import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { PurchaseOrder, CreatePurchaseOrderInput, Supplier } from '../../types';
import { SupplierService } from '../suppliers/supplierService';
import { InventoryService } from '../inventory/inventoryService';

let localPurchaseOrders: PurchaseOrder[] = LocalStorageManager.getSyncItems<PurchaseOrder>('purchase_orders', []);

export class PurchaseService {
  static async getPurchaseOrders(filters?: { status?: string; search?: string }): Promise<PurchaseOrder[]> {
    const suppliers = await SupplierService.getSuppliers();

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('purchase_orders').select('*, suppliers(*), purchase_order_items(*)').order('created_at', { ascending: false });
        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }
        const { data, error } = await query;
        if (error) {
          console.error('[Supabase Error] getPurchaseOrders failed:', error.message, error);
          if (!navigator.onLine) {
            localPurchaseOrders.forEach((po) => {
              po.supplier = suppliers.find((s) => s.id === po.supplierId);
            });
            return this.applyFilters(localPurchaseOrders, filters);
          }
          throw new Error(`Failed to load purchase orders from Supabase: ${error.message}`);
        }

        if (data) {
          const mapped: PurchaseOrder[] = data.map((po: any) => ({
            id: po.id,
            poNumber: po.po_number,
            supplierId: po.supplier_id,
            status: po.status || 'ORDERED',
            orderDate: po.order_date,
            expectedDate: po.expected_date,
            totalAmount: Number(po.total_amount || 0),
            paidAmount: Number(po.paid_amount || 0),
            paymentStatus: po.payment_status || 'UNPAID',
            notes: po.notes,
            supplier: po.suppliers ? {
              id: po.suppliers.id,
              supplierCode: po.suppliers.supplier_code,
              name: po.suppliers.name,
              contactPerson: po.suppliers.contact_person,
              phone: po.suppliers.phone,
              email: po.suppliers.email,
              status: po.suppliers.status,
            } : suppliers.find((s) => s.id === po.supplier_id),
            items: po.purchase_order_items?.map((poi: any) => ({
              id: poi.id,
              purchaseOrderId: poi.purchase_order_id,
              itemId: poi.item_id,
              itemName: poi.item_name,
              category: poi.category,
              quantity: Number(poi.quantity),
              unit: poi.unit,
              rate: Number(poi.rate),
              taxRate: Number(poi.tax_rate || 5),
              lineTotal: Number(poi.line_total),
              receivedQuantity: Number(poi.received_quantity || 0),
              rejectedQuantity: Number(poi.rejected_quantity || 0),
            })),
            createdAt: po.created_at,
            updatedAt: po.updated_at || po.created_at,
          }));
          localPurchaseOrders = mapped;
          LocalStorageManager.cacheItems('purchase_orders', mapped);
          return this.applyFilters(mapped, filters);
        }
      } catch (err: any) {
        console.error('PO query exception:', err);
        if (navigator.onLine && err?.message?.includes('Supabase')) {
          throw err;
        }
      }
    }

    if (localPurchaseOrders.length === 0) {
      const cached = await LocalStorageManager.getCachedItems<PurchaseOrder>('purchase_orders', []);
      if (cached && cached.length > 0) {
        localPurchaseOrders = cached;
      }
    }

    // Attach supplier to local memory
    localPurchaseOrders.forEach((po) => {
      po.supplier = suppliers.find((s) => s.id === po.supplierId);
    });

    return this.applyFilters(localPurchaseOrders, filters);
  }

  private static applyFilters(list: PurchaseOrder[], filters?: { status?: string; search?: string }): PurchaseOrder[] {
    let res = [...list];
    if (filters?.status && filters.status !== 'ALL') {
      res = res.filter((p) => p.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter(
        (p) =>
          p.poNumber.toLowerCase().includes(q) ||
          p.supplier?.name.toLowerCase().includes(q) ||
          p.items?.some((i) => i.itemName.toLowerCase().includes(q))
      );
    }
    return res;
  }

  static async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const suppliers = await SupplierService.getSuppliers();
    const supplier = suppliers.find((s) => s.id === input.supplierId);
    const newId = `po-${Date.now()}`;
    const poNumber = input.poNumber || `PO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    let totalAmount = 0;
    const items = input.items.map((it, idx) => {
      const lineTotal = it.quantity * it.rate * (1 + (it.taxRate || 5) / 100);
      totalAmount += lineTotal;
      return {
        id: `poi-${Date.now()}-${idx}`,
        purchaseOrderId: newId,
        itemId: it.itemId,
        itemName: it.itemName,
        category: it.category,
        quantity: it.quantity,
        unit: it.unit,
        rate: it.rate,
        taxRate: it.taxRate || 5,
        lineTotal,
        receivedQuantity: 0,
      };
    });

    const newPO: PurchaseOrder = {
      id: newId,
      poNumber,
      supplierId: input.supplierId,
      supplier,
      status: 'ORDERED',
      orderDate: now,
      expectedDate: new Date(input.expectedDate).toISOString(),
      totalAmount,
      paidAmount: 0,
      paymentStatus: 'UNPAID',
      notes: input.notes,
      items,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { data: dbPO, error: poErr } = await supabase
          .from('purchase_orders')
          .insert({
            po_number: newPO.poNumber,
            supplier_id: newPO.supplierId,
            status: newPO.status,
            order_date: newPO.orderDate,
            expected_date: newPO.expectedDate,
            total_amount: newPO.totalAmount,
            paid_amount: 0,
            payment_status: 'UNPAID',
            notes: newPO.notes,
          })
          .select()
          .single();

        if (poErr) {
          console.error('[Supabase Error] createPurchaseOrder failed:', poErr.message, poErr);
          throw new Error(`Failed to save PO to Supabase: ${poErr.message}`);
        }

        if (dbPO) {
          newPO.id = dbPO.id;
          const poItemsData = items.map((it) => ({
            purchase_order_id: dbPO.id,
            item_id: it.itemId || null,
            item_name: it.itemName,
            category: it.category,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            tax_rate: it.taxRate,
            line_total: it.lineTotal,
            received_quantity: 0,
          }));
          const { error: itemsErr } = await supabase.from('purchase_order_items').insert(poItemsData);
          if (itemsErr) {
            console.error('[Supabase Error] purchase_order_items insert failed:', itemsErr.message, itemsErr);
          }

          try {
            await supabase.from('audit_logs').insert({
              action: 'CREATE_PURCHASE_ORDER',
              entity: 'PurchaseOrder',
              entity_id: dbPO.id,
              new_value: { po_number: newPO.poNumber, supplier: supplier?.name, amount: totalAmount },
            });
          } catch (auditErr) {
            console.warn('Audit log write error:', auditErr);
          }
        }
      } catch (err: any) {
        console.error('Supabase PO exception:', err);
        throw err;
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('purchase_orders', 'INSERT', newPO as unknown as Record<string, unknown>);
    }

    localPurchaseOrders.unshift(newPO);
    await LocalStorageManager.cacheItems('purchase_orders', localPurchaseOrders);
    return newPO;
  }

  // Receiving Goods from a Purchase Order (Posts to Inventory Ledger automatically)
  static async receiveGoods(poId: string, receivedList: Array<{ itemId?: string; itemName: string; receivedQty: number; unit: string }>): Promise<void> {
    const po = localPurchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error('Purchase Order not found');

    for (const rec of receivedList) {
      if (rec.receivedQty <= 0) continue;

      // Update PO items
      const poItem = po.items?.find((i) => i.itemName === rec.itemName || (rec.itemId && i.itemId === rec.itemId));
      if (poItem) {
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + rec.receivedQty;
      }

      // Record transaction in immutable inventory ledger if itemId is linked
      if (rec.itemId) {
        await InventoryService.recordStockMovement({
          itemId: rec.itemId,
          transactionType: 'IN',
          quantity: rec.receivedQty,
          unit: rec.unit,
          referenceType: 'PURCHASE_ORDER',
          referenceId: po.poNumber,
          reason: 'Purchase Receiving',
          remarks: `Consignment received from ${po.supplier?.name || 'Supplier'} under PO #${po.poNumber}`,
        });
      }
    }

    // Determine status
    const allCompleted = po.items?.every((i) => (i.receivedQuantity || 0) >= i.quantity);
    po.status = allCompleted ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    po.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('purchase_orders').update({ status: po.status, updated_at: po.updatedAt }).eq('id', poId);
      } catch (err) {
        console.warn('PO status update offline fallback');
      }
    }

    await LocalStorageManager.cacheItems('purchase_orders', localPurchaseOrders);
  }

  static async deletePurchaseOrder(id: string): Promise<void> {
    localPurchaseOrders = localPurchaseOrders.filter((p) => p.id !== id);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', id);
        const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
        if (error) throw error;
        await supabase.from('audit_logs').insert({
          action: 'DELETE_PURCHASE_ORDER',
          entity: 'PurchaseOrder',
          entity_id: id,
        });
      } catch (err: any) {
        console.error('Supabase deletePurchaseOrder error:', err);
        throw new Error(`Failed to delete PO: ${err?.message || 'Unknown error'}`);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('purchase_orders', 'DELETE', { id });
    }

    await LocalStorageManager.cacheItems('purchase_orders', localPurchaseOrders);
  }
}
