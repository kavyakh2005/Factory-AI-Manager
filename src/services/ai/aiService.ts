import { OrderService } from '../orders/orderService';
import { ProductionService } from '../production/productionService';
import { InventoryService } from '../inventory/inventoryService';
import { PaymentService } from '../payments/paymentService';
import { SupplierService } from '../suppliers/supplierService';
import { CustomerService } from '../customers/customerService';
import { ProductService } from '../products/productService';
import { FinishedGoodsService } from '../inventory/finishedGoodsService';
import {
  Order,
  InventoryItem,
  Product,
  ProductionOrder,
  Set as GarmentSet,
  FinishedGoodsStock,
  StockAgingSummary,
} from '../../types';

export interface AiChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  dataCard?: {
    title: string;
    metrics: Array<{ label: string; value: string | number; color?: string }>;
    linkUrl?: string;
  };
}

export interface ExecutiveBriefing {
  generatedAt: string;
  factoryHealthScore: number; // 0 - 100
  headline: string;
  executiveSummary: string;
  topPriorities: Array<{
    title: string;
    description: string;
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    actionLink: string;
  }>;
  operationalMetrics: {
    activeOrdersCount: number;
    totalOrderPieces: number;
    delayedOrdersCount: number;
    dailyProductionTarget: number;
    completedProductionPieces: number;
    qcRejectionRatePercent: number;
    lowStockMaterialsCount: number;
    uncollectedReceivables: number;
    pendingSupplierPayables: number;
  };
  aiBottleneckDiagnosis: string;
}

export interface FabricEstimationResult {
  productName: string;
  totalPieces: number;
  estimatedFabricMeters: number;
  metersPerPiece: number;
  fabricType: string;
  estimatedCost: number;
  sizeBreakdown: Array<{ size: string; quantity: number; fabricMeters: number }>;
  recommendedCuttingBatches: number;
  estimatedProductionDays: number;
}

export interface QualityAnalysisResult {
  totalDefectsLogged: number;
  overallRejectionRate: number;
  topDefectReasons: Array<{ reason: string; count: number; percentage: number }>;
  stageWiseDefectDistribution: Array<{ stageName: string; defectCount: number }>;
  rootCauseInsights: string[];
  correctiveActionPlan: string[];
}

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-1.5-flash',
];

export class AiService {
  public static getGeminiApiKey(): string | null {
    // 1. From local settings storage
    try {
      const storedKey = localStorage.getItem('factory_gemini_api_key');
      if (storedKey && storedKey.trim()) return storedKey.trim();
    } catch {}

    // 2. From factory_app_settings (Saved via Settings -> AI Manager Config)
    try {
      const appSettingsStr = localStorage.getItem('factory_app_settings');
      if (appSettingsStr) {
        const appSettings = JSON.parse(appSettingsStr);
        if (appSettings.aiApiKey && appSettings.aiApiKey.trim()) {
          return appSettings.aiApiKey.trim();
        }
      }
    } catch {}

    // 3. From environment variables (.env)
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && !envKey.includes('your-') && envKey.length > 5) {
      return envKey.trim();
    }

