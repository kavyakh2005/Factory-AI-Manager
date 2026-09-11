import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import {
  ProductionOrder,
  ProductionStage,
  ProductionEntry,
  RejectionReason,
  SizeWiseProductionSummary,
  ProductionDashboardData,
  Order,
  Set as GarmentSet,
  SetSize,
} from '../../types';
import { OrderService } from '../orders/orderService';

// Default Stages in Valid Sequential Garment Workflow
export const DEFAULT_PRODUCTION_STAGES: ProductionStage[] = [
  { id: 'stg-1', name: 'PLANNING', sequence: 1, description: 'Batch allocation, fabric sourcing & cutting plan', colorCode: '#8B5CF6', isSystem: true, status: 'ACTIVE' },
  { id: 'stg-2', name: 'CUTTING', sequence: 2, description: 'Layering, grading & fabric roll cutting', colorCode: '#EC4899', isSystem: true, status: 'ACTIVE' },
  { id: 'stg-3', name: 'STITCHING', sequence: 3, description: 'Line assembly, sewing & seam construction', colorCode: '#F59E0B', isSystem: true, status: 'ACTIVE' },
  { id: 'stg-4', name: 'FINISHING', sequence: 4, description: 'Thread trimming, washing & steam pressing', colorCode: '#06B6D4', isSystem: true, status: 'ACTIVE' },
  { id: 'stg-5', name: 'QUALITY CHECK', sequence: 5, description: 'Piece-by-piece inspection & measurement validation', colorCode: '#10B981', isSystem: true, status: 'ACTIVE' },
  { id: 'stg-6', name: 'PACKING', sequence: 6, description: 'Tagging, folding, polybag & carton packing', colorCode: '#6366F1', isSystem: true, status: 'ACTIVE' },
  { id: 'stg-7', name: 'READY', sequence: 7, description: 'Stored in finished goods bay, ready for dispatch', colorCode: '#14B8A6', isSystem: true, status: 'ACTIVE' },
];

export const DEFAULT_REJECTION_REASONS: RejectionReason[] = [
  { id: 'rej-1', name: 'Fabric Defect / Flaw', code: 'REJ-FAB-01', category: 'FABRIC', description: 'Yarn pull, holes, weaving flaw or laddering in roll', sortOrder: 1, isActive: true },
  { id: 'rej-2', name: 'Stitching / Seam Error', code: 'REJ-STC-02', category: 'STITCHING', description: 'Broken stitch, skipped stitch, tension puckering or open seam', sortOrder: 2, isActive: true },
  { id: 'rej-3', name: 'Sizing / Fit Deviation', code: 'REJ-SIZ-03', category: 'SIZING', description: 'Piece exceeds tolerance limit (+/- 0.5 inch)', sortOrder: 3, isActive: true },
  { id: 'rej-4', name: 'Color Shade Variation', code: 'REJ-COL-04', category: 'FABRIC', description: 'Panel-to-panel or batch dye lot mismatch', sortOrder: 4, isActive: true },
  { id: 'rej-5', name: 'Oil / Stain Mark', code: 'REJ-STN-05', category: 'FINISHING', description: 'Machine lubricant, dye stain, soil or handling mark', sortOrder: 5, isActive: true },
  { id: 'rej-6', name: 'Button / Trim Flaw', code: 'REJ-TRM-06', category: 'TRIMS', description: 'Broken button, misaligned zipper, missing eyelet', sortOrder: 6, isActive: true },
  { id: 'rej-7', name: 'Cutting Distortion', code: 'REJ-CUT-07', category: 'FABRIC', description: 'Misaligned pattern or notch cut error', sortOrder: 7, isActive: true },
  { id: 'rej-8', name: 'Ironing / Pressing Burn', code: 'REJ-PRS-08', category: 'FINISHING', description: 'Shine mark, scorching or steam press creasing fault', sortOrder: 8, isActive: true },
  { id: 'rej-9', name: 'Other Defect', code: 'REJ-OTH-09', category: 'GENERAL', description: 'Uncategorized factory floor fault', sortOrder: 9, isActive: true },
];

