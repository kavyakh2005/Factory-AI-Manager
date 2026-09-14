import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import {
  FinishedGoodsStock,
  StockReservation,
  ProductionRequirement,
  Carton,
  StockReturn,
  StockAgingSummary,
  SizeStockAvailability,
  OrderFulfillmentStatus,
  OrderItem,
  OrderItemDraft,
  InventoryTransaction,
} from '../../types';

// In-Memory fallback caches for offline resilience & atomic consistency with 7-day retention
let localFinishedStock: FinishedGoodsStock[] = LocalStorageManager.getSyncItems<FinishedGoodsStock>('finished_goods_stock', []);
let localReservations: StockReservation[] = LocalStorageManager.getSyncItems<StockReservation>('stock_reservations', []);
let localRequirements: ProductionRequirement[] = LocalStorageManager.getSyncItems<ProductionRequirement>('production_requirements', []);
let localCartons: Carton[] = LocalStorageManager.getSyncItems<Carton>('cartons', []);
let localReturns: StockReturn[] = LocalStorageManager.getSyncItems<StockReturn>('stock_returns', []);
let localInventoryTransactions: InventoryTransaction[] = LocalStorageManager.getSyncItems<InventoryTransaction>('inventory_transactions', []);

// Track cumulative credited quantities per batch + size: { [batchId_sizeId]: totalCreditedPieces }
const getCreditedMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem('factory_production_credited_map');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveCreditedMap = (map: Record<string, number>) => {
  try {
    localStorage.setItem('factory_production_credited_map', JSON.stringify(map));
  } catch {}
};

const processedDispatchOrders = new Set<string>();

