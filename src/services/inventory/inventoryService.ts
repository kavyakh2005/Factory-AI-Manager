import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import {
  InventoryItem,
  InventoryTransaction,
  CreateInventoryItemInput,
  CreateStockAdjustmentInput,
  InventoryItemType,
  InventoryTransactionType,
} from '../../types';

let localInventoryItems: InventoryItem[] = [];
let localTransactionsMemory: InventoryTransaction[] = [];

export class InventoryService {
  /**
   * Derive current stock balance of an item by aggregating its immutable ledger transactions
   */
  static deriveStockFromLedger(itemId: string): number {
    const itemTx = localTransactionsMemory.filter((t) => t.itemId === itemId);
    if (itemTx.length === 0) {
      const it = localInventoryItems.find((i) => i.id === itemId);
      return it?.currentStock || 0;
    }
    // Return balanceAfter of the latest chronological ledger transaction
    const sorted = [...itemTx].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted[0].balanceAfter;
  }

  static async getInventoryItems(filters?: { itemType?: string; search?: string; category?: string; lowStockOnly?: boolean }): Promise<InventoryItem[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('inventory_items').select('*, products(*), sets(*), sizes(*)').order('name', { ascending: true });
        if (filters?.itemType && filters.itemType !== 'ALL') {
          query = query.eq('item_type', filters.itemType);
        }
        const { data, error } = await query;
        if (error) {
          console.error('[Supabase Error] getInventoryItems failed:', error.message, error);
          if (!navigator.onLine) {
            return this.applyFilters(localInventoryItems, filters);
          }
          throw new Error(`Failed to load inventory from Supabase: ${error.message}`);
        }

        if (data) {
          const mapped: InventoryItem[] = data.map((i: any) => ({
            id: i.id,
            itemType: i.item_type,
            sku: i.sku,
            name: i.name,
            productId: i.product_id,
            setId: i.set_id,
            sizeId: i.size_id,
            color: i.color,
            unit: i.unit || 'pcs',
            currentStock: Number(i.current_stock || 0),
            minimumStockThreshold: Number(i.minimum_stock_threshold || 10),
            reorderLevel: Number(i.reorder_level || 25),
            unitCost: Number(i.unit_cost || 0),
            storageLocation: i.storage_location,
            product: i.products ? {
              id: i.products.id,
              name: i.products.name,
              code: i.products.code,
              category: i.products.category,
              fabric: i.products.fabric,
              unit: i.products.unit,
              costPrice: Number(i.products.cost_price || 0),
              sellingPrice: Number(i.products.selling_price || 0),
              status: i.products.status,
            } : undefined,
            set: i.sets ? {
              id: i.sets.id,
              name: i.sets.name,
              code: i.sets.code,
              type: i.sets.type,
              status: i.sets.status,
              sortOrder: i.sets.sort_order,
            } : undefined,
            size: i.sizes ? {
              id: i.sizes.id,
              name: i.sizes.name,
              code: i.sizes.code,
              status: i.sizes.status,
            } : undefined,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          }));
          localInventoryItems = mapped;
          LocalStorageManager.cacheItems('inventory', mapped);
          return this.applyFilters(mapped, filters);
        }
      } catch (err: any) {
        console.error('Supabase inventory query exception:', err);
        if (navigator.onLine && err?.message?.includes('Supabase')) {
          throw err;
        }
      }
    }
    return this.applyFilters(localInventoryItems, filters);
  }

  private static applyFilters(list: InventoryItem[], filters?: { itemType?: string; search?: string; category?: string; lowStockOnly?: boolean }): InventoryItem[] {
    let res = [...list];
    if (filters?.itemType && filters.itemType !== 'ALL') {
      res = res.filter((i) => i.itemType === filters.itemType);
    }
    if (filters?.lowStockOnly) {
      res = res.filter((i) => i.currentStock <= (i.minimumStockThreshold || 10));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.storageLocation?.toLowerCase().includes(q)
      );
    }
    return res;
  }

  static async createInventoryItem(input: CreateInventoryItemInput): Promise<InventoryItem> {
    const newId = `inv-${Date.now()}`;
    const now = new Date().toISOString();
    const sku = (input.sku || input.itemCode || `SKU-${Date.now()}`).trim().toUpperCase();
    const name = (input.name || input.itemName || 'Unnamed Item').trim();

    const newItem: InventoryItem = {
      id: newId,
      itemType: input.itemType,
      sku,
      name,
      productId: input.productId,
      setId: input.setId,
      sizeId: input.sizeId,
      color: input.color?.trim(),
      unit: input.unit || 'pcs',
      currentStock: Math.max(0, input.currentStock || 0),
      minimumStockThreshold: Math.max(0, input.minimumStockThreshold ?? input.minStockAlert ?? 10),
      reorderLevel: Math.max(0, input.reorderLevel ?? 25),
      unitCost: Math.max(0, input.unitCost || 0),
      storageLocation: input.storageLocation?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .insert({
            item_type: newItem.itemType,
            sku: newItem.sku,
            name: newItem.name,
            product_id: newItem.productId || null,
            set_id: newItem.setId || null,
            size_id: newItem.sizeId || null,
            color: newItem.color,
            unit: newItem.unit,
            current_stock: newItem.currentStock,
            minimum_stock_threshold: newItem.minimumStockThreshold,
            reorder_level: newItem.reorderLevel,
            unit_cost: newItem.unitCost,
            storage_location: newItem.storageLocation,
          })
          .select()
          .single();

        if (!error && data) {
          newItem.id = data.id;

          // Initial opening stock transaction in the immutable ledger
          if (newItem.currentStock > 0) {
            await supabase.from('inventory_transactions').insert({
              item_id: data.id,
              transaction_type: 'ADJUSTMENT',
              quantity_change: newItem.currentStock,
              balance_after: newItem.currentStock,
              reference_type: 'OPENING_STOCK',
              notes: 'Initial opening stock ledger entry',
            });
          }

          await supabase.from('audit_logs').insert({
            action: 'CREATE_INVENTORY_ITEM',
            entity: 'InventoryItem',
            entity_id: data.id,
            new_value: { name: newItem.name, sku: newItem.sku, stock: newItem.currentStock },
          });
        }
      } catch (err) {
        await LocalStorageManager.enqueueOfflineMutation('inventory', 'INSERT', newItem as unknown as Record<string, unknown>);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('inventory', 'INSERT', newItem as unknown as Record<string, unknown>);
    }

    localInventoryItems.unshift(newItem);
    await LocalStorageManager.cacheItems('inventory', localInventoryItems);
    return newItem;
  }

  /**
   * Record an immutable Stock Movement Transaction (Ledger Model)
   * Calculates new stock balance from the ledger without overwriting raw balance
   */
  static async recordStockTransaction(
    input: {
      itemId: string;
      transactionType: InventoryTransactionType;
      quantityChange: number;
      reason: string;
      referenceType?: string;
      referenceId?: string;
      unit?: string;
      notes?: string;
      remarks?: string;
    },
    performerName = 'Inventory Manager'
  ): Promise<InventoryTransaction> {
    const item = localInventoryItems.find((i) => i.id === input.itemId);
    if (!item) throw new Error('Inventory Item not found in stock ledger');

    const qtyChange = Number(input.quantityChange);
    const prevBalance = this.deriveStockFromLedger(input.itemId);
    const newBalance = input.transactionType === 'ADJUSTMENT' && input.reason === 'RESET_COUNT'
      ? Math.max(0, qtyChange)
      : Math.max(0, prevBalance + qtyChange);

    item.currentStock = newBalance;
    item.updatedAt = new Date().toISOString();

    const txId = `tx-${Date.now()}`;
    const newTx: InventoryTransaction = {
      id: txId,
      itemId: input.itemId,
      itemName: item.name,
      transactionType: input.transactionType,
      quantity: Math.abs(qtyChange),
      quantityChange: qtyChange,
      unit: input.unit || item.unit,
      balanceAfter: newBalance,
      referenceType: input.referenceType || input.reason || 'MANUAL_MOVEMENT',
      referenceId: input.referenceId,
      reason: input.reason,
      remarks: input.remarks || input.notes || '',
      notes: input.notes || input.remarks || '',
      performerName,
      createdAt: new Date().toISOString(),
      item,
    };

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase
          .from('inventory_items')
          .update({ current_stock: newBalance, updated_at: item.updatedAt })
          .eq('id', input.itemId);

        await supabase.from('inventory_transactions').insert({
          item_id: input.itemId,
          transaction_type: input.transactionType,
          quantity_change: qtyChange,
          balance_after: newBalance,
          reference_type: newTx.referenceType,
          notes: newTx.remarks,
        });

        await supabase.from('audit_logs').insert({
          action: 'STOCK_LEDGER_ENTRY',
          entity: 'InventoryItem',
          entity_id: input.itemId,
          new_value: {
            movement: input.transactionType,
            quantity: Math.abs(qtyChange),
            balanceAfter: newBalance,
            reason: input.reason,
            reference: newTx.referenceId,
          },
        });
      } catch (err) {
        console.warn('Stock transaction sync failed, caching offline:', err);
      }
    }

    localTransactionsMemory.unshift(newTx);
    await LocalStorageManager.cacheItems('inventory', localInventoryItems);
    return newTx;
  }

  static async getTransactionHistory(itemId?: string): Promise<InventoryTransaction[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('inventory_transactions').select('*, inventory_items(*)').order('created_at', { ascending: false }).limit(100);
        if (itemId) query = query.eq('item_id', itemId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: InventoryTransaction[] = data.map((t: any) => ({
            id: t.id,
            itemId: t.item_id,
            itemName: t.inventory_items?.name,
            transactionType: t.transaction_type,
            quantity: Math.abs(Number(t.quantity_change)),
            quantityChange: Number(t.quantity_change),
            unit: t.inventory_items?.unit || 'pcs',
            balanceAfter: Number(t.balance_after),
            referenceType: t.reference_type,
            referenceId: t.reference_id,
            reason: t.reference_type,
            remarks: t.notes,
            notes: t.notes,
            performerName: 'Factory Floor User',
            createdAt: t.created_at,
            item: t.inventory_items ? {
              id: t.inventory_items.id,
              name: t.inventory_items.name,
              sku: t.inventory_items.sku,
              unit: t.inventory_items.unit,
              currentStock: Number(t.inventory_items.current_stock),
              itemType: t.inventory_items.item_type,
              minimumStockThreshold: Number(t.inventory_items.minimum_stock_threshold || 10),
              reorderLevel: Number(t.inventory_items.reorder_level || 25),
              unitCost: Number(t.inventory_items.unit_cost || 0),
            } : undefined,
          }));
          localTransactionsMemory = mapped;
          return mapped;
        }
      } catch (err) {
        console.warn('Transaction history query error, using local buffer:', err);
      }
    }
    if (itemId) return localTransactionsMemory.filter((t) => t.itemId === itemId);
    return localTransactionsMemory;
  }

  static async getTransactions(itemId?: string): Promise<InventoryTransaction[]> {
    return this.getTransactionHistory(itemId);
  }

  static async getLowStockAlerts(): Promise<InventoryItem[]> {
    const items = await this.getInventoryItems();
    return items.filter((i) => i.currentStock <= (i.minimumStockThreshold || 10));
  }

  static async updateInventoryItem(id: string, input: Partial<CreateInventoryItemInput>): Promise<InventoryItem> {
    const item = localInventoryItems.find((i) => i.id === id);
    if (!item) throw new Error('Inventory Item not found');
    if (input.name !== undefined) item.name = input.name.trim();
    if (input.sku !== undefined) item.sku = input.sku.trim().toUpperCase();
    if (input.itemType !== undefined) item.itemType = input.itemType;
    if (input.unit !== undefined) item.unit = input.unit;
    if (input.minimumStockThreshold !== undefined) item.minimumStockThreshold = input.minimumStockThreshold;
    if (input.unitCost !== undefined) item.unitCost = input.unitCost;
    if (input.storageLocation !== undefined) item.storageLocation = input.storageLocation;
    item.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('inventory_items').update({
          name: item.name,
          sku: item.sku,
          item_type: item.itemType,
          unit: item.unit,
          minimum_stock_threshold: item.minimumStockThreshold,
          unit_cost: item.unitCost,
          storage_location: item.storageLocation,
          updated_at: item.updatedAt,
        }).eq('id', id);
      } catch (err) {
        console.warn('Inventory update offline queue');
      }
    }

    await LocalStorageManager.cacheItems('inventory', localInventoryItems);
    return item;
  }

  static async recordStockMovement(input: {
    itemId: string;
    transactionType: InventoryTransactionType;
    quantity?: number;
    quantityChange?: number;
    unit?: string;
    referenceType?: string;
    referenceId?: string;
    reason: string;
    remarks?: string;
    notes?: string;
  }): Promise<InventoryTransaction> {
    const rawQty = input.quantity ?? input.quantityChange ?? 1;
    const isOut = input.transactionType === 'OUT' || input.transactionType === 'CONSUMPTION' || input.transactionType === 'DISPATCH';
    const qtyChange = isOut ? -Math.abs(rawQty) : Math.abs(rawQty);
    const txType = (input.transactionType === 'IN' || input.transactionType === 'PURCHASE') ? 'IN' : isOut ? 'OUT' : 'ADJUSTMENT';

    return this.recordStockTransaction({
      itemId: input.itemId,
      transactionType: txType,
      quantityChange: qtyChange,
      referenceType: input.referenceType || input.reason,
      referenceId: input.referenceId,
      unit: input.unit,
      reason: input.reason,
      remarks: input.remarks || input.notes,
      notes: input.notes || input.remarks,
    });
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    localInventoryItems = localInventoryItems.filter((i) => i.id !== id);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('inventory_transactions').delete().eq('item_id', id);
        const { error } = await supabase.from('inventory_items').delete().eq('id', id);
        if (error) throw error;
        await supabase.from('audit_logs').insert({
          action: 'DELETE_INVENTORY_ITEM',
          entity: 'InventoryItem',
          entity_id: id,
        });
      } catch (err: any) {
        console.error('Supabase deleteInventoryItem error:', err);
        throw new Error(`Failed to delete inventory item: ${err?.message || 'Unknown error'}`);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('inventory', 'DELETE', { id });
    }

    await LocalStorageManager.cacheItems('inventory', localInventoryItems);
  }
}