    return null;
  }

  public static setCustomApiKey(key: string) {
    if (key && key.trim()) {
      localStorage.setItem('factory_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('factory_gemini_api_key');
    }
  }

  public static hasApiKey(): boolean {
    return Boolean(this.getGeminiApiKey());
  }

  /**
   * Helper to execute Gemini Generative Language API call with model fallback
   */
  private static async callGemini(params: {
    systemInstruction?: string;
    prompt?: string;
    contents?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<string | null> {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) return null;

    const contents = params.contents || [
      {
        role: 'user',
        parts: [{ text: params.prompt || '' }],
      },
    ];

    for (const model of GEMINI_MODELS) {
      try {
        const body: Record<string, unknown> = {
          contents,
          generationConfig: {
            temperature: params.temperature ?? 0.3,
            maxOutputTokens: params.maxOutputTokens ?? 1000,
          },
        };

        if (params.systemInstruction) {
          body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text;
          }
        }
      } catch {
        // Try next model
      }
    }
    return null;
  }

  /**
   * Compiles complete factory ground truth context from all Supabase services
   */
  public static async compileLiveDatabaseContext(): Promise<string> {
    try {
      const [
        orders,
        prodStats,
        delayedOrders,
        delayedProd,
        lowStock,
        financial,
        products,
        stages,
        suppliers,
        finishedStock,
        stockAging,
        requirements,
      ] = await Promise.all([
        OrderService.getOrders(),
        ProductionService.getProductionStats(),
        OrderService.getDelayedOrders(),
        ProductionService.getDelayedProductionOrders(),
        InventoryService.getLowStockAlerts(),
        PaymentService.getFinancialSummary(),
        ProductService.getProducts(),
        ProductionService.getStageSummary(),
        SupplierService.getSuppliers(),
        FinishedGoodsService.getFinishedGoodsStock(),
        FinishedGoodsService.getStockAgingReport(),
        FinishedGoodsService.getProductionRequirements(),
      ]);

      const activeOrders = orders.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
      const totalOrderPcs = activeOrders.reduce((s: number, o: Order) => s + (o.totalQuantity || 0), 0);

      const context = `
=== SHREE RAAS KRISHNAM CREATION - FACTORY LIVE DATABASE CONTEXT ===
Date/Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Factory: Shree Raas Krishnam Creation (Garment Manufacturing)
Workflow: Hybrid Ready-Stock (Make-to-Stock) + Replenishment Architecture
Hierarchy: Product -> Product Sets (Standard 38-46, Extra 48-52) -> Set Sizes -> Quantity

1. READY FINISHED GOODS STOCK (Saleable Warehoused Stock):
- Total Physical Stock in Warehouse: ${stockAging.totalReadyStock.toLocaleString('en-IN')} pcs (Value: ₹${Math.round(stockAging.totalStockValue).toLocaleString('en-IN')})
- Total Reserved for Active Orders: ${stockAging.totalReservedStock.toLocaleString('en-IN')} pcs
- Total Dispatchable (Available to Sell): ${stockAging.totalDispatchableStock.toLocaleString('en-IN')} pcs
- Stock Aging Breakdown: 0-30 Days: ${stockAging.bracket0To30} pcs | 31-60 Days: ${stockAging.bracket31To60} pcs | 61-90 Days: ${stockAging.bracket61To90} pcs | 90+ Days: ${stockAging.bracket90Plus} pcs
- Fast-Moving Styles: ${stockAging.fastMovingCount} | Slow/Aging: ${stockAging.slowMovingCount} | Dead: ${stockAging.deadStockCount}
${finishedStock.length > 0 ? finishedStock.slice(0, 10).map((s: FinishedGoodsStock) => `  * ${s.productName || 'Garment'} [Size: ${s.sizeName}]: Physical: ${s.physicalQuantity}, Reserved: ${s.reservedQuantity}, Dispatchable: ${s.dispatchableQuantity} pcs (Age: ${s.stockAgeDays || 0}d, Speed: ${s.movementSpeed})`).join('\n') : '  * (No finished goods stock records logged yet)'}

2. WORK IN PROGRESS (WIP) BY PRODUCTION STAGE (NOT Saleable Ready Stock):
${stages.map((stg) => `  * ${stg.stageName}: ${stg.activeOrdersCount} batches active in line`).join('\n')}
- Total Good Output Finished: ${prodStats.totalProducedQuantity.toLocaleString('en-IN')} pcs
- Total WIP in Shop-Floor: ${prodStats.totalRemainingQuantity.toLocaleString('en-IN')} pcs
- QC Defect Rejection Rate: ${prodStats.rejectionRate}% (${prodStats.totalRejectedQuantity} pcs rejected)

3. CUSTOMER ORDERS & ALLOCATION:
- Active Orders: ${activeOrders.length} (${totalOrderPcs.toLocaleString('en-IN')} pcs)
- Delayed/Overdue Orders: ${delayedOrders.length}
- Shortage Replenishment Requirements: ${requirements.filter((r) => r.status === 'PENDING').length} pending requests (${requirements.filter((r) => r.status === 'PENDING').reduce((s, r) => s + r.remainingQuantity, 0)} pcs)

4. INVENTORY & FINANCIALS:
- Low Stock Raw Materials Below Threshold: ${lowStock.length} items
- Market Customer Receivables Due: ₹${Math.round(financial.netReceivable).toLocaleString('en-IN')}
- Vendor Payables Pending: ₹${Math.round(financial.netPayable).toLocaleString('en-IN')}
- Bank Cash Collections: ₹${Math.round(financial.totalReceived).toLocaleString('en-IN')}
===================================================================
`;
      return context;
    } catch (err) {
      console.warn('Failed to compile live database context:', err);
      return 'Factory database context temporarily unavailable.';
    }
  }

  /**
   * Generates AI response using Google Gemini LLM with factory RAG context
   */
  public static async generateAiResponse(
    userPrompt: string,
    chatHistory: Array<{ role: 'user' | 'model'; text: string }> = []
  ): Promise<{ text: string; dataCard?: AiChatMessage['dataCard'] }> {
    const liveContext = await this.compileLiveDatabaseContext();

    const systemInstruction = `You are the Expert AI Factory Manager & Chief Operating Officer Assistant for Shree Raas Krishnam Creation (a garment manufacturing factory).
You operate under a HYBRID READY-STOCK (MAKE-TO-STOCK) factory model.
Production batches run independently before customer orders arrive.
Customer orders consume Ready Stock, creating reservations.
WIP (Cutting, Stitching, Washing, Finishing, QC) is NEVER counted as available customer stock.
You have real-time access to the live PostgreSQL database context provided below.
Rules:
1. Always use factual numbers, order numbers, and size breakdowns from the provided database context.
2. Clearly distinguish Physical Stock vs Reserved Stock vs Dispatchable Stock vs WIP.
3. You can answer in fluent English, Hindi, or Hinglish based on the user's query language.
4. If asked about size availability (e.g. "42 size ka kitna ready maal hai?"), provide the exact dispatchable, physical, and reserved numbers.
5. If the database is currently empty (0 records), state clearly that no records exist yet and offer to help guide them in creating their first order or production batch. Never invent fake data.

${liveContext}`;

    const contents = [
      ...chatHistory.map((h) => ({
        role: h.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: h.text }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: userPrompt }],
      },
    ];

    const geminiText = await this.callGemini({
      systemInstruction,
      contents,
      temperature: 0.25,
      maxOutputTokens: 800,
    });

    if (geminiText) {
      const card = await this.extractRelevantDataCard(userPrompt);
      return { text: geminiText, dataCard: card };
    }

    // Heuristic Deterministic RAG Fallback Engine
    return this.generateHeuristicRagResponse(userPrompt);
  }

  private static async extractRelevantDataCard(userPrompt: string): Promise<AiChatMessage['dataCard'] | undefined> {
    const q = userPrompt.toLowerCase();
    if (q.includes('ready stock') || q.includes('ready maal') || q.includes('stock mein') || q.includes('size')) {
      const stock = await FinishedGoodsService.getFinishedGoodsStock();
      if (stock.length > 0) {
        return {
          title: 'Ready Finished Goods Stock',
          metrics: stock.slice(0, 5).map((s) => ({
            label: `${s.productName} (${s.sizeName})`,
            value: `Available: ${s.dispatchableQuantity} pcs (Total: ${s.physicalQuantity})`,
            color: s.dispatchableQuantity > 0 ? 'text-emerald-400' : 'text-red-400',
          })),
          linkUrl: '/inventory',
        };
      }
    }
    return undefined;
  }

  /**
   * Deterministic Heuristic RAG Engine
   */
  private static async generateHeuristicRagResponse(
    userPrompt: string
  ): Promise<{ text: string; dataCard?: AiChatMessage['dataCard'] }> {
    const q = userPrompt.toLowerCase();

    // 1. Ready Stock & Size-Wise Queries
    if (q.includes('ready') || q.includes('ready maal') || q.includes('stock') || q.includes('size') || q.includes('kitna maal')) {
      const stockList = await FinishedGoodsService.getFinishedGoodsStock();
      const aging = await FinishedGoodsService.getStockAgingReport();

      if (stockList.length === 0 && aging.totalReadyStock === 0) {
        return {
          text: 'Warehouse Ready Stock Status: Currently 0 physical pieces in finished goods warehouse. Sabhi ready-stock batch inventory zero hai. Aap Production module mein jakar naya batch create kar sakte hain.',
        };
      }

      // Check if specific size queried (e.g. "42 size", "38 size", "40 size")
      const sizeMatch = q.match(/\b(38|40|42|44|46|48|50|52|xs|s|m|l|xl|xxl)\b/i);
      if (sizeMatch) {
        const queriedSize = sizeMatch[1].toUpperCase();
        const matchingStock = stockList.filter((s) => s.sizeName?.toUpperCase() === queriedSize || s.sizeId.includes(queriedSize));
        const totalPhysical = matchingStock.reduce((a, b) => a + b.physicalQuantity, 0);
        const totalReserved = matchingStock.reduce((a, b) => a + b.reservedQuantity, 0);
        const totalDispatchable = matchingStock.reduce((a, b) => a + b.dispatchableQuantity, 0);

        return {
          text: `Size ${queriedSize} Ready Stock Status:\n• Physical Stock in Warehouse: ${totalPhysical} pcs\n• Reserved for Active Orders: ${totalReserved} pcs\n• Dispatchable (Available to Sell): ${totalDispatchable} pcs\n\nWIP floor pieces (Cutting/Stitching) are tracked separately and not counted in this saleable stock.`,
          dataCard: {
            title: `Size ${queriedSize} Stock Breakdown`,
            metrics: [
              { label: 'Dispatchable Stock', value: `${totalDispatchable} pcs`, color: 'text-emerald-400' },
              { label: 'Reserved Stock', value: `${totalReserved} pcs`, color: 'text-amber-400' },
              { label: 'Physical Stock', value: `${totalPhysical} pcs`, color: 'text-indigo-300' },
            ],
            linkUrl: '/inventory',
          },
        };
      }

      return {
        text: `Ready Finished Goods Warehouse Summary:\n• Total Physical Stock: ${aging.totalReadyStock.toLocaleString('en-IN')} pcs\n• Reserved for Orders: ${aging.totalReservedStock.toLocaleString('en-IN')} pcs\n• Dispatchable Stock: ${aging.totalDispatchableStock.toLocaleString('en-IN')} pcs\n• Warehouse Stock Valuation: ₹${Math.round(aging.totalStockValue).toLocaleString('en-IN')}`,
        dataCard: {
          title: 'Ready Stock Overview',
          metrics: [
            { label: 'Dispatchable Stock', value: `${aging.totalDispatchableStock.toLocaleString('en-IN')} pcs`, color: 'text-emerald-400' },
            { label: 'Reserved Stock', value: `${aging.totalReservedStock.toLocaleString('en-IN')} pcs`, color: 'text-amber-400' },
            { label: 'Physical Stock', value: `${aging.totalReadyStock.toLocaleString('en-IN')} pcs`, color: 'text-indigo-300' },
          ],
          linkUrl: '/inventory',
        },
      };
    }

    // 2. Delayed & Overdue Orders
    if (q.includes('delayed') || q.includes('late') || q.includes('overdue') || q.includes('pending delivery')) {
      const delayed = await OrderService.getDelayedOrders();
      if (delayed.length === 0) {
        return {
          text: 'Factory Delivery Status: Zero delayed orders in system. All running orders are on track.',
        };
      }
      return {
        text: `Alert: There are ${delayed.length} order(s) past their delivery deadline. Immediate dispatch priority recommended:`,
        dataCard: {
          title: 'Live Overdue Orders (Real Database)',
          metrics: delayed.slice(0, 5).map((o: Order) => ({
            label: `Order #${o.orderNumber} - ${o.customer?.name || 'Customer'}`,
            value: `${o.totalQuantity} pcs | Due: ${o.deliveryDate}`,
            color: 'text-red-400',
          })),
          linkUrl: '/orders',
        },
      };
    }

    // 3. Raw Material Low Stock
    if (q.includes('fabric') || q.includes('raw material') || q.includes('material') || q.includes('khatam')) {
      const lowStock = await InventoryService.getLowStockAlerts();
      if (lowStock.length === 0) {
        return {
          text: 'Sabhi fabrics, trims aur packaging items safety stock threshold se upar hain. Zero raw material shortages detected.',
        };
      }
      return {
        text: `Stock Ledger Alert: Following ${lowStock.length} item(s) are below safety reorder threshold:`,
        dataCard: {
          title: 'Live Low Stock Items (Stock Ledger)',
          metrics: lowStock.map((i: InventoryItem) => ({
            label: `${i.name} [${i.sku}]`,
            value: `${i.currentStock} ${i.unit} (Safety Min: ${i.minimumStockThreshold || 10} ${i.unit})`,
            color: 'text-amber-400',
          })),
          linkUrl: '/inventory',
        },
      };
    }

    // 4. Production Output & Rejections
    if (q.includes('production') || q.includes('output') || q.includes('pieces bani') || q.includes('cutting') || q.includes('stitching') || q.includes('finishing')) {
      const stats = await ProductionService.getProductionStats();
      const stages = await ProductionService.getStageSummary();
      return {
        text: `Shop-Floor WIP & Production Status:\n• Total Planned Target: ${stats.totalPlannedQuantity.toLocaleString('en-IN')} pcs\n• Good Pieces Finished: ${stats.totalProducedQuantity.toLocaleString('en-IN')} pcs\n• WIP in Shop-Floor: ${stats.totalRemainingQuantity.toLocaleString('en-IN')} pcs\n• QC Rejection Rate: ${stats.rejectionRate}% (${stats.totalRejectedQuantity} pcs)\n\nWIP Stage Breakdown:\n${stages.map((s) => `• ${s.stageName}: ${s.activeOrdersCount} batches active`).join('\n')}`,
        dataCard: {
          title: 'Shop-Floor Production Targets',
          metrics: [
            { label: 'Planned Target', value: `${stats.totalPlannedQuantity.toLocaleString('en-IN')} pcs` },
            { label: 'Good Output Finished', value: `${stats.totalProducedQuantity.toLocaleString('en-IN')} pcs`, color: 'text-emerald-400' },
            { label: 'WIP in Floor', value: `${stats.totalRemainingQuantity.toLocaleString('en-IN')} pcs`, color: 'text-indigo-300' },
            { label: 'QC Rejection Rate', value: `${stats.rejectionRate}%`, color: stats.rejectionRate > 5 ? 'text-red-400' : 'text-slate-300' },
          ],
          linkUrl: '/production',
        },
      };
    }

    // Default Overview
    const [orders, prod, fin, aging] = await Promise.all([
      OrderService.getOrders(),
      ProductionService.getProductionStats(),
      PaymentService.getFinancialSummary(),
      FinishedGoodsService.getStockAgingReport(),
    ]);

    return {
      text: `Live Factory Summary (Shree Raas Krishnam Creation):\n• Ready Finished Goods Stock: ${aging.totalDispatchableStock.toLocaleString('en-IN')} dispatchable pcs (${aging.totalReadyStock} total physical pcs in warehouse)\n• Active Order Pipeline: ${orders.length} orders (${orders.reduce((s: number, o: Order) => s + (o.totalQuantity || 0), 0)} pcs)\n• Production Completion: ${prod.totalProducedQuantity} / ${prod.totalPlannedQuantity} pcs (${prod.rejectionRate}% defect rate)\n• Uncollected Market Receivables: ₹${Math.round(fin.netReceivable).toLocaleString('en-IN')}\n\nYou can ask specific questions about size-wise ready stock, stock aging, WIP stages, overdue orders, or replenishment requirements.`,
    };
  }

  /**
   * Generates Executive Morning Briefing via Google Gemini LLM reasoning on real live database
   */
  public static async generateExecutiveBriefing(): Promise<ExecutiveBriefing> {
    const [orders, prodStats, delayedOrders, delayedProd, lowStock, financial, stages, aging] =
      await Promise.all([
        OrderService.getOrders(),
        ProductionService.getProductionStats(),
        OrderService.getDelayedOrders(),
        ProductionService.getDelayedProductionOrders(),
        InventoryService.getLowStockAlerts(),
        PaymentService.getFinancialSummary(),
        ProductionService.getStageSummary(),
        FinishedGoodsService.getStockAgingReport(),
      ]);

    const activeOrders = orders.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    const totalOrderPcs = activeOrders.reduce((s: number, o: Order) => s + (o.totalQuantity || 0), 0);

    // Calculate baseline health score
    let score = 100;
    if (delayedOrders.length > 0) score -= Math.min(30, delayedOrders.length * 10);
    if (prodStats.rejectionRate > 5) score -= 15;
    if (lowStock.length > 0) score -= Math.min(20, lowStock.length * 5);
    if (delayedProd.length > 0) score -= 10;
    const healthScore = Math.max(20, score);

    const bottleneck = stages.reduce(
      (max, s) => (s.activeOrdersCount > max.activeOrdersCount ? s : max),
      stages[0] || { stageName: 'Stitching', activeOrdersCount: 0 }
    );

    // Attempt Gemini AI Generation for Executive Briefing
    try {
      const prompt = `You are the AI Executive Analyst for Shree Raas Krishnam Creation garment factory.
Based on the real operational figures below, generate an executive briefing JSON object.

REAL LIVE DATA:
- Active Orders: ${activeOrders.length} (${totalOrderPcs} pcs)
- Delayed/Overdue Orders: ${delayedOrders.length}
- Shop-Floor Good Finished Pieces: ${prodStats.totalProducedQuantity} pcs
- QC Rejection Rate: ${prodStats.rejectionRate}% (${prodStats.totalRejectedQuantity} rejected pcs)
- Ready Finished Goods in Warehouse: ${aging.totalReadyStock} pcs (${aging.totalDispatchableStock} available for sale)
- Low-Stock Raw Materials: ${lowStock.length} items below minimum
- Market Receivables Due: ₹${Math.round(financial.netReceivable)}
- Pending Vendor Payables: ₹${Math.round(financial.netPayable)}
- Highest Batch Queue Stage: ${bottleneck.stageName} (${bottleneck.activeOrdersCount} batches)

Return STRICTLY a JSON object with this exact schema (no markdown fences, pure JSON):
{
  "headline": "Brief 1-line executive headline",
  "executiveSummary": "2-3 sentences summarizing actual factory load, production health, and cash flow",
  "topPriorities": [
    {
      "title": "Action title",
      "description": "Concrete action description citing real numbers",
      "urgency": "CRITICAL" | "HIGH" | "MEDIUM",
      "actionLink": "/orders" | "/production" | "/inventory" | "/payments"
    }
  ],
  "aiBottleneckDiagnosis": "Specific diagnosis of shop-floor bottlenecks and operator reallocation advice based on the highest queue stage"
}`;

      const aiResponse = await this.callGemini({
        prompt,
        temperature: 0.2,
        maxOutputTokens: 1000,
      });

      if (aiResponse) {
        const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.headline && parsed.executiveSummary && Array.isArray(parsed.topPriorities)) {
          return {
            generatedAt: new Date().toISOString(),
            factoryHealthScore: healthScore,
            headline: parsed.headline,
            executiveSummary: parsed.executiveSummary,
            topPriorities: parsed.topPriorities,
            operationalMetrics: {
              activeOrdersCount: activeOrders.length,
              totalOrderPieces: totalOrderPcs,
              delayedOrdersCount: delayedOrders.length,
              dailyProductionTarget: prodStats.totalPlannedQuantity,
              completedProductionPieces: prodStats.totalProducedQuantity,
              qcRejectionRatePercent: prodStats.rejectionRate,
              lowStockMaterialsCount: lowStock.length,
              uncollectedReceivables: Math.round(financial.netReceivable),
              pendingSupplierPayables: Math.round(financial.netPayable),
            },
            aiBottleneckDiagnosis: parsed.aiBottleneckDiagnosis || `Highest queue is currently at '${bottleneck.stageName}' with ${bottleneck.activeOrdersCount} batch(es).`,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini briefing generation fallback:', err);
    }

    // Deterministic fallback based on real numbers
    const priorities: ExecutiveBriefing['topPriorities'] = [];
    if (delayedOrders.length > 0) {
      priorities.push({
        title: `Expedite ${delayedOrders.length} Overdue Client Order(s)`,
        description: `Order #${delayedOrders[0].orderNumber} (${delayedOrders[0].customer?.name || 'Client'}) requires immediate dispatch focus.`,
        urgency: 'CRITICAL',
        actionLink: '/orders',
      });
    }
    if (lowStock.length > 0) {
      priorities.push({
        title: `Replenish ${lowStock.length} Low-Stock Material(s)`,
        description: `${lowStock[0].name} has ${lowStock[0].currentStock} ${lowStock[0].unit} remaining in ledger.`,
        urgency: 'HIGH',
        actionLink: '/inventory',
      });
    }
    if (financial.netReceivable > 0) {
      priorities.push({
        title: `Collect ₹${Math.round(financial.netReceivable).toLocaleString('en-IN')} Market Receivables`,
        description: 'Initiate payment follow-ups for outstanding customer invoices.',
        urgency: 'MEDIUM',
        actionLink: '/payments',
      });
    }
    if (priorities.length === 0) {
      priorities.push({
        title: 'Factory Primed for Production',
        description: 'All factory workflows are clean and on schedule. Ready for new order bookings and production batches.',
        urgency: 'MEDIUM',
        actionLink: '/orders',
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      factoryHealthScore: healthScore,
      headline: activeOrders.length > 0 ? 'Factory Floor Active & Processing' : 'Clean Slate — Factory System Primed & Optimal',
      executiveSummary: `Shree Raas Krishnam Creation currently has ${activeOrders.length} active orders (${totalOrderPcs.toLocaleString('en-IN')} pcs) on the floor. Shop-floor good output stands at ${prodStats.totalProducedQuantity.toLocaleString('en-IN')} pcs with a ${prodStats.rejectionRate}% defect rate. Market receivables stand at ₹${Math.round(financial.netReceivable).toLocaleString('en-IN')}.`,
      topPriorities: priorities,
      operationalMetrics: {
        activeOrdersCount: activeOrders.length,
        totalOrderPieces: totalOrderPcs,
        delayedOrdersCount: delayedOrders.length,
        dailyProductionTarget: prodStats.totalPlannedQuantity,
        completedProductionPieces: prodStats.totalProducedQuantity,
        qcRejectionRatePercent: prodStats.rejectionRate,
        lowStockMaterialsCount: lowStock.length,
        uncollectedReceivables: Math.round(financial.netReceivable),
        pendingSupplierPayables: Math.round(financial.netPayable),
      },
      aiBottleneckDiagnosis: bottleneck.activeOrdersCount > 0
        ? `Highest batch queue is currently concentrated at '${bottleneck.stageName}' (${bottleneck.activeOrdersCount} batches).`
        : 'Zero shop-floor bottleneck detected. All line stages (Cutting, Stitching, Washing, Finishing, QC) are clear.',
    };
  }

  /**
   * AI Fabric & Cutting Plan Estimator
   */
  public static async estimateFabricRequirement(params: {
    productName: string;
    fabricType: string;
    costPerMeter: number;
    sizeQuantities: Record<string, number>;
  }): Promise<FabricEstimationResult> {
    const sizeConsumption: Record<string, number> = {
      '38': 2.1,
      '40': 2.2,
      '42': 2.3,
      '44': 2.45,
      '46': 2.6,
      '48': 2.8,
      '50': 3.0,
      '52': 3.2,
      S: 2.1,
      M: 2.25,
      L: 2.4,
      XL: 2.55,
      XXL: 2.75,
      '3XL': 3.0,
    };

    let totalPieces = 0;
    let totalFabricMeters = 0;
    const sizeBreakdown: FabricEstimationResult['sizeBreakdown'] = [];

    for (const [size, qty] of Object.entries(params.sizeQuantities)) {
      if (qty > 0) {
        totalPieces += qty;
        const normSize = size.replace(/\D/g, '') || size.toUpperCase();
        const cons = sizeConsumption[normSize] || 2.35;
        const sizeMeters = Number((qty * cons).toFixed(2));
        totalFabricMeters += sizeMeters;
        sizeBreakdown.push({
          size,
          quantity: qty,
          fabricMeters: sizeMeters,
        });
      }
    }

    // Add 5% cutting wastage buffer
    totalFabricMeters = Number((totalFabricMeters * 1.05).toFixed(2));
    const avgPerPiece = totalPieces > 0 ? Number((totalFabricMeters / totalPieces).toFixed(2)) : 0;
    const estimatedCost = Number((totalFabricMeters * (params.costPerMeter || 120)).toFixed(2));

    // Calculate cutting batches (standard lay table capacity: 100 pcs per lay)
    const batches = Math.max(1, Math.ceil(totalPieces / 100));
    const estimatedDays = Math.max(1, Math.ceil(totalPieces / 250));

    return {
      productName: params.productName,
      totalPieces,
      estimatedFabricMeters: totalFabricMeters,
      metersPerPiece: avgPerPiece,
      fabricType: params.fabricType,
      estimatedCost,
      sizeBreakdown,
      recommendedCuttingBatches: batches,
      estimatedProductionDays: estimatedDays,
    };
  }

  /**
   * AI Quality Defect & Rejection Analysis — Pure Real Data + Gemini Reasoning
   */
  public static async analyzeQualityDefects(): Promise<QualityAnalysisResult> {
    const prodOrders = await ProductionService.getProductionOrders();

    let totalDefects = 0;
    let totalProduced = 0;
    const reasonCounts: Record<string, number> = {};
    const stageCounts: Record<string, number> = {
      CUTTING: 0,
      STITCHING: 0,
      WASHING: 0,
      FINISHING: 0,
      'QUALITY CHECK': 0,
    };

    for (const po of prodOrders) {
      totalProduced += (po.totalCompletedQty || 0) + (po.totalRejectedQty || 0);
      totalDefects += po.totalRejectedQty || 0;

      const entries = (po as any).productionEntries || (po as any).entries;
      if (entries && Array.isArray(entries)) {
        for (const entry of entries) {
          if (entry.quantityRejected > 0) {
            const reason = entry.rejectionReason || 'Uncategorized Flaw';
            reasonCounts[reason] = (reasonCounts[reason] || 0) + Number(entry.quantityRejected);

            const rawStage = (entry.stage as any)?.name || entry.stageName || 'STITCHING';
            const normStage = rawStage.toUpperCase();
            stageCounts[normStage] = Number(stageCounts[normStage] || 0) + Number(entry.quantityRejected);
          }
        }
      }
    }

    const overallRate = totalProduced > 0 ? Number(((totalDefects / totalProduced) * 100).toFixed(1)) : 0;

    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Number(((count / (totalDefects || 1)) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    const stageDist = Object.entries(stageCounts).map(([stageName, defectCount]) => ({
      stageName,
      defectCount,
    }));

    // If NO defects in real database, return clean zero-defect report
    if (totalDefects === 0) {
      return {
        totalDefectsLogged: 0,
        overallRejectionRate: 0,
        topDefectReasons: [],
        stageWiseDefectDistribution: stageDist,
        rootCauseInsights: [
          'Zero defect or rejection entries logged in the active production database.',
          'Shop-floor quality gate status is 100% clean across Cutting, Stitching, Finishing, and QC inspection.',
          'Quality metrics will automatically update in real-time as operators log stage rejection quantities.',
        ],
        correctiveActionPlan: [
          'Maintain standard operating procedure (SOP) inspections at the end of each sewing line.',
          'Ensure cutting master performs 4-point fabric inspection before layering fabric spreads.',
          'Verify that operators record any damaged or mismatched pieces directly in the Production module.',
        ],
      };
    }

    // Call Gemini to generate deep root-cause diagnosis on REAL defects
    try {
      const prompt = `You are the Expert Quality Control (QC) & Six-Sigma Lead at Shree Raas Krishnam Creation garment factory.
Analyze the following REAL quality defect data logged from the production shop-floor:

REAL DEFECT DATA:
- Total Produced Pieces: ${totalProduced} pcs
- Total Rejected/Defective Pieces: ${totalDefects} pcs (${overallRate}% rejection rate)
- Top Defect Categories:
${topReasons.map((r) => `  * ${r.reason}: ${r.count} pcs (${r.percentage}%)`).join('\n')}
- Stage-Wise Defect Counts:
${stageDist.map((s) => `  * ${s.stageName}: ${s.defectCount} rejections`).join('\n')}

Generate a JSON object with this exact schema (no markdown, pure JSON):
{
  "rootCauseInsights": [
    "Root cause insight 1 citing specific defect patterns",
    "Root cause insight 2 citing stage concentration and material/machine causes",
    "Root cause insight 3 citing operational findings"
  ],
  "correctiveActionPlan": [
    "Immediate corrective action 1 for the highest defect stage",
    "Corrective action 2 to eliminate primary flaw category",
    "Corrective action 3 for preventive operator training or machine calibration"
  ]
}`;

      const aiResponse = await this.callGemini({
        prompt,
        temperature: 0.2,
        maxOutputTokens: 800,
      });

      if (aiResponse) {
        const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.rootCauseInsights) && Array.isArray(parsed.correctiveActionPlan)) {
          return {
            totalDefectsLogged: totalDefects,
            overallRejectionRate: overallRate,
            topDefectReasons: topReasons,
            stageWiseDefectDistribution: stageDist,
            rootCauseInsights: parsed.rootCauseInsights,
            correctiveActionPlan: parsed.correctiveActionPlan,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini QC analysis fallback:', err);
    }

    // Deterministic fallback on real defect data
    const topReason = topReasons[0]?.reason || 'Unspecified';
    const worstStage = stageDist.reduce((max, s) => (s.defectCount > max.defectCount ? s : max), stageDist[0]);

    return {
      totalDefectsLogged: totalDefects,
      overallRejectionRate: overallRate,
      topDefectReasons: topReasons,
      stageWiseDefectDistribution: stageDist,
      rootCauseInsights: [
        `Primary defect driver is '${topReason}' accounting for ${topReasons[0]?.percentage || 0}% of all rejections.`,
        `Highest defect concentration is in '${worstStage.stageName}' with ${worstStage.defectCount} rejection(s).`,
        `Overall shop-floor defect rate is currently measured at ${overallRate}%.`,
      ],
      correctiveActionPlan: [
        `Perform immediate machine calibration and quality audit on the '${worstStage.stageName}' line.`,
        `Mandate operator double-check to eliminate recurring '${topReason}' issues.`,
        `Enforce supervisor sign-off before batches move from '${worstStage.stageName}' to the next production stage.`,
      ],
    };
  }
}
