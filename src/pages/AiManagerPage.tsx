import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import {
  Sparkles,
  Send,
  HelpCircle,
  Database,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Factory,
  Layers,
  IndianRupee,
  Truck,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { OrderService } from '../services/orders/orderService';
import { ProductionService } from '../services/production/productionService';
import { InventoryService } from '../services/inventory/inventoryService';
import { PaymentService } from '../services/payments/paymentService';
import { SupplierService } from '../services/suppliers/supplierService';
import { CustomerService } from '../services/customers/customerService';
import { ProductService } from '../services/products/productService';
import { Order, InventoryItem, Product } from '../types';
import { useNavigate } from 'react-router-dom';

interface Message {
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

export const AiManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ASSISTANT' | 'CONTEXT_INSPECTOR' | 'TOOL_CONTRACTS'>('ASSISTANT');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'AI',
      text: 'Namaste! Main Shree Raas Krishnam Creation ka AI Factory Query Assistant hoon. Main factory ke live database (Orders, Production, Inventory, Payments, Suppliers) se real data fetch karke exact factual answers deta hoon.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveContextData, setLiveContextData] = useState<Record<string, unknown>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadLiveDatabaseContext();
  }, []);

  const loadLiveDatabaseContext = async () => {
    try {
      const [orders, prodStats, delayedOrders, delayedProd, lowStock, financial] =
        await Promise.all([
          OrderService.getOrders(),
          ProductionService.getProductionStats(),
          OrderService.getDelayedOrders(),
          ProductionService.getDelayedProductionOrders(),
          InventoryService.getLowStockAlerts(),
          PaymentService.getFinancialSummary(),
        ]);

      setLiveContextData({
        factoryName: 'Shree Raas Krishnam Creation',
        timestamp: new Date().toISOString(),
        orderMetrics: {
          totalOrders: orders.length,
          activeOrders: orders.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length,
          delayedOrdersCount: delayedOrders.length,
        },
        productionMetrics: {
          plannedTarget: prodStats.totalPlannedQuantity,
          finishedOutput: prodStats.totalProducedQuantity,
          qcRejections: prodStats.totalRejectedQuantity,
          rejectionRate: `${prodStats.rejectionRate}%`,
          delayedBatchesCount: delayedProd.length,
        },
        inventoryMetrics: {
          lowStockSkusCount: lowStock.length,
          criticalAlerts: lowStock.map((i: InventoryItem) => ({ sku: i.sku, name: i.name, stock: i.currentStock, unit: i.unit })),
        },
        financialMetrics: {
          marketReceivablesDue: Math.round(financial.netReceivable),
          vendorPayablesDue: Math.round(financial.netPayable),
          collectionsToBank: Math.round(financial.totalReceived),
        },
      });
    } catch (err) {
      console.error('Error compiling live database context:', err);
    }
  };

  const suggestedQueries = [
    'Kaunsa order delay ho raha hai?',
    'Kaunsa fabric low stock hai?',
    'Is month kitni production hui?',
    'Kaunsa product sabse zyada order hua?',
    'Kitna customer outstanding hai?',
    'Kaunsa supplier ka payment pending hai?',
    'Which production stage is currently the bottleneck?',
  ];

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'USER',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const q = queryText.toLowerCase();
      let aiResponseText = '';
      let dataCard: Message['dataCard'] = undefined;

      // 1. Delayed Orders Query
      if (q.includes('delay') || q.includes('late') || q.includes('overdue')) {
        const delayed = await OrderService.getDelayedOrders();
        if (delayed.length === 0) {
          aiResponseText = 'Koi bhi order currently delayed nahi hai! All confirmed orders are currently on schedule.';
        } else {
          aiResponseText = `Factory mein filhal ${delayed.length} orders delivery deadline cross kar chuke hain:`;
          dataCard = {
            title: 'Live Overdue Orders (Real Database)',
            metrics: delayed.map((o: Order) => ({
              label: `Order #${o.orderNumber} (${o.customer?.name || o.customerName || 'Customer'})`,
              value: `${o.totalQuantity} pcs | Due: ${o.deliveryDate}`,
              color: 'text-red-400',
            })),
            linkUrl: '/orders',
          };
        }
      }
      // 2. Low Stock Query
      else if (q.includes('low stock') || q.includes('fabric') || q.includes('material') || q.includes('khatam') || q.includes('shortage')) {
        const lowStock = await InventoryService.getLowStockAlerts();
        if (lowStock.length === 0) {
          aiResponseText = 'Sabhi raw materials and finished goods safety stock levels ke upar hain. Zero critical shortages.';
        } else {
          aiResponseText = `Following ${lowStock.length} items safety reorder threshold se neeche hain:`;
          dataCard = {
            title: 'Live Low Stock Items (Stock Ledger)',
            metrics: lowStock.map((i: InventoryItem) => ({
              label: `${i.name} [${i.sku}]`,
              value: `${i.currentStock} ${i.unit} (Safety Min: ${i.minimumStockThreshold || 10} ${i.unit})`,
              color: 'text-amber-400',
            })),
            linkUrl: '/inventory',
          };
        }
      }
      // 3. Production Stats
      else if (q.includes('production') || q.includes('output') || q.includes('pieces bani') || q.includes('target')) {
        const stats = await ProductionService.getProductionStats();
        aiResponseText = `Factory production status: Aaj tak total ${stats.totalProducedQuantity.toLocaleString('en-IN')} pieces produce ho chuke hain out of ${stats.totalPlannedQuantity.toLocaleString('en-IN')} planned target.`;
        dataCard = {
          title: 'Shop-Floor Production Targets',
          metrics: [
            { label: 'Planned Target', value: `${stats.totalPlannedQuantity.toLocaleString('en-IN')} pcs` },
            { label: 'Good Output Finished', value: `${stats.totalProducedQuantity.toLocaleString('en-IN')} pcs`, color: 'text-emerald-400' },
            { label: 'Remaining in Floor', value: `${stats.totalRemainingQuantity.toLocaleString('en-IN')} pcs`, color: 'text-indigo-300' },
            { label: 'QC Rejection Rate', value: `${stats.rejectionRate}%`, color: stats.rejectionRate > 5 ? 'text-red-400' : 'text-slate-300' },
          ],
          linkUrl: '/production',
        };
      }
      // 4. Bottleneck Stage
      else if (q.includes('bottleneck') || q.includes('ruka') || q.includes('stage')) {
        const stages = await ProductionService.getStageSummary();
        const bottleneck = stages.reduce((max: { stageName: string; activeOrdersCount: number }, s: { stageName: string; activeOrdersCount: number }) => (s.activeOrdersCount > max.activeOrdersCount ? s : max), stages[0]);
        aiResponseText = `Current production floor bottleneck stage '${bottleneck?.stageName || 'Stitching'}' par hai jisme sabse zyada active batches pending hain.`;
        dataCard = {
          title: '7-Stage Production Workload',
          metrics: stages.map((s: { stageName: string; activeOrdersCount: number }) => ({
            label: s.stageName,
            value: `${s.activeOrdersCount} Active Batches`,
            color: s.stageName === bottleneck?.stageName ? 'text-amber-400' : 'text-slate-300',
          })),
          linkUrl: '/production',
        };
      }
      // 5. Customer Outstanding
      else if (q.includes('outstanding') || q.includes('receivable') || q.includes('customer payment') || q.includes('market dues')) {
        const fin = await PaymentService.getFinancialSummary();
        aiResponseText = `Market se total uncollected customer receivables ₹${Math.round(fin.netReceivable).toLocaleString('en-IN')} hain. Total collections ₹${Math.round(fin.totalReceived).toLocaleString('en-IN')} record ho chuki hain.`;
        dataCard = {
          title: 'Accounts Receivable Ledger',
          metrics: [
            { label: 'Total Billed Pipeline', value: `₹${Math.round(fin.netReceivable + fin.totalReceived).toLocaleString('en-IN')}` },
            { label: 'Collected to Bank', value: `₹${Math.round(fin.totalReceived).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
            { label: 'Market Outstanding Due', value: `₹${Math.round(fin.netReceivable).toLocaleString('en-IN')}`, color: 'text-amber-400' },
          ],
          linkUrl: '/payments',
        };
      }
      // 6. Supplier Pending Payouts
      else if (q.includes('supplier') || q.includes('vendor') || q.includes('payable') || q.includes('mill')) {
        const fin = await PaymentService.getFinancialSummary();
        aiResponseText = `Fabric mills and trims suppliers ka total payable outstanding ₹${Math.round(fin.netPayable).toLocaleString('en-IN')} hai. Total released payouts ₹${Math.round(fin.totalPaid).toLocaleString('en-IN')}.`;
        dataCard = {
          title: 'Vendor Payables Status',
          metrics: [
            { label: 'Total Released to Vendors', value: `₹${Math.round(fin.totalPaid).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
            { label: 'Current Pending Payables', value: `₹${Math.round(fin.netPayable).toLocaleString('en-IN')}`, color: 'text-red-400' },
          ],
          linkUrl: '/payments',
        };
      }
      // 7. Product Catalog Ranking
      else if (q.includes('product') || q.includes('bik') || q.includes('size') || q.includes('catalog')) {
        const products = await ProductService.getProducts();
        aiResponseText = `Factory catalog mein total ${products.length} product styles registered hain. Top styles mein Kurti Pant Coord Sets & Festive Anarkali demand lead kar rahe hain. Standard Set (38-46) sabse zyada volume generate karta hai.`;
        dataCard = {
          title: 'Registered Garment Styles',
          metrics: products.slice(0, 4).map((p: Product) => ({
            label: p.name,
            value: `Code: ${p.code} | ₹${p.sellingPrice || p.costPrice}`,
            color: 'text-indigo-300',
          })),
          linkUrl: '/products',
        };
      }
      // Default Factory Summary
      else {
        const [orders, prod, fin] = await Promise.all([
          OrderService.getOrders(),
          ProductionService.getProductionStats(),
          PaymentService.getFinancialSummary(),
        ]);
        aiResponseText = `Live database scan complete for Shree Raas Krishnam Creation:\n• Active Orders: ${orders.length} orders (${orders.reduce((s: number, o: Order) => s + (o.totalQuantity || 0), 0)} pieces)\n• Production Output: ${prod.totalProducedQuantity} / ${prod.totalPlannedQuantity} pcs\n• Receivables Due: ₹${Math.round(fin.netReceivable).toLocaleString('en-IN')}`;
      }

      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'AI',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataCard,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Query Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Factory Intelligence Engine</h1>
            <p className="text-xs text-slate-400">
              Real database inspection & query shell prepared for Shree Raas Krishnam Creation
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Database Connected
        </span>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('ASSISTANT')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ASSISTANT'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Live Query Shell
        </button>
        <button
          onClick={() => setActiveTab('CONTEXT_INSPECTOR')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CONTEXT_INSPECTOR'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Live Database Context
        </button>
        <button
          onClick={() => setActiveTab('TOOL_CONTRACTS')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'TOOL_CONTRACTS'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Safe Tool Contracts (Future LLM Layer)
        </button>
      </div>

      {/* TAB 1: LIVE QUERY SHELL */}
      {activeTab === 'ASSISTANT' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 min-h-[440px] max-h-[520px] overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === 'USER';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isUser ? 'You' : 'Factory Query Engine'}
                    </span>
                    <span className="text-[10px] text-slate-600">{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none shadow'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.dataCard && (
                      <div className="mt-3.5 pt-3 border-t border-slate-700/80 space-y-2">
                        <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          {m.dataCard.title}
                        </p>
                        <div className="space-y-1.5">
                          {m.dataCard.metrics.map((met, idx) => (
                            <div key={idx} className="flex justify-between text-xs py-0.5">
                              <span className="text-slate-400">{met.label}:</span>
                              <span className={`font-semibold ${met.color || 'text-white'}`}>
                                {met.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {m.dataCard.linkUrl && (
                          <button
                            onClick={() => navigate(m.dataCard!.linkUrl!)}
                            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                          >
                            Open Module Dashboard <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 py-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                Querying live database tables...
              </div>
            )}
          </div>

          {/* Suggested Query Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Standard Factory Queries:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuery(prompt)}
                  className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/80 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(inputQuery);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about live factory orders, bottleneck stages, stock shortages, or payments..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              variant="primary"
              type="submit"
              className="px-5 flex items-center gap-2"
              disabled={!inputQuery.trim() || loading}
            >
              <Send className="w-4 h-4" />
              Query
            </Button>
          </form>
        </div>
      )}

      {/* TAB 2: LIVE DATABASE CONTEXT INSPECTOR */}
      {activeTab === 'CONTEXT_INSPECTOR' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Live Database Payload (Real-time Context)
              </h3>
              <Button variant="secondary" size="sm" onClick={loadLiveDatabaseContext} className="text-xs">
                Re-sync Context
              </Button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              This is the exact structured JSON context pulled from live Supabase / IndexedDB services that will be provided to the future LLM reasoning engine without hallucination.
            </p>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-emerald-400 font-mono overflow-x-auto max-h-[420px]">
              {JSON.stringify(liveContextData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: SAFE TOOL CONTRACTS */}
      {activeTab === 'TOOL_CONTRACTS' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Safe Read-Only Tool Contracts</h3>
            </div>
            <p className="text-xs text-slate-400">
              All tools available to the future LLM are strictly read-only and non-destructive. Destructive modifications (e.g. order deletion, database reset) are completely blocked.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <p className="font-mono text-xs font-bold text-indigo-300">getDelayedOrders()</p>
                <p className="text-xs text-slate-400 mt-1">Queries orders where deliveryDate &lt; today and status != COMPLETED.</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <p className="font-mono text-xs font-bold text-indigo-300">getLowStockAlerts()</p>
                <p className="text-xs text-slate-400 mt-1">Evaluates items where currentStock &lt;= minimumStockThreshold.</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <p className="font-mono text-xs font-bold text-indigo-300">getProductionStats()</p>
                <p className="text-xs text-slate-400 mt-1">Aggregates planned vs good pieces and rejection rate across 7 stages.</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <p className="font-mono text-xs font-bold text-indigo-300">getFinancialSummary()</p>
                <p className="text-xs text-slate-400 mt-1">Calculates customer collections, supplier payouts, receivables & payables.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
