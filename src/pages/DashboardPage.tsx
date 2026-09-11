import React, { useState, useEffect } from 'react';
import { DashboardService, DashboardMetrics } from '../services/dashboard/dashboardService';
import { Button } from '../components/common/Button';
import {
  Factory,
  ShoppingCart,
  Calendar,
  Truck,
  AlertTriangle,
  IndianRupee,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await DashboardService.getLiveDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading live dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading Shree Raas Krishnam live factory data...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Unable to Load Live Metrics</h3>
        <Button variant="primary" size="sm" onClick={loadDashboard}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Factory Command Center
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Shree Raas Krishnam Creation
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of orders, 7-stage production lines, raw materials ledger, and cashflow
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboard}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/ai-manager')}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI Manager
          </Button>
        </div>
      </div>

      {/* AI Factory Briefing */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                AI Factory Executive Briefing
              </span>
              <span className="text-[10px] text-slate-400">100% Grounded in Live Database</span>
            </div>
            <h3 className="text-base font-bold text-white">
              {metrics.activeOrdersCount} Active Garment Orders in Progress | {metrics.todayProducedQuantity} Pcs Finished
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              💡 <strong className="text-indigo-300">Action Priority:</strong>{' '}
              {metrics.delayedOrdersCount > 0
                ? `${metrics.delayedOrdersCount} production batches or orders require attention to meet delivery commitments.`
                : 'All production stages operating within target schedule.'}{' '}
              {metrics.lowStockItemsCount > 0
                ? `${metrics.lowStockItemsCount} fabric/trims items are below safety threshold.`
                : 'Raw material buffers are healthy.'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div
          onClick={() => navigate('/orders')}
          className="bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Orders</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{metrics.activeOrdersCount}</div>
            <p className="text-xs text-slate-400 mt-1">Confirmed & in process</p>
          </div>
        </div>

        {/* Today's Production */}
        <div
          onClick={() => navigate('/production')}
          className="bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 p-4 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Finished Output</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">
              {metrics.todayProducedQuantity.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{metrics.pendingProductionQuantity} pcs pending on line</p>
          </div>
        </div>

        {/* Receivables Outstanding */}
        <div
          onClick={() => navigate('/payments')}
          className="bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Market Receivables</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">
              ₹{Math.round(metrics.totalReceivables).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-400 mt-1">Due from buyers</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => navigate('/inventory')}
          className="bg-slate-800/80 border border-slate-700/80 hover:border-red-500/50 p-4 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Low Stock Alerts</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-400">{metrics.lowStockItemsCount} SKUs</div>
            <p className="text-xs text-slate-400 mt-1">Below safety reorder level</p>
          </div>
        </div>
      </div>

      {/* Recent Orders & Production Live Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-400" /> Recent Customer Orders
            </h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-700/60">
            {metrics.recentOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No recent orders recorded.</p>
            ) : (
              metrics.recentOrders.map((o) => (
                <div key={o.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">#{o.orderNumber}</span>
                    <p className="text-slate-400 mt-0.5">{o.customerName || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">{o.totalQuantity} pcs</span>
                    <span className="block text-[11px] text-emerald-400">
                      ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Production Batches */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Factory className="w-4 h-4 text-emerald-400" /> Active Production Batches
            </h3>
            <button
              onClick={() => navigate('/production')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              View Shop-Floor <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-700/60">
            {metrics.recentProduction.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No active production runs.</p>
            ) : (
              metrics.recentProduction.map((p) => {
                const prodNum = p.productionNumber || p.orderNumber || p.orderId;
                const stageName = p.currentStage?.name || (p as any).currentStageName || 'Floor Process';
                const produced = p.totalCompletedQty || p.producedQuantity || 0;
                const planned = p.totalPlannedQty || p.plannedQuantity || 0;
                const rejected = p.totalRejectedQty || p.rejectedQuantity || 0;

                return (
                  <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-white">#{prodNum}</span>
                      <p className="text-indigo-400 mt-0.5 font-medium">Stage: {stageName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">
                        {produced} / {planned} pcs
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {rejected > 0 ? `${rejected} rejected` : 'Zero defects'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