// In-Memory fallback store for instant offline responsiveness
let localProductionOrders: ProductionOrder[] = [];
try {
  const saved = localStorage.getItem('factory_production_orders');
  if (saved) {
    localProductionOrders = JSON.parse(saved);
  }
} catch {}

export class ProductionService {
  // 1. Fetch Stages
  static async getStages(): Promise<ProductionStage[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('production_stages')
          .select('*')
          .order('sequence', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((st) => ({
            id: st.id,
            name: st.name,
            sequence: st.sequence,
            description: st.description,
            colorCode: st.color_code || '#6366F1',
            isSystem: st.is_system,
            status: st.status || 'ACTIVE',
          }));
        }

        // Auto-seed stages if table exists but empty
        if (!error && (!data || data.length === 0)) {
          const stageInserts = DEFAULT_PRODUCTION_STAGES.map((st) => ({
            name: st.name,
            sequence: st.sequence,
            description: st.description,
            color_code: st.colorCode,
            is_system: true,
            status: 'ACTIVE',
          }));
          const { data: seeded } = await supabase.from('production_stages').insert(stageInserts).select();
          if (seeded && seeded.length > 0) {
            return seeded.map((st) => ({
              id: st.id,
              name: st.name,
              sequence: st.sequence,
              description: st.description,
              colorCode: st.color_code || '#6366F1',
              isSystem: st.is_system,
              status: st.status || 'ACTIVE',
            }));
          }
        }
      } catch (err) {
        console.warn('Supabase stage query failed, using default stages:', err);
      }
    }
    return DEFAULT_PRODUCTION_STAGES;
  }

  // 2. Fetch Rejection Reasons
  static async getRejectionReasons(): Promise<RejectionReason[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('rejection_reasons')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            id: r.id,
            name: r.name,
            code: r.code,
            category: r.category,
            description: r.description,
            sortOrder: r.sort_order,
            isActive: r.is_active,
          }));
        }

        // Auto-seed rejection reasons if empty
        if (!error && (!data || data.length === 0)) {
          const rejInserts = DEFAULT_REJECTION_REASONS.map((r) => ({
            name: r.name,
            code: r.code,
            category: r.category,
            description: r.description,
            sort_order: r.sortOrder,
            is_active: true,
          }));
          const { data: seededRej } = await supabase.from('rejection_reasons').insert(rejInserts).select();
          if (seededRej && seededRej.length > 0) {
            return seededRej.map((r) => ({
              id: r.id,
              name: r.name,
              code: r.code,
              category: r.category,
              description: r.description,
              sortOrder: r.sort_order,
              isActive: r.is_active,
            }));
          }
        }
      } catch (err) {
        console.warn('Supabase rejection reasons query failed, using default reasons:', err);
      }
    }
    return DEFAULT_REJECTION_REASONS;
  }

  // 3. Fetch Production Orders with full details and Size-Wise tracking
  static async getProductionOrders(filters?: { status?: string; stageId?: string; search?: string }): Promise<ProductionOrder[]> {
    const stages = await this.getStages();
    const products = await OrderService.getProducts();
    const sets = await OrderService.getSetsWithSizes();
    const orders = await OrderService.getOrders();

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('production_orders')
          .select('*, orders(*, customers(*)), products(*), sets(*), production_stages(*), production_entries(*, sizes(*), production_stages(*))')
          .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }
        if (filters?.stageId && filters?.stageId !== 'ALL') {
          query = query.eq('current_stage_id', filters.stageId);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          const mapped: ProductionOrder[] = data.map((po) => ({
            id: po.id,
            productionNumber: po.production_number,
            orderId: po.order_id,
            order: po.orders ? {
              ...po.orders,
              orderNumber: po.orders.order_number,
              customer: po.orders.customers,
            } : undefined,
            productId: po.product_id,
            product: po.products,
            variantId: po.variant_id,
            setId: po.set_id,
            set: po.sets,
            currentStageId: po.current_stage_id,
            currentStage: po.production_stages ? {
              id: po.production_stages.id,
              name: po.production_stages.name,
              sequence: po.production_stages.sequence,
              colorCode: po.production_stages.color_code,
              description: po.production_stages.description,
              isSystem: po.production_stages.is_system,
              status: po.production_stages.status,
            } : stages.find((s) => s.id === po.current_stage_id),
            totalPlannedQty: po.total_planned_qty,
            totalCompletedQty: po.total_completed_qty || 0,
            totalRejectedQty: po.total_rejected_qty || 0,
            startDate: po.start_date,
            targetCompletionDate: po.target_completion_date,
            actualCompletionDate: po.actual_completion_date,
            status: po.status,
            assignedTeam: po.assigned_team,
            notes: po.notes,
            createdAt: po.created_at,
            updatedAt: po.updated_at,
            entries: po.production_entries?.map((e: any) => ({
              id: e.id,
              productionOrderId: e.production_order_id,
              stageId: e.stage_id,
              stage: e.production_stages,
              sizeId: e.size_id,
              size: e.sizes,
              quantityPassed: e.quantity_passed,
              quantityRejected: e.quantity_rejected,
              rejectionReason: e.rejection_reason,
              operatorName: e.operator_name,
              entryDate: e.entry_date,
              notes: e.notes,
            })),
          }));

          localProductionOrders = mapped;
          try {
            localStorage.setItem('factory_production_orders', JSON.stringify(mapped));
          } catch {}

          return mapped;
        }
      } catch (err) {
        console.warn('Supabase production order query failed, using local cache:', err);
      }
    }

    // Auto-generate initial production batches from confirmed orders if none exist
    if (localProductionOrders.length === 0 && orders.length > 0) {
      const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'IN_PRODUCTION');
      if (confirmedOrders.length > 0) {
        const autoBatches: ProductionOrder[] = confirmedOrders.map((ord, idx) => {
          const firstItem = ord.orderItems?.[0];
          const prodObj = products.find((p) => p.id === firstItem?.productId) || products[0];
          const setObj = sets.find((s) => s.id === firstItem?.setId) || sets[0];
          const stage = stages[idx % Math.min(3, stages.length)] || stages[0];

          const plannedSizes: Record<string, number> = {};
          ord.orderItems?.forEach((item) => {
            plannedSizes[item.sizeId] = item.quantity;
          });

          return {
            id: `prod-auto-${ord.id}`,
            productionNumber: `PROD-2026-${(101 + idx).toString().padStart(4, '0')}`,
            orderId: ord.id,
            order: ord,
            productId: prodObj?.id || '',
            product: prodObj,
            variantId: firstItem?.variantId || 'Navy Blue',
            setId: setObj?.id || '',
            set: setObj,
            currentStageId: stage.id,
            currentStage: stage,
            totalPlannedQty: ord.totalQuantity,
            totalCompletedQty: stage.sequence > 1 ? Math.round(ord.totalQuantity * 0.4) : 0,
            totalRejectedQty: 0,
            startDate: ord.orderDate || new Date().toISOString(),
            targetCompletionDate: ord.deliveryDate || new Date(Date.now() + 86400000 * 5).toISOString(),
            status: 'IN_PROGRESS',
            assignedTeam: `Floor Line ${idx + 1}`,
            notes: `Auto-scheduled from Order ${ord.orderNumber}`,
            createdAt: ord.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            entries: [],
            plannedSizes,
          };
        });

        localProductionOrders = autoBatches;
        try {
          localStorage.setItem('factory_production_orders', JSON.stringify(autoBatches));
        } catch {}
      }
    }

    // Local / In-memory Fallback
    let result = localProductionOrders.map((po) => {
      const ord = orders.find((o) => o.id === po.orderId) || po.order;
      const prd = products.find((p) => p.id === po.productId) || po.product;
      const setObj = sets.find((s) => s.id === po.setId) || po.set;
      const stg = stages.find((s) => s.id === po.currentStageId || s.name === po.currentStage?.name) || po.currentStage || stages[0];

      return {
        ...po,
        order: ord,
        product: prd,
        set: setObj,
        currentStage: stg,
      };
    });

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters?.stageId && filters?.stageId !== 'ALL') {
      result = result.filter((p) => p.currentStageId === filters.stageId || p.currentStage?.name === filters.stageId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.productionNumber.toLowerCase().includes(q) ||
          p.product?.name.toLowerCase().includes(q) ||
          p.order?.orderNumber.toLowerCase().includes(q) ||
          p.order?.customer?.name.toLowerCase().includes(q)
      );
    }

    return result;
  }

  // 4. Calculate Size-Wise Breakdown for a Batch
  static calculateSizeWiseBreakdown(
    productionOrder: ProductionOrder,
    setWithSizes: GarmentSet
  ): SizeWiseProductionSummary[] {
    const plannedSizesMap = productionOrder.plannedSizes || {};
    const entries = productionOrder.entries || [];

    return (setWithSizes.setSizes || []).map((ss) => {
      const sizeId = ss.sizeId;
      const sizeName = ss.size?.name || sizeId;
      const seq = ss.sequence || 0;

      // Ordered / Planned Quantity
      const orderedQty = productionOrder.order?.orderItems?.find((oi) => oi.sizeId === sizeId)?.quantity || 0;
      const plannedQty = plannedSizesMap[sizeId] !== undefined ? plannedSizesMap[sizeId] : orderedQty;

      // Produced & Rejected across entries
      let totalProducedForSize = 0;
      let totalRejectedForSize = 0;

      entries.forEach((e) => {
        if (e.sizeId === sizeId) {
          totalProducedForSize += e.quantityPassed || 0;
          totalRejectedForSize += e.quantityRejected || 0;
        }
      });

      // Remaining Quantity = Planned Quantity - Good Quantity
      const goodQty = Math.max(0, totalProducedForSize - totalRejectedForSize);
      const remainingQty = Math.max(0, plannedQty - goodQty);

      return {
        sizeId,
        sizeName,
        sequence: seq,
        orderedQuantity: orderedQty,
        plannedQuantity: plannedQty,
        producedQuantity: totalProducedForSize,
        rejectedQuantity: totalRejectedForSize,
        goodQuantity: goodQty,
        remainingQuantity: remainingQty,
      };
    });
  }

  // Helper alias for modals accepting allSets list
  static calculateSizeWiseMatrix(
    productionOrder: ProductionOrder,
    allSets: GarmentSet[] | GarmentSet
  ): SizeWiseProductionSummary[] {
    const setObj = Array.isArray(allSets)
      ? (allSets.find((s) => s.id === productionOrder.setId) || productionOrder.set || allSets[0])
      : allSets;

    if (!setObj) return [];
    return this.calculateSizeWiseBreakdown(productionOrder, setObj);
  }

  // 5. Compute Production Dashboard Metrics
  static async getDashboardMetrics(): Promise<ProductionDashboardData> {
    const stages = await this.getStages();
    const productionOrders = await this.getProductionOrders();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let totalActiveOrders = 0;
    let todayPlannedQty = 0;
    let todayProducedQty = 0;
    let totalPendingQty = 0;
    let totalRejectedQty = 0;
    const stageCounts: Record<string, number> = {};

    stages.forEach((st) => {
      stageCounts[st.name] = 0;
    });

    const delayedOrders: ProductionOrder[] = [];

    productionOrders.forEach((po) => {
      const isCompleted = po.status === 'COMPLETED' || po.currentStage?.name === 'READY';
      if (!isCompleted && po.status !== 'CANCELLED') {
        totalActiveOrders++;
      }

      if (po.currentStage) {
        stageCounts[po.currentStage.name] = (stageCounts[po.currentStage.name] || 0) + 1;
      }

      const pending = Math.max(0, po.totalPlannedQty - (po.totalCompletedQty || 0));
      totalPendingQty += pending;
      totalRejectedQty += po.totalRejectedQty || 0;

      // Target Planned Pieces
      if (!isCompleted && po.status !== 'CANCELLED') {
        todayPlannedQty += Math.round(po.totalPlannedQty * 0.25) || po.totalPlannedQty;
      }

      // Rule-Based Delay Detection:
      const targetDate = new Date(po.targetCompletionDate);
      const deliveryDate = po.order ? new Date(po.order.deliveryDate) : targetDate;
      const isOverdue = (targetDate < new Date() || deliveryDate < new Date()) && !isCompleted;

      const orderAge = Date.now() - new Date(po.startDate).getTime();
      const totalDuration = targetDate.getTime() - new Date(po.startDate).getTime();
      const isBehindCapacity = totalDuration > 0 && orderAge / totalDuration > 0.5 && (po.totalCompletedQty || 0) / po.totalPlannedQty < 0.25;

      if (isOverdue || isBehindCapacity) {
        delayedOrders.push(po);
      }

      // Compute today's produced pieces from entries
      po.entries?.forEach((entry) => {
        if (new Date(entry.entryDate) >= todayStart) {
          todayProducedQty += entry.quantityPassed || 0;
        }
      });
    });

    return {
      metrics: {
        totalActiveOrders,
        todayPlannedQty,
        todayProducedQty,
        totalPendingQty,
        totalRejectedQty,
        delayedCount: delayedOrders.length,
        stageCounts,
      },
      stages,
      productionOrders,
      delayedOrders,
    };
  }

  // 6. Create Production Plan from Confirmed Order Item
  static async createProductionPlan(params: {
    orderId?: string;
    productId: string;
    variantId?: string;
    setId: string;
    plannedSizes: Record<string, number>;
    targetCompletionDate: string;
    assignedTeam?: string;
    notes?: string;
  }): Promise<ProductionOrder> {
    const stages = await this.getStages();
    const planningStage = stages.find((s) => s.sequence === 1) || stages[0];

    const totalPlannedQty = Object.values(params.plannedSizes).reduce((a, b) => a + (Number(b) || 0), 0);
    const productionNumber = `PROD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const newProdOrder: ProductionOrder = {
      id: crypto.randomUUID(),
      productionNumber,
      orderId: params.orderId,
      productId: params.productId,
      variantId: params.variantId,
      setId: params.setId,
      currentStageId: planningStage.id,
      currentStage: planningStage,
      totalPlannedQty,
      totalCompletedQty: 0,
      totalRejectedQty: 0,
      startDate: new Date().toISOString(),
      targetCompletionDate: params.targetCompletionDate,
      status: 'IN_PROGRESS',
      assignedTeam: params.assignedTeam || 'Floor Line 1',
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: [],
      plannedSizes: params.plannedSizes,
    };

    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { error } = await supabase.from('production_orders').insert({
          id: newProdOrder.id,
          production_number: newProdOrder.productionNumber,
          order_id: isUuid(newProdOrder.orderId) ? newProdOrder.orderId : null,
          product_id: newProdOrder.productId,
          variant_id: isUuid(newProdOrder.variantId) ? newProdOrder.variantId : null,
          set_id: newProdOrder.setId,
          current_stage_id: isUuid(newProdOrder.currentStageId) ? newProdOrder.currentStageId : null,
          total_planned_qty: newProdOrder.totalPlannedQty,
          total_completed_qty: 0,
          total_rejected_qty: 0,
          start_date: newProdOrder.startDate,
          target_completion_date: newProdOrder.targetCompletionDate,
          status: newProdOrder.status,
          assigned_team: newProdOrder.assignedTeam,
          notes: newProdOrder.notes,
        });

        if (error) throw error;

        // If linked to an order, update order status to IN_PRODUCTION
        if (params.orderId) {
          await supabase.from('orders').update({ status: 'IN_PRODUCTION' }).eq('id', params.orderId);
        }

        // Audit Log
        await supabase.from('audit_logs').insert({
          action: 'CREATE_PRODUCTION_PLAN',
          entity: 'ProductionOrder',
          entity_id: newProdOrder.id,
          new_value: {
            production_number: newProdOrder.productionNumber,
            total_planned_qty: newProdOrder.totalPlannedQty,
            assigned_team: newProdOrder.assignedTeam,
          },
        });
      } catch (err) {
        console.warn('Supabase production order creation failed, enqueuing offline mutation:', err);
        await LocalStorageManager.enqueueOfflineMutation('production_entries', 'INSERT', newProdOrder as unknown as Record<string, unknown>);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('production_entries', 'INSERT', newProdOrder as unknown as Record<string, unknown>);
    }

    localProductionOrders.unshift(newProdOrder);
    try {
      localStorage.setItem('factory_production_orders', JSON.stringify(localProductionOrders));
    } catch {}

    return newProdOrder;
  }

  // 7. Log Daily Production Entry & Rejections
  static async logProductionEntry(params: {
    productionOrderId: string;
    stageId: string;
    entries: Array<{
      sizeId: string;
      quantityPassed: number;
      quantityRejected: number;
      rejectionReason?: string;
    }>;
    operatorName?: string;
    notes?: string;
  }): Promise<void> {
    const prodOrder = localProductionOrders.find((p) => p.id === params.productionOrderId);

    let batchPassed = 0;
    let batchRejected = 0;
    const newEntryObjects: ProductionEntry[] = [];

    params.entries.forEach((row) => {
      if (row.quantityPassed > 0 || row.quantityRejected > 0) {
        batchPassed += row.quantityPassed;
        batchRejected += row.quantityRejected;

        const entry: ProductionEntry = {
          id: crypto.randomUUID(),
          productionOrderId: params.productionOrderId,
          stageId: params.stageId,
          sizeId: row.sizeId,
          quantityPassed: row.quantityPassed,
          quantityRejected: row.quantityRejected,
          rejectionReason: row.rejectionReason,
          operatorName: params.operatorName || 'Floor Operator',
          entryDate: new Date().toISOString(),
          notes: params.notes,
        };
        newEntryObjects.push(entry);
      }
    });

    if (prodOrder) {
      prodOrder.totalCompletedQty = (prodOrder.totalCompletedQty || 0) + batchPassed;
      prodOrder.totalRejectedQty = (prodOrder.totalRejectedQty || 0) + batchRejected;
      prodOrder.entries = [...(prodOrder.entries || []), ...newEntryObjects];
      prodOrder.updatedAt = new Date().toISOString();
      try {
        localStorage.setItem('factory_production_orders', JSON.stringify(localProductionOrders));
      } catch {}
    }

    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const inserts = newEntryObjects.map((e) => ({
          id: e.id,
          production_order_id: isUuid(e.productionOrderId) ? e.productionOrderId : null,
          stage_id: isUuid(e.stageId) ? e.stageId : null,
          size_id: isUuid(e.sizeId) ? e.sizeId : null,
          quantity_passed: e.quantityPassed,
          quantity_rejected: e.quantityRejected,
          rejection_reason: e.rejectionReason || null,
          operator_name: e.operatorName,
          entry_date: e.entryDate,
          notes: e.notes || null,
        }));

        if (inserts.length > 0 && inserts[0].production_order_id) {
          const { error: entryErr } = await supabase.from('production_entries').insert(inserts);
          if (entryErr) throw entryErr;
        }

        // Update totals on production order
        if (prodOrder && isUuid(params.productionOrderId)) {
          await supabase.from('production_orders').update({
            total_completed_qty: prodOrder.totalCompletedQty,
            total_rejected_qty: prodOrder.totalRejectedQty,
            updated_at: new Date().toISOString(),
          }).eq('id', params.productionOrderId);
        }

        // Audit Log
        await supabase.from('audit_logs').insert({
          action: 'LOG_PRODUCTION_ENTRY',
          entity: 'ProductionEntry',
          entity_id: params.productionOrderId,
          new_value: {
            passed: batchPassed,
            rejected: batchRejected,
            operator: params.operatorName,
          },
        });
      } catch (err) {
        console.warn('Supabase entry write failed, queuing offline mutation:', err);
        await LocalStorageManager.enqueueOfflineMutation('production_entries', 'INSERT', {
          productionOrderId: params.productionOrderId,
          entries: newEntryObjects,
        });
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('production_entries', 'INSERT', {
        productionOrderId: params.productionOrderId,
        entries: newEntryObjects,
      });
    }
  }

  // 8. Advance Stage along the 7-Stage Workflow Pipeline
  static async advanceStage(
    productionOrderId: string,
    targetStageId: string,
    notes?: string
  ): Promise<void> {
    const stages = await this.getStages();
    const prodOrder = localProductionOrders.find((p) => p.id === productionOrderId);
    const targetStage = stages.find((s) => s.id === targetStageId || s.name === targetStageId);

    if (!targetStage) throw new Error('Invalid target production stage');

    if (prodOrder) {
      prodOrder.currentStageId = targetStage.id;
      prodOrder.currentStage = targetStage;
      prodOrder.updatedAt = new Date().toISOString();

      if (targetStage.name === 'READY') {
        prodOrder.status = 'COMPLETED';
        prodOrder.actualCompletionDate = new Date().toISOString();

        // Update underlying order to READY_FOR_DISPATCH
        if (prodOrder.orderId) {
          await OrderService.updateOrderStatus(prodOrder.orderId, 'READY_FOR_DISPATCH');
        }
      }

      try {
        localStorage.setItem('factory_production_orders', JSON.stringify(localProductionOrders));
      } catch {}
    }

    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (isSupabaseConfigured && navigator.onLine && isUuid(productionOrderId)) {
      try {
        const updatePayload: Record<string, unknown> = {
          current_stage_id: isUuid(targetStage.id) ? targetStage.id : null,
          updated_at: new Date().toISOString(),
        };

        if (targetStage.name === 'READY') {
          updatePayload.status = 'COMPLETED';
          updatePayload.actual_completion_date = new Date().toISOString();
        }

        await supabase.from('production_orders').update(updatePayload).eq('id', productionOrderId);

        // Audit Log
        await supabase.from('audit_logs').insert({
          action: 'ADVANCE_PRODUCTION_STAGE',
          entity: 'ProductionOrder',
          entity_id: productionOrderId,
          new_value: { stage: targetStage.name },
        });
      } catch (err) {
        console.warn('Supabase stage advance failed, enqueuing offline mutation:', err);
      }
    }
  }

  static async getProductionStats(): Promise<{
    totalPlannedQuantity: number;
    totalProducedQuantity: number;
    totalRejectedQuantity: number;
    totalRemainingQuantity: number;
    rejectionRate: number;
  }> {
    const list = await this.getProductionOrders();
    let planned = 0;
    let produced = 0;
    let rejected = 0;

    for (const po of list) {
      planned += po.totalPlannedQty || (po as any).plannedQuantity || 0;
      produced += po.totalCompletedQty || (po as any).producedQuantity || 0;
      rejected += po.totalRejectedQty || (po as any).rejectedQuantity || 0;
    }

    const remaining = Math.max(0, planned - produced);
    const rejectionRate = (produced + rejected) > 0 ? Number(((rejected / (produced + rejected)) * 100).toFixed(1)) : 0;

    return {
      totalPlannedQuantity: planned,
      totalProducedQuantity: produced,
      totalRejectedQuantity: rejected,
      totalRemainingQuantity: remaining,
      rejectionRate,
    };
  }

  static async getDelayedProductionOrders(): Promise<ProductionOrder[]> {
    const list = await this.getProductionOrders();
    const today = new Date().toISOString().slice(0, 10);
    return list.filter((p) => {
      const targetDate = p.targetCompletionDate || (p as any).deliveryDate;
      return targetDate && targetDate < today && p.status !== 'COMPLETED' && p.status !== 'CANCELLED';
    });
  }

  static async getStageSummary(): Promise<Array<{ stageName: string; activeOrdersCount: number }>> {
    const orders = await this.getProductionOrders();
    const stages = DEFAULT_PRODUCTION_STAGES;

    return stages.map((stg: ProductionStage) => {
      const activeCount = orders.filter((o: ProductionOrder) => (o.currentStageId === stg.id || o.currentStage?.name === stg.name) && o.status !== 'COMPLETED').length;
      return {
        stageName: stg.name,
        activeOrdersCount: activeCount,
      };
    });
  }
}


