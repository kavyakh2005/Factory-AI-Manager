import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductionService } from '../../src/services/production/productionService';
import { OrderService } from '../../src/services/orders/orderService';
import { ProductionOrder, ProductionStage } from '../../src/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { StageKanbanPipeline } from '../components/production/StageKanbanPipeline';
import { ProductionPlanningModal } from '../components/production/ProductionPlanningModal';
import { LogProductionEntryModal } from '../components/production/LogProductionEntryModal';
import { ProductionDetailsModal } from '../components/production/ProductionDetailsModal';
import {
  Factory,
  Plus,
  RefreshCw,
  Search,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Eye,
  ArrowRight,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

export const ProductionPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  const queryClient = useQueryClient();

  // 1. Fetch Production Dashboard Data
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isFetching,
    refetch: refetchProduction,
  } = useQuery({
    queryKey: ['production-dashboard'],
    queryFn: () => ProductionService.getDashboardMetrics(),
    refetchInterval: 30000,
  });

  // 2. Fetch Confirmed Orders for Planning
  const { data: confirmedOrders = [] } = useQuery({
    queryKey: ['confirmed-orders-planning'],
    queryFn: () => OrderService.getOrders({ status: 'CONFIRMED' }),
  });

  // 3. Fetch Master Products & Sets
  const { data: products = [] } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => OrderService.getProducts(),
  });

  const { data: sets = [] } = useQuery({
    queryKey: ['sets-sizes-list'],
    queryFn: () => OrderService.getSetsWithSizes(),
  });

  const { data: rejectionReasons = [] } = useQuery({
    queryKey: ['rejection-reasons'],
    queryFn: () => ProductionService.getRejectionReasons(),
  });

  // Advance Stage Mutation
  const advanceStageMutation = useMutation({
    mutationFn: ({ orderId, stageId }: { orderId: string; stageId: string }) =>
      ProductionService.advanceStage(orderId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-dashboard'] });
    },
  });

  const stages = dashboardData?.stages || [];
  const productionOrders = dashboardData?.productionOrders || [];
  const metrics = dashboardData?.metrics || {
    totalActiveOrders: 0,
    todayPlannedQty: 0,
    todayProducedQty: 0,
    totalPendingQty: 0,
    totalRejectedQty: 0,
    delayedCount: 0,
    stageCounts: {},
  };
  const delayedOrders = dashboardData?.delayedOrders || [];

  // Filtered orders for table view
  const filteredOrders = productionOrders.filter((po) => {
    const matchesStage = stageFilter === 'ALL' || po.currentStageId === stageFilter || po.currentStage?.name === stageFilter;
    const matchesSearch =
      !searchQuery ||
      po.productionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.order?.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.order?.customer?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const handleOpenDetails = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleOpenLogModalForOrder = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsLogModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            Production Shop-Floor Management
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              7-Stage Pipeline
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stage tracking, dynamic size-wise output logs, and defect rejection management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchProduction()}
            isLoading={isFetching}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Floor
          </Button>

          <Button
            size="sm"
            onClick={() => setIsPlanningModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Production Plan
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Active Batches */}
        <Card className="p-3.5 border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Batches</span>
          <div className="mt-1.5 text-xl font-black text-slate-100">{metrics.totalActiveOrders} <span className="text-xs font-normal text-slate-400">orders</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Floor work orders</div>
        </Card>

        {/* Today's Planned */}
        <Card className="p-3.5 border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today's Target</span>
          <div className="mt-1.5 text-xl font-black text-slate-200">{metrics.todayPlannedQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Daily floor quota</div>
        </Card>

        {/* Today's Output */}
        <Card className="p-3.5 border-slate-800 border-l-2 border-l-emerald-500">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today's Output</span>
          <div className="mt-1.5 text-xl font-black text-emerald-400">{metrics.todayProducedQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span></div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Passed inspections</div>
        </Card>

        {/* Pending Pipeline */}
        <Card className="p-3.5 border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Output</span>
          <div className="mt-1.5 text-xl font-black text-amber-400">{metrics.totalPendingQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Remaining in line</div>
        </Card>

        {/* Total Rejected */}
        <Card className="p-3.5 border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Floor Rejections</span>
          <div className="mt-1.5 text-xl font-black text-rose-400">{metrics.totalRejectedQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Logged defects</div>
        </Card>

        {/* Delayed Orders */}
        <Card className="p-3.5 border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Delayed / Overdue</span>
          <div className="mt-1.5 text-xl font-black text-rose-400">{metrics.delayedCount} <span className="text-xs font-normal text-slate-400">orders</span></div>
          <div className="text-[10px] text-rose-400/80 mt-0.5">Risk of delivery miss</div>
        </Card>
      </div>

      {/* Delayed Orders Alert Bar */}
      {delayedOrders.length > 0 && (
        <Card className="p-3.5 sm:p-4 border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-factory-900 to-factory-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300">
                ⚠️ Production Delay Alert: {delayedOrders.length} work orders require immediate expediting
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Batch #{delayedOrders[0].productionNumber} ({delayedOrders[0].product?.name}) is overdue past its target date.
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="danger"
            onClick={() => handleOpenDetails(delayedOrders[0])}
            className="w-full sm:w-auto"
          >
            Review Bottleneck
          </Button>
        </Card>
      )}

      {/* Stage-Wise Status Chips & View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-factory-950 border border-slate-800">
        {/* Stage Summary Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setStageFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              stageFilter === 'ALL'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-factory-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Stages ({productionOrders.length})
          </button>
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => setStageFilter(st.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                stageFilter === st.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-factory-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.colorCode || '#6366F1' }} />
              <span>{st.name} ({metrics.stageCounts[st.name] || 0})</span>
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-factory-900 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Kanban
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Batch Table
          </button>
        </div>
      </div>

      {/* Main View Area: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <StageKanbanPipeline
          stages={stages}
          productionOrders={productionOrders}
          onSelectOrder={handleOpenDetails}
          onAdvanceStage={(orderId, stageId) => advanceStageMutation.mutate({ orderId, stageId })}
        />
      ) : (
        <Card className="border-slate-800 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Factory className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No production orders match the filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-factory-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-3.5">Batch #</th>
                    <th className="p-3.5">Product & Set</th>
                    <th className="p-3.5">Assigned Team</th>
                    <th className="p-3.5 text-center">Planned Pcs</th>
                    <th className="p-3.5 text-center">Good Output</th>
                    <th className="p-3.5 text-center text-rose-400">Rejections</th>
                    <th className="p-3.5">Current Stage</th>
                    <th className="p-3.5">Target Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredOrders.map((order) => {
                    const isDelayed =
                      new Date(order.targetCompletionDate) < new Date() && order.status !== 'COMPLETED';
                    const goodQty = Math.max(0, order.totalCompletedQty - order.totalRejectedQty);

                    return (
                      <tr
                        key={order.id}
                        onClick={() => handleOpenDetails(order)}
                        className="hover:bg-factory-900/60 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 font-mono font-bold text-slate-100 group-hover:text-primary-300">
                          {order.productionNumber}
                          {order.order && (
                            <div className="text-[10px] text-slate-500 font-normal">
                              Order #{order.order.orderNumber}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-200">{order.product?.name}</div>
                          <div className="text-[10px] text-slate-400">{order.set?.name || 'Standard Set'}</div>
                        </td>

                        <td className="p-3.5 text-slate-300">{order.assignedTeam || 'Floor Line 1'}</td>

                        <td className="p-3.5 text-center font-bold text-slate-200">{order.totalPlannedQty}</td>
                        <td className="p-3.5 text-center font-bold text-emerald-400">{goodQty}</td>
                        <td className="p-3.5 text-center font-bold text-rose-400">{order.totalRejectedQty || 0}</td>

                        <td className="p-3.5">
                          <Badge variant="primary" size="sm">
                            {order.currentStage?.name || 'PLANNING'}
                          </Badge>
                        </td>

                        <td className="p-3.5">
                          <div className={`font-semibold ${isDelayed ? 'text-rose-400' : 'text-slate-300'}`}>
                            {new Date(order.targetCompletionDate).toLocaleDateString()}
                          </div>
                          {isDelayed && <div className="text-[10px] text-rose-400 font-bold">Delayed</div>}
                        </td>

                        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetails(order)}
                              className="p-1.5"
                            >
                              <Eye className="w-4 h-4 text-slate-400 hover:text-slate-100" />
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenLogModalForOrder(order)}
                              className="px-2 py-1 text-[11px]"
                              icon={<ClipboardList className="w-3.5 h-3.5" />}
                            >
                              Log Shift
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <ProductionPlanningModal
        isOpen={isPlanningModalOpen}
        onClose={() => setIsPlanningModalOpen(false)}
        confirmedOrders={confirmedOrders}
        products={products}
        sets={sets}
        onPlanCreated={() => queryClient.invalidateQueries({ queryKey: ['production-dashboard'] })}
      />

      <LogProductionEntryModal
        productionOrder={selectedOrder}
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        stages={stages}
        rejectionReasons={rejectionReasons}
        allSets={sets}
        onEntryLogged={() => {
          queryClient.invalidateQueries({ queryKey: ['production-dashboard'] });
          if (selectedOrder) {
            // Refresh currently viewed order details
            ProductionService.getProductionOrders().then((orders) => {
              const updated = orders.find((o) => o.id === selectedOrder.id);
              if (updated) setSelectedOrder(updated);
            });
          }
        }}
      />

      <ProductionDetailsModal
        productionOrder={selectedOrder}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        stages={stages}
        allSets={sets}
        onOpenLogModal={() => {
          setIsDetailsModalOpen(false);
          setIsLogModalOpen(true);
        }}
        onStageAdvanced={() => {
          queryClient.invalidateQueries({ queryKey: ['production-dashboard'] });
          setIsDetailsModalOpen(false);
        }}
      />
    </div>
  );
};