const isUuid = (str?: string) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export class FinishedGoodsService {
  /**
   * 1. GET ALL FINISHED GOODS READY STOCK
   * Returns Product -> Set -> Size hierarchy with Physical, Reserved & Dispatchable quantities
   */
  static async getFinishedGoodsStock(filters?: {
    productId?: string;
    setId?: string;
    sizeId?: string;
    search?: string;
    agingBracket?: string;
  }): Promise<FinishedGoodsStock[]> {
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*, products(*), sets(*), sizes(*)')
          .eq('item_type', 'FINISHED_GOODS')
          .order('name', { ascending: true });

        if (!error && data) {
          const now = Date.now();
          const mapped: FinishedGoodsStock[] = data.map((item: any) => {
            const physical = Number(item.current_stock || 0);

            // Derive active reserved stock for this specific (product, set, size)
            const activeRes = localReservations
              .filter(
                (r) =>
                  r.status === 'ACTIVE' &&
                  r.productId === item.product_id &&
                  r.setId === item.set_id &&
                  r.sizeId === item.size_id
              )
              .reduce((sum, r) => sum + r.reservedQuantity, 0);

            const dispatchable = Math.max(0, physical - activeRes);

            // Compute Stock Aging
            const prodDate = item.updated_at || item.created_at || new Date().toISOString();
            const ageDays = Math.max(0, Math.floor((now - new Date(prodDate).getTime()) / (1000 * 60 * 60 * 24)));

            let bracket: '0-30' | '31-60' | '61-90' | '90+' = '0-30';
            if (ageDays > 90) bracket = '90+';
            else if (ageDays > 60) bracket = '61-90';
            else if (ageDays > 30) bracket = '31-60';

            let speed: 'FAST' | 'MEDIUM' | 'SLOW' | 'DEAD' = 'MEDIUM';
            if (ageDays <= 15) speed = 'FAST';
            else if (ageDays <= 45) speed = 'MEDIUM';
            else if (ageDays <= 90) speed = 'SLOW';
            else speed = 'DEAD';

            return {
              id: item.id,
              productId: item.product_id,
              product: item.products,
              productName: item.products?.name || item.name,
              productCode: item.products?.code || item.sku,
              category: item.products?.category,
              fabric: item.products?.fabric,
              setId: item.set_id,
              set: item.sets,
              setName: item.sets?.name,
              sizeId: item.size_id,
              size: item.sizes,
              sizeName: item.sizes?.name || 'Standard',
              physicalQuantity: physical,
              reservedQuantity: activeRes,
              dispatchableQuantity: dispatchable,
              storageLocation: item.storage_location || 'Warehouse Bay 1',
              lastProductionDate: item.updated_at || item.created_at,
              unitCost: Number(item.unit_cost || 0),
              sellingPrice: Number(item.products?.selling_price || 0),
              stockAgeDays: ageDays,
              agingBracket: bracket,
              movementSpeed: speed,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            };
          });

          localFinishedStock = mapped;
          try {
            localStorage.setItem('factory_finished_goods_stock', JSON.stringify(mapped));
          } catch {}
          return this.applyFilters(mapped, filters);
        }
      } catch (err) {
        console.warn('Supabase finished goods fetch error, using local cache:', err);
      }
    }

    return this.applyFilters(localFinishedStock, filters);
  }

  private static applyFilters(
    list: FinishedGoodsStock[],
    filters?: {
      productId?: string;
      setId?: string;
      sizeId?: string;
      search?: string;
      agingBracket?: string;
    }
  ): FinishedGoodsStock[] {
    let result = [...list];
    if (filters?.productId && filters.productId !== 'ALL') {
      result = result.filter((s) => s.productId === filters.productId);
    }
    if (filters?.setId && filters.setId !== 'ALL') {
      result = result.filter((s) => s.setId === filters.setId);
    }
    if (filters?.sizeId && filters.sizeId !== 'ALL') {
      result = result.filter((s) => s.sizeId === filters.sizeId);
    }
    if (filters?.agingBracket && filters.agingBracket !== 'ALL') {
      result = result.filter((s) => s.agingBracket === filters.agingBracket);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.productName?.toLowerCase().includes(q) ||
          s.productCode?.toLowerCase().includes(q) ||
          s.setName?.toLowerCase().includes(q) ||
          s.sizeName?.toLowerCase().includes(q)
      );
    }
    return result;
  }

  /**
   * 2. CHECK SIZE-WISE STOCK AVAILABILITY & SHORTAGE
   * Used in Order Creation Modal and AI Manager
   */
  static async checkStockAvailability(
    productId: string,
    setId: string,
    sizeQuantities: Record<string, number>
  ): Promise<{
    sizes: SizeStockAvailability[];
    totalRequested: number;
    totalAvailable: number;
    totalShortage: number;
    fulfillmentStatus: OrderFulfillmentStatus;
  }> {
    const stockList = await this.getFinishedGoodsStock({ productId, setId });

    let totalRequested = 0;
    let totalAvailable = 0;
    let totalShortage = 0;

    const sizeResults: SizeStockAvailability[] = [];

    for (const [sizeId, requestedQty] of Object.entries(sizeQuantities)) {
      const numRequested = Number(requestedQty) || 0;
      totalRequested += numRequested;

      const stockItem = stockList.find((s) => s.sizeId === sizeId);
      const physical = stockItem ? stockItem.physicalQuantity : 0;
      const reserved = stockItem ? stockItem.reservedQuantity : 0;
      const dispatchable = stockItem ? stockItem.dispatchableQuantity : 0;

      const shortage = Math.max(0, numRequested - dispatchable);
      const isSufficient = shortage === 0;

      totalAvailable += Math.min(dispatchable, numRequested);
      totalShortage += shortage;

      sizeResults.push({
        sizeId,
        sizeName: stockItem?.sizeName || sizeId,
        sequence: stockItem?.size?.sortOrder || 0,
        physicalStock: physical,
        reservedStock: reserved,
        dispatchableStock: dispatchable,
        requestedQuantity: numRequested,
        isSufficient,
        shortageQuantity: shortage,
      });
    }

    let fulfillmentStatus: OrderFulfillmentStatus = 'FULLY_AVAILABLE';
    if (totalShortage > 0) {
      fulfillmentStatus = totalAvailable > 0 ? 'PARTIALLY_AVAILABLE' : 'SHORTAGE';
    }

    return {
      sizes: sizeResults,
      totalRequested,
      totalAvailable,
      totalShortage,
      fulfillmentStatus,
    };
  }

  /**
   * 3. RESERVE STOCK FOR A CONFIRMED ORDER
   * Atomic size-wise stock reservation. Decreases dispatchable stock without silently deleting physical goods.
   */
  static async reserveStockForOrder(orderId: string, items: OrderItem[]): Promise<StockReservation[]> {
    // Release any existing active reservations for this order to prevent duplicates
    await this.releaseOrderReservation(orderId);

    const newReservations: StockReservation[] = [];
    const now = new Date().toISOString();

    for (const item of items) {
      if (item.quantity <= 0) continue;

      // Find current stock item
      const stockItem = localFinishedStock.find(
        (s) => s.productId === item.productId && s.setId === item.setId && s.sizeId === item.sizeId
      );

      const dispatchable = stockItem ? stockItem.dispatchableQuantity : 0;
      const reserveQty = Math.min(item.quantity, dispatchable);

      if (reserveQty > 0) {
        const res: StockReservation = {
          id: crypto.randomUUID(),
          orderId,
          orderItemId: item.id,
          productId: item.productId,
          productName: item.product?.name,
          setId: item.setId,
          setName: item.set?.name,
          sizeId: item.sizeId,
          sizeName: item.size?.name,
          reservedQuantity: reserveQty,
          status: 'ACTIVE',
          createdAt: now,
        };

        newReservations.push(res);
        localReservations.push(res);

        // Update in-memory stock reservation
        if (stockItem) {
          stockItem.reservedQuantity += reserveQty;
          stockItem.dispatchableQuantity = Math.max(0, stockItem.physicalQuantity - stockItem.reservedQuantity);
        }

        // Log transaction to inventory ledger
        if (stockItem) {
          await this.logInventoryLedgerEntry({
            itemId: stockItem.id,
            transactionType: 'IN',
            quantityChange: 0,
            balanceAfter: stockItem.physicalQuantity,
            referenceType: 'STOCK_RESERVE',
            referenceId: orderId,
            notes: `Reserved ${reserveQty} pcs for Order ${orderId}`,
          });
        }
      }
    }

    try {
      localStorage.setItem('factory_stock_reservations', JSON.stringify(localReservations));
      localStorage.setItem('factory_finished_goods_stock', JSON.stringify(localFinishedStock));
    } catch {}

    return newReservations;
  }

  /**
   * 4. RELEASE ORDER RESERVATIONS (e.g. On Order Cancellation)
   */
  static async releaseOrderReservation(orderId: string): Promise<void> {
    const activeRes = localReservations.filter((r) => r.orderId === orderId && r.status === 'ACTIVE');

    for (const res of activeRes) {
      res.status = 'RELEASED';
      res.updatedAt = new Date().toISOString();

      const stockItem = localFinishedStock.find(
        (s) => s.productId === res.productId && s.setId === res.setId && s.sizeId === res.sizeId
      );

      if (stockItem) {
        stockItem.reservedQuantity = Math.max(0, stockItem.reservedQuantity - res.reservedQuantity);
        stockItem.dispatchableQuantity = Math.max(0, stockItem.physicalQuantity - stockItem.reservedQuantity);

        await this.logInventoryLedgerEntry({
          itemId: stockItem.id,
          transactionType: 'IN',
          quantityChange: 0,
          balanceAfter: stockItem.physicalQuantity,
          referenceType: 'STOCK_RELEASE',
          referenceId: orderId,
          notes: `Released ${res.reservedQuantity} pcs reservation from cancelled/modified Order ${orderId}`,
        });
      }
    }

    try {
      localStorage.setItem('factory_stock_reservations', JSON.stringify(localReservations));
      localStorage.setItem('factory_finished_goods_stock', JSON.stringify(localFinishedStock));
    } catch {}
  }

  /**
   * 5. DISPATCH ORDER STOCK
   * Consumes the reserved finished stock exactly once and updates inventory balance.
   */
  static async dispatchOrderStock(
    dispatchId: string,
    orderId: string,
    items: OrderItem[]
  ): Promise<{ success: boolean; dispatchedPcs: number }> {
    if (processedDispatchOrders.has(orderId)) {
      console.warn(`Order ${orderId} has already been dispatched. Skipping duplicate stock deduction.`);
      return { success: true, dispatchedPcs: 0 };
    }

    let totalDispatched = 0;
    const now = new Date().toISOString();

    for (const item of items) {
      const stockItem = localFinishedStock.find(
        (s) => s.productId === item.productId && s.setId === item.setId && s.sizeId === item.sizeId
      );

      const qtyToDeduct = item.quantity;
      if (stockItem && qtyToDeduct > 0) {
        stockItem.physicalQuantity = Math.max(0, stockItem.physicalQuantity - qtyToDeduct);
        stockItem.reservedQuantity = Math.max(0, stockItem.reservedQuantity - qtyToDeduct);
        stockItem.dispatchableQuantity = Math.max(0, stockItem.physicalQuantity - stockItem.reservedQuantity);
        stockItem.lastDispatchDate = now;
        totalDispatched += qtyToDeduct;

        // Update database inventory item
        if (isSupabaseConfigured && navigator.onLine && isUuid(stockItem.id)) {
          try {
            await supabase
              .from('inventory_items')
              .update({
                current_stock: stockItem.physicalQuantity,
                updated_at: now,
              })
              .eq('id', stockItem.id);
          } catch (err) {
            console.warn('Supabase stock update error on dispatch:', err);
          }
        }

        // Immutable Ledger Entry
        await this.logInventoryLedgerEntry({
          itemId: stockItem.id,
          transactionType: 'OUT',
          quantityChange: -qtyToDeduct,
          balanceAfter: stockItem.physicalQuantity,
          referenceType: 'DISPATCH',
          referenceId: dispatchId || orderId,
          notes: `Dispatched ${qtyToDeduct} pcs for Order ${orderId}`,
        });
      }
    }

    // Mark reservations as DISPATCHED
    localReservations
      .filter((r) => r.orderId === orderId && r.status === 'ACTIVE')
      .forEach((r) => {
        r.status = 'DISPATCHED';
        r.updatedAt = now;
      });

    processedDispatchOrders.add(orderId);

    try {
      localStorage.setItem('factory_stock_reservations', JSON.stringify(localReservations));
      localStorage.setItem('factory_finished_goods_stock', JSON.stringify(localFinishedStock));
    } catch {}

    return { success: true, dispatchedPcs: totalDispatched };
  }

  /**
   * 6. CREDIT PRODUCTION TO READY STOCK (IDEMPOTENT & SIZE-WISE)
   * Transfers QC-passed pieces to Ready Stock without creating new Product Master records.
   * Supports partial production and rejects duplicate credit attempts.
   */
  static async creditProductionToReadyStock(params: {
    productionOrderId: string;
    productionNumber: string;
    productId: string;
    setId: string;
    entries: Array<{
      sizeId: string;
      sizeName?: string;
      quantityPassed: number;
      quantityRejected?: number;
    }>;
    cartonNumber?: string;
    operatorName?: string;
    notes?: string;
  }): Promise<{ creditedPcs: number; sizeBreakdown: Record<string, number> }> {
    const creditedMap = getCreditedMap();
    let totalCredited = 0;
    const sizeBreakdown: Record<string, number> = {};
    const now = new Date().toISOString();

    for (const entry of params.entries) {
      const passedQty = Math.max(0, Number(entry.quantityPassed) || 0);
      if (passedQty <= 0) continue;

      const creditKey = `${params.productionOrderId}_${entry.sizeId}`;
      const previouslyCredited = creditedMap[creditKey] || 0;

      // Delta to add for partial completion / incremental ready batches
      const deltaToAdd = Math.max(0, passedQty - previouslyCredited);
      if (deltaToAdd <= 0) {
        // Already credited this quantity, skip to guarantee idempotency
        continue;
      }

      // Find or create FinishedGoodsStock item
      let stockItem = localFinishedStock.find(
        (s) => s.productId === params.productId && s.setId === params.setId && s.sizeId === entry.sizeId
      );

      if (!stockItem) {
        const newItemId = crypto.randomUUID();
        stockItem = {
          id: newItemId,
          productId: params.productId,
          setId: params.setId,
          sizeId: entry.sizeId,
          sizeName: entry.sizeName || entry.sizeId,
          physicalQuantity: 0,
          reservedQuantity: 0,
          dispatchableQuantity: 0,
          storageLocation: 'Warehouse Ready Bay',
          lastProductionDate: now,
          createdAt: now,
          updatedAt: now,
        };
        localFinishedStock.push(stockItem);

        // Create Finished Goods item in Supabase inventory_items
        if (isSupabaseConfigured && navigator.onLine) {
          try {
            await supabase.from('inventory_items').insert({
              id: newItemId,
              item_type: 'FINISHED_GOODS',
              sku: `FG-${params.productId.slice(0, 4)}-${params.setId.slice(0, 4)}-${entry.sizeId.slice(0, 4)}`.toUpperCase(),
              name: `Ready Stock (${entry.sizeName || entry.sizeId})`,
              product_id: isUuid(params.productId) ? params.productId : null,
              set_id: isUuid(params.setId) ? params.setId : null,
              size_id: isUuid(entry.sizeId) ? entry.sizeId : null,
              unit: 'pcs',
              current_stock: deltaToAdd,
              minimum_stock_threshold: 15,
              reorder_level: 40,
            });
          } catch (err) {
            console.warn('Supabase inventory_item insert error on production ready:', err);
          }
        }
      }

      // Update Stock Quantities
      stockItem.physicalQuantity += deltaToAdd;
      stockItem.dispatchableQuantity = Math.max(0, stockItem.physicalQuantity - stockItem.reservedQuantity);
      stockItem.lastProductionDate = now;
      stockItem.updatedAt = now;

      totalCredited += deltaToAdd;
      sizeBreakdown[entry.sizeId] = (sizeBreakdown[entry.sizeId] || 0) + deltaToAdd;

      // Update Supabase current_stock
      if (isSupabaseConfigured && navigator.onLine && isUuid(stockItem.id)) {
        try {
          await supabase
            .from('inventory_items')
            .update({
              current_stock: stockItem.physicalQuantity,
              updated_at: now,
            })
            .eq('id', stockItem.id);
        } catch (err) {
          console.warn('Supabase stock update error on production credit:', err);
        }
      }

      // Immutable Inventory Ledger Record (PRODUCTION_OUTPUT)
      await this.logInventoryLedgerEntry({
        itemId: stockItem.id,
        transactionType: 'IN',
        quantityChange: deltaToAdd,
        balanceAfter: stockItem.physicalQuantity,
        referenceType: 'PRODUCTION_OUTPUT',
        referenceId: params.productionOrderId,
        notes: `Ready Stock credited from Batch ${params.productionNumber} (Size ${entry.sizeName || entry.sizeId}: +${deltaToAdd} pcs)${params.cartonNumber ? ` [Carton ${params.cartonNumber}]` : ''}`,
        performerName: params.operatorName || 'Production Supervisor',
      });

      // Update credit map
      creditedMap[creditKey] = previouslyCredited + deltaToAdd;
    }

    saveCreditedMap(creditedMap);

    // Save cartons if specified
    if (params.cartonNumber && totalCredited > 0) {
      localCartons.push({
        id: crypto.randomUUID(),
        cartonNumber: params.cartonNumber,
        batchId: params.productionOrderId,
        batchNumber: params.productionNumber,
        totalPcs: totalCredited,
        sizeBreakdown,
        packedBy: params.operatorName || 'Packing Operator',
        packedDate: now,
        status: 'IN_STOCK',
      });
    }

    try {
      localStorage.setItem('factory_finished_goods_stock', JSON.stringify(localFinishedStock));
      localStorage.setItem('factory_cartons', JSON.stringify(localCartons));
    } catch {}

    return { creditedPcs: totalCredited, sizeBreakdown };
  }

  /**
   * Helper alias for legacy recordPackingOutput
   */
  static async recordPackingOutput(
    batchId: string,
    batchNumber: string,
    productId: string,
    setId: string,
    entries: Array<{ sizeId: string; quantity: number }>,
    cartonNumber?: string,
    operatorName?: string
  ): Promise<{ addedPcs: number }> {
    const res = await this.creditProductionToReadyStock({
      productionOrderId: batchId,
      productionNumber: batchNumber,
      productId,
      setId,
      entries: entries.map((e) => ({ sizeId: e.sizeId, quantityPassed: e.quantity })),
      cartonNumber,
      operatorName,
    });
    return { addedPcs: res.creditedPcs };
  }

  /**
   * 7. CREATE REPLENISHMENT PRODUCTION REQUIREMENT
   * Triggered when customer order encounters a stock shortage.
   */
  static async createProductionRequirement(params: {
    orderId?: string;
    orderNumber?: string;
    customerName?: string;
    productId: string;
    setId: string;
    sizeId: string;
    requiredQuantity: number;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    notes?: string;
  }): Promise<ProductionRequirement> {
    const newReq: ProductionRequirement = {
      id: crypto.randomUUID(),
      requirementNumber: `REQ-${Date.now().toString().slice(-6)}`,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      productId: params.productId,
      setId: params.setId,
      sizeId: params.sizeId,
      requiredQuantity: params.requiredQuantity,
      producedQuantity: 0,
      remainingQuantity: params.requiredQuantity,
      priority: params.priority || 'NORMAL',
      status: 'PENDING',
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localRequirements.unshift(newReq);
    try {
      localStorage.setItem('factory_production_requirements', JSON.stringify(localRequirements));
    } catch {}

    return newReq;
  }

  /**
   * 8. GET STOCK MOVEMENTS & TRANSACTIONS FOR A PRODUCT
   */
  static async getProductStockMovements(productId: string): Promise<InventoryTransaction[]> {
    const stockItems = localFinishedStock.filter((s) => s.productId === productId);
    const itemIds = new Set(stockItems.map((s) => s.id));

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('inventory_transactions')
          .select('*, inventory_items(*)')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          return data
            .filter((t: any) => itemIds.has(t.item_id) || t.inventory_items?.product_id === productId)
            .map((t: any) => ({
              id: t.id,
              itemId: t.item_id,
              itemName: t.inventory_items?.name,
              transactionType: t.transaction_type,
              quantityChange: Number(t.quantity_change || 0),
              balanceAfter: Number(t.balance_after || 0),
              referenceType: t.reference_type,
              referenceId: t.reference_id,
              notes: t.notes,
              performerName: t.performed_by,
              createdAt: t.created_at,
            }));
        }
      } catch (err) {
        console.warn('Supabase stock movements query error:', err);
      }
    }

    return localInventoryTransactions.filter((t) => itemIds.has(t.itemId));
  }

  /**
   * 9. GET STOCK AGING REPORT SUMMARY
   */
  static async getStockAgingReport(): Promise<StockAgingSummary> {
    const stock = await this.getFinishedGoodsStock();

    let b0To30 = 0;
    let b31To60 = 0;
    let b61To90 = 0;
    let b90Plus = 0;
    let totalReady = 0;
    let totalReserved = 0;
    let totalDispatchable = 0;
    let totalValue = 0;
    let fastCount = 0;
    let slowCount = 0;
    let deadCount = 0;

    stock.forEach((s) => {
      totalReady += s.physicalQuantity;
      totalReserved += s.reservedQuantity;
      totalDispatchable += s.dispatchableQuantity;
      totalValue += s.physicalQuantity * (s.sellingPrice || s.unitCost || 0);

      if (s.agingBracket === '0-30') b0To30 += s.physicalQuantity;
      else if (s.agingBracket === '31-60') b31To60 += s.physicalQuantity;
      else if (s.agingBracket === '61-90') b61To90 += s.physicalQuantity;
      else if (s.agingBracket === '90+') b90Plus += s.physicalQuantity;

      if (s.movementSpeed === 'FAST') fastCount++;
      else if (s.movementSpeed === 'SLOW') slowCount++;
      else if (s.movementSpeed === 'DEAD') deadCount++;
    });

    return {
      bracket0To30: b0To30,
      bracket31To60: b31To60,
      bracket61To90: b61To90,
      bracket90Plus: b90Plus,
      totalReadyStock: totalReady,
      totalReservedStock: totalReserved,
      totalDispatchableStock: totalDispatchable,
      totalStockValue: totalValue,
      fastMovingCount: fastCount,
      slowMovingCount: slowCount,
      deadStockCount: deadCount,
    };
  }

  /**
   * Helper: Log Immutable Ledger Entry to inventory_transactions
   */
  static async logInventoryLedgerEntry(entry: {
    itemId: string;
    transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantityChange: number;
    balanceAfter: number;
    referenceType: string;
    referenceId?: string;
    notes?: string;
    performerName?: string;
  }): Promise<void> {
    const newTx: InventoryTransaction = {
      id: crypto.randomUUID(),
      itemId: entry.itemId,
      transactionType: entry.transactionType,
      quantityChange: entry.quantityChange,
      balanceAfter: entry.balanceAfter,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      notes: entry.notes,
      performerName: entry.performerName || 'Factory Manager',
      createdAt: new Date().toISOString(),
    };

    localInventoryTransactions.unshift(newTx);
    try {
      localStorage.setItem('factory_inventory_transactions', JSON.stringify(localInventoryTransactions));
    } catch {}

    if (isSupabaseConfigured && navigator.onLine && isUuid(entry.itemId)) {
      try {
        await supabase.from('inventory_transactions').insert({
          id: newTx.id,
          item_id: entry.itemId,
          transaction_type: entry.transactionType,
          quantity_change: entry.quantityChange,
          balance_after: entry.balanceAfter,
          reference_type: entry.referenceType,
          reference_id: entry.referenceId || null,
          notes: entry.notes || null,
          created_at: newTx.createdAt,
        });
      } catch (err) {
        console.warn('Supabase inventory ledger write error:', err);
      }
    }
  }

  static async processCustomerReturn(input: {
    customerId: string;
    customerName?: string;
    orderNumber: string;
    productId: string;
    setId: string;
    sizeId: string;
    returnedQuantity: number;
    qcPassedQuantity: number;
    qcDamagedQuantity: number;
    qcReworkQuantity: number;
    reason: string;
    inspectedBy: string;
  }): Promise<StockReturn> {
    const returnRecord: StockReturn = {
      id: crypto.randomUUID(),
      returnNumber: `RET-${Date.now().toString().slice(-6)}`,
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      customerName: input.customerName || 'Customer',
      productId: input.productId,
      setId: input.setId,
      sizeId: input.sizeId,
      returnedQuantity: input.returnedQuantity,
      qcPassedQuantity: input.qcPassedQuantity,
      qcDamagedQuantity: input.qcDamagedQuantity,
      qcReworkQuantity: input.qcReworkQuantity,
      qcStatus: input.qcPassedQuantity > 0 ? 'GOOD' : input.qcReworkQuantity > 0 ? 'REWORK' : 'DAMAGED',
      reason: input.reason,
      inspectedBy: input.inspectedBy,
      returnDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    localReturns.unshift(returnRecord);
    try {
      localStorage.setItem('factory_stock_returns', JSON.stringify(localReturns));
    } catch {}

    // If any items passed QC, credit them back to Finished Goods Ready Stock
    if (input.qcPassedQuantity > 0) {
      let targetStock = localFinishedStock.find(
        (s) => s.productId === input.productId && s.setId === input.setId && s.sizeId === input.sizeId
      );

      if (targetStock) {
        targetStock.physicalQuantity += input.qcPassedQuantity;
        targetStock.dispatchableQuantity += input.qcPassedQuantity;
        targetStock.updatedAt = new Date().toISOString();

        await this.logInventoryLedgerEntry({
          itemId: targetStock.id,
          transactionType: 'IN',
          quantityChange: input.qcPassedQuantity,
          balanceAfter: targetStock.physicalQuantity,
          referenceType: 'CUSTOMER_RETURN',
          referenceId: returnRecord.returnNumber,
          notes: `Customer return restocked: ${input.qcPassedQuantity} pcs passed QC. Reason: ${input.reason}`,
          performerName: input.inspectedBy,
        });

        if (isSupabaseConfigured && navigator.onLine && isUuid(targetStock.id)) {
          try {
            await supabase
              .from('inventory_items')
              .update({
                current_stock: targetStock.physicalQuantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetStock.id);
          } catch (err) {
            console.warn('Supabase stock update error on return:', err);
          }
        }
      }
      try {
        localStorage.setItem('factory_finished_goods_stock', JSON.stringify(localFinishedStock));
      } catch {}
    }

    return returnRecord;
  }

  static async getProductionRequirements(): Promise<ProductionRequirement[]> {
    return localRequirements;
  }

  static async getStockReturns(): Promise<StockReturn[]> {
    return localReturns;
  }

  static async getCartons(): Promise<Carton[]> {
    return localCartons;
  }
}

