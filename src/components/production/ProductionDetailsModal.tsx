import React, { useState } from 'react';
import { ProductionOrder, ProductionStage, Set } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ProductionService } from '../../services/production/productionService';
import {
  Factory,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  History,
  ShieldCheck,
  Zap,
  Printer,
  Sparkles,
  ArrowRightLeft,
  FastForward,
  Trash2,
} from 'lucide-react';

interface ProductionDetailsModalProps {
  productionOrder: ProductionOrder | null;
  initialStageId?: string;
  isOpen: boolean;
  onClose: () => void;
  stages: ProductionStage[];
  allSets: Set[];
  onOpenLogModal: () => void;
  onStageAdvanced: () => void;
  onDeleteOrder?: (orderId: string) => Promise<void> | void;
}

export const ProductionDetailsModal: React.FC<ProductionDetailsModalProps> = ({
  productionOrder,
  initialStageId,
  isOpen,
  onClose,
  stages,
  allSets,
  onOpenLogModal,
  onStageAdvanced,
  onDeleteOrder,
}) => {
  if (!productionOrder) return null;

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFastTrackConfirm, setShowFastTrackConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedJumpStageId, setSelectedJumpStageId] = useState<string>('');

  const currentSet = (allSets.find((s) => s.id === productionOrder.setId) || productionOrder.set || allSets[0]) as Set;
  const currentStageIndex = stages.findIndex((s) => s.id === productionOrder.currentStageId || s.name === productionOrder.currentStage?.name);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null;

  // Calculate dynamic size-wise breakdown and stage flow
  const sizeMatrix = ProductionService.calculateSizeWiseMatrix(productionOrder, allSets);
  const stageFlow = ProductionService.calculateStageFlow(productionOrder, stages, currentSet);

  const [viewMode, setViewMode] = useState<'STAGE_FLOW' | 'OVERALL'>('STAGE_FLOW');
  const [selectedViewingStageId, setSelectedViewingStageId] = useState<string>(
    initialStageId || productionOrder.currentStageId || stages[1]?.id || stages[0]?.id
  );

  React.useEffect(() => {
    if (isOpen) {
      setSelectedViewingStageId(initialStageId || productionOrder.currentStageId || stages[1]?.id || stages[0]?.id);
      setViewMode('STAGE_FLOW');
      setShowFastTrackConfirm(false);
    }
  }, [isOpen, initialStageId, productionOrder?.id, productionOrder?.currentStageId]);

  const activeViewingStage =
    stageFlow.stagesFlow.find((s) => s.stageId === selectedViewingStageId || s.stageName === selectedViewingStageId) ||
    stageFlow.stagesFlow.find((s) => s.stageId === productionOrder.currentStageId) ||
    stageFlow.stagesFlow[0];

  const handlePrintJobCard = () => {
    window.print();
  };

  // Totals calculations
  let totalOrdered = 0;
  let totalPlanned = 0;
  let totalProduced = 0;
  let totalRejected = 0;
  let totalGood = 0;
  let totalRemaining = 0;

  sizeMatrix.forEach((row) => {
    totalOrdered += row.orderedQuantity;
    totalPlanned += row.plannedQuantity;
    totalProduced += row.producedQuantity;
    totalRejected += row.rejectedQuantity;
    totalGood += row.goodQuantity;
    totalRemaining += row.remainingQuantity;
  });

  const progressPercentage = totalPlanned > 0 ? Math.min(100, Math.round((totalGood / totalPlanned) * 100)) : 0;
  const isCompleted = productionOrder.status === 'COMPLETED' || productionOrder.currentStage?.name === 'READY';
  const isDelayed = new Date(productionOrder.targetCompletionDate) < new Date() && !isCompleted;

  // Days remaining / overdue
  const targetDateObj = new Date(productionOrder.targetCompletionDate);
  const diffDays = Math.ceil((targetDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const getSizeLabel = (entry: any) => {
    if (entry.size?.name) return `Size ${entry.size.name}`;
    if (!entry.sizeId) return 'All Sizes';

    const match = currentSet?.setSizes?.find(
      (ss) => ss.sizeId === entry.sizeId || ss.id === entry.sizeId || ss.size?.id === entry.sizeId
    );
    if (match?.size?.name) return `Size ${match.size.name}`;

    for (const s of allSets) {
      const found = s.setSizes?.find(
        (ss) => ss.sizeId === entry.sizeId || ss.id === entry.sizeId || ss.size?.id === entry.sizeId
      );
      if (found?.size?.name) return `Size ${found.size.name}`;
    }

    const cleanId = String(entry.sizeId).replace(/^(sz-|size-)/i, '');
    return `Size ${cleanId}`;
  };

  const handleStageMove = async (targetStageId: string) => {
    if (!targetStageId || targetStageId === productionOrder.currentStageId) return;
    setIsAdvancing(true);
    try {
      await ProductionService.advanceStage(productionOrder.id, targetStageId);
      setSelectedViewingStageId(targetStageId);
      onStageAdvanced();
    } catch (err) {
      console.error('Failed to move stage:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleFastTrackToReady = async () => {
    const readyStage = stages.find((s) => s.name === 'READY') || stages[stages.length - 1];
    if (!readyStage) return;

    setIsAdvancing(true);
    try {
      const availableSizes = currentSet?.setSizes || [];
      let fastTrackEntries: { sizeId: string; quantityPassed: number; quantityRejected: number }[] = [];
      
      if (productionOrder.plannedSizes && Object.keys(productionOrder.plannedSizes).length > 0) {
        fastTrackEntries = Object.entries(productionOrder.plannedSizes)
          .map(([sizeId, qty]) => {
            const planned = Number(qty) || 0;
            const alreadyPassedTotal = (productionOrder.entries || [])
              .filter((e) => e.sizeId === sizeId && (e.stageId === readyStage.id || e.stage?.name === 'READY'))
              .reduce((sum, e) => sum + e.quantityPassed, 0);
            const remainingToPass = Math.max(0, planned - alreadyPassedTotal);
            return {
              sizeId,
              quantityPassed: remainingToPass,
              quantityRejected: 0,
            };
          })
          .filter((e) => e.quantityPassed > 0);
      } else {
        fastTrackEntries = availableSizes.map((ss) => {
          const planned = (productionOrder.order?.orderItems?.find((oi) => oi.sizeId === ss.sizeId)?.quantity) || 0;
          const alreadyPassedTotal = (productionOrder.entries || [])
            .filter((e) => e.sizeId === ss.sizeId && (e.stageId === readyStage.id || e.stage?.name === 'READY'))
            .reduce((sum, e) => sum + e.quantityPassed, 0);
          const remainingToPass = Math.max(0, planned - alreadyPassedTotal);
          return {
            sizeId: ss.sizeId,
            quantityPassed: remainingToPass,
            quantityRejected: 0,
          };
        }).filter((e) => e.quantityPassed > 0);
      }

      if (fastTrackEntries.length > 0) {
        await ProductionService.logProductionEntry({
          productionOrderId: productionOrder.id,
          stageId: readyStage.id,
          entries: fastTrackEntries,
          operatorName: 'Owner Fast-Track Clearance',
          notes: 'Auto-completed via Owner 1-Click Fast Track',
        });
      }

      // 2. Advance stage to READY
      await ProductionService.advanceStage(productionOrder.id, readyStage.id, 'Fast-tracked directly to READY');
      setShowFastTrackConfirm(false);
      onStageAdvanced();
    } catch (err) {
      console.error('Failed to fast track batch:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Quick 1-Click Complete Current Stage & Advance to Next
  const handleQuickCompleteCurrentStage = async () => {
    if (!nextStage) return;
    setIsAdvancing(true);
    try {
      const currentStageFlowObj = stageFlow.stagesFlow.find((s) => s.stageId === productionOrder.currentStageId);
      let stageEntries: { sizeId: string; quantityPassed: number; quantityRejected: number }[] = [];
      
      // Complete only remaining pieces that actually reached the current stage!
      if (currentStageFlowObj) {
        stageEntries = currentStageFlowObj.sizeBreakdown
          .map((sb) => ({
            sizeId: sb.sizeId,
            quantityPassed: sb.stageRemaining,
            quantityRejected: 0,
          }))
          .filter((e) => e.quantityPassed > 0);
      }

      if (stageEntries.length > 0) {
        await ProductionService.logProductionEntry({
          productionOrderId: productionOrder.id,
          stageId: productionOrder.currentStageId,
          entries: stageEntries,
          operatorName: 'Supervisor Approval',
          notes: `Stage ${productionOrder.currentStage?.name} completed and advanced to ${nextStage.name}`,
        });
      }

      await ProductionService.advanceStage(productionOrder.id, nextStage.id);
      setSelectedViewingStageId(nextStage.id);
      onStageAdvanced();
    } catch (err) {
      console.error('Failed to complete stage:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Delete Entire Production Order
  const handleDeleteProductionOrder = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteOrder) {
        await onDeleteOrder(productionOrder.id);
      } else {
        await ProductionService.deleteProductionOrder(productionOrder.id);
      }
      onClose();
      onStageAdvanced();
    } catch (err) {
      console.error('Failed to delete production order:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Production Order: ${productionOrder.productionNumber}`}
      subtitle={`${productionOrder.product?.name} (${productionOrder.set?.name || 'Standard Set'})`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Delete Confirmation Modal Banner */}
        {showDeleteConfirm && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/40 text-rose-200 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-100">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete Production Order #{productionOrder.productionNumber}?</span>
            </div>
            <p className="text-xs text-rose-200/90">
              Kya aap sach me is production batch ko delete karna chahte hain? Isse associated production entries aur WIP stage logs permanently remove ho jayenge.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteProductionOrder}
                isLoading={isDeleting}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Yes, Delete Work Order
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Fast Track Confirmation Modal Banner */}
        {showFastTrackConfirm && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-100">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Fast-Track Entire Batch to READY Stock?</span>
            </div>
            <p className="text-xs text-amber-200/90">
              Yeh action batch ke saare <strong>{productionOrder.totalPlannedQty} pcs</strong> ko instant QC-Pass mark karke direct <strong>Finished Goods Ready Stock</strong> mein add kar dega aur status <strong>COMPLETED</strong> kar dega.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="accent"
                onClick={handleFastTrackToReady}
                isLoading={isAdvancing}
                icon={<Zap className="w-3.5 h-3.5" />}
              >
                Confirm & Add to Ready Stock
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFastTrackConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Top Header Card */}
        <div className="p-4 rounded-xl bg-factory-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-black text-slate-100 font-mono">{productionOrder.productionNumber}</span>
              <Badge variant={isCompleted ? 'success' : 'primary'}>
                Floor: {productionOrder.currentStage?.name || 'PLANNING'}
              </Badge>
              {isDelayed && (
                <Badge variant="danger" size="sm">
                  Overdue by {Math.abs(diffDays)} days
                </Badge>
              )}
              {!isDelayed && !isCompleted && diffDays >= 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Due in {diffDays} days
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                {productionOrder.order ? 'CUSTOMER ORDER' : 'READY STOCK BUILD'}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
              {productionOrder.variantId && (
                <span className="text-slate-300 font-medium">
                  🎨 Colorway: <strong>{productionOrder.variantId}</strong>
                </span>
              )}
              {productionOrder.order && (
                <span>
                  • Customer: <strong className="text-slate-200">{productionOrder.order.customer?.name}</strong> (Order #{productionOrder.order.orderNumber})
                </span>
              )}
              <span>
                • Target: <strong className="text-slate-200">{new Date(productionOrder.targetCompletionDate).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Planned Output</div>
              <div className="text-lg font-black text-slate-100">{productionOrder.totalPlannedQty.toLocaleString()} pcs</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Good Pcs</div>
              <div className="text-lg font-black text-emerald-400">{totalGood.toLocaleString()} pcs</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Progress</div>
              <div className="text-lg font-black text-primary-400">{progressPercentage}%</div>
            </div>
          </div>
        </div>

        {/* Visual 7-Stage Workflow Progress Stepper (Interactive Jump / Skip / View) */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Manufacturing Pipeline & WIP Flow
              </span>
              <span className="text-[11px] text-slate-400">
                Click any stage card below to inspect its exact piece flow or shift active manufacturing
              </span>
            </div>

            {/* Direct Stage Jump Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <ArrowRightLeft className="w-3 h-3 text-primary-400" /> Active Stage:
              </span>
              <select
                value={productionOrder.currentStageId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  handleStageMove(targetId);
                }}
                disabled={isAdvancing}
                className="px-2.5 py-1 rounded-lg bg-factory-900 border border-slate-700 text-slate-200 text-xs focus:border-primary-500 outline-none font-semibold cursor-pointer"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    Step {st.sequence}: {st.name} {st.id === productionOrder.currentStageId ? '(Current Floor)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Stepper Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
            {stageFlow.stagesFlow.map((flow) => {
              const isCurrentActive = flow.stageId === productionOrder.currentStageId;
              const isViewing = flow.stageId === activeViewingStage?.stageId;
              const isFullyDone = flow.status === 'COMPLETED';
              const isInProgress = flow.status === 'IN_PROGRESS';
              const isWaiting = flow.status === 'WAITING';

              return (
                <button
                  key={flow.stageId}
                  type="button"
                  onClick={() => setSelectedViewingStageId(flow.stageId)}
                  title={`Click to view Step ${flow.sequence}: ${flow.stageName} size breakdown`}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group relative flex flex-col justify-between min-h-[90px] ${
                    isViewing
                      ? 'ring-2 ring-primary-400 border-primary-500 bg-primary-950/70 shadow-lg shadow-primary-500/20'
                      : isCurrentActive
                      ? 'bg-indigo-950/40 border-indigo-500/60'
                      : isFullyDone
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400'
                      : isInProgress
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40 hover:border-amber-400'
                      : 'bg-factory-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="text-slate-300">Step {flow.sequence}</span>
                      {isFullyDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {isInProgress && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      {isCurrentActive && !isFullyDone && !isInProgress && (
                        <span className="w-2 h-2 rounded-full bg-primary-400" />
                      )}
                    </div>
                    <div className={`text-xs font-black truncate ${isViewing ? 'text-primary-200' : isFullyDone ? 'text-emerald-400' : isCurrentActive ? 'text-indigo-200' : 'text-slate-200'}`}>
                      {flow.stageName}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/50 mt-1">
                    {flow.stageName === 'PLANNING' ? (
                      <div className="text-[10px] text-emerald-400 font-bold">✓ {flow.inputAvailable} pcs</div>
                    ) : isFullyDone ? (
                      <div className="text-[10px] text-emerald-400 font-bold">✓ {flow.totalPassed}/{flow.inputAvailable} pcs</div>
                    ) : isInProgress ? (
                      <div>
                        <div className="text-[10px] text-amber-300 font-bold">{flow.totalPassed}/{flow.inputAvailable} Done</div>
                        <div className="text-[9px] text-amber-400/80">{flow.remainingInStage} pcs pending</div>
                      </div>
                    ) : flow.inputAvailable > 0 ? (
                      <div className="text-[10px] text-sky-300 font-semibold">{flow.inputAvailable} pcs ready</div>
                    ) : (
                      <div className="text-[9px] text-slate-400 italic">Waiting...</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Stage Progression Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span>Current Floor Stage: <strong className="text-primary-300 font-bold">{productionOrder.currentStage?.name}</strong></span>
              {activeViewingStage && activeViewingStage.stageId !== productionOrder.currentStageId && (
                <button
                  type="button"
                  onClick={() => handleStageMove(activeViewingStage.stageId)}
                  disabled={isAdvancing}
                  className="px-2 py-0.5 rounded bg-primary-600/20 text-primary-300 border border-primary-500/40 text-[10px] font-bold hover:bg-primary-600/40"
                >
                  ⚡ Shift Floor to {activeViewingStage.stageName}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {nextStage && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStageMove(nextStage.id)}
                    isLoading={isAdvancing}
                    icon={<FastForward className="w-3.5 h-3.5" />}
                  >
                    Skip to {nextStage.name}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleQuickCompleteCurrentStage}
                    isLoading={isAdvancing}
                    icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                  >
                    1-Click Complete & Advance
                  </Button>
                </>
              )}

              {!isCompleted && (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setShowFastTrackConfirm(true)}
                  icon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
                >
                  ⚡ Fast-Track to READY
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Size-Wise Production Tracking Matrix */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {viewMode === 'STAGE_FLOW'
                  ? `Stage WIP Breakdown — Step ${activeViewingStage?.sequence}: ${activeViewingStage?.stageName}`
                  : `Master Batch Matrix — ${productionOrder.set?.name || 'Standard Set'}`}
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-factory-900 border border-slate-700/80 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setViewMode('STAGE_FLOW')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'STAGE_FLOW'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📍 Stage WIP Flow ({activeViewingStage?.stageName})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('OVERALL')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'OVERALL'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 Overall Batch Totals
              </button>
            </div>
          </div>

          {viewMode === 'STAGE_FLOW' && activeViewingStage && (
            <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 text-xs text-sky-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong>Piece Movement Rule:</strong> Only pieces produced in previous stages can be worked in <strong>Step {activeViewingStage.sequence}: {activeViewingStage.stageName}</strong>. Unproduced pieces remain at their respective stages.
              </div>
              <div className="text-[11px] font-semibold text-slate-300">
                Stage Received: <strong className="text-sky-300">{activeViewingStage.inputAvailable} pcs</strong> | Passed: <strong className="text-emerald-400">{activeViewingStage.totalPassed} pcs</strong> | Pending at this Step: <strong className="text-amber-400">{activeViewingStage.remainingInStage} pcs</strong>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {viewMode === 'STAGE_FLOW' && activeViewingStage ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-factory-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3 text-center">Total Planned</th>
                    <th className="p-3 text-center text-sky-300">Input from Prior Step</th>
                    <th className="p-3 text-center text-emerald-400">Passed in this Step</th>
                    <th className="p-3 text-center text-rose-400">Rejected</th>
                    <th className="p-3 text-center text-amber-400">Pending at this Step</th>
                    <th className="p-3 text-center text-slate-400">Prior Stage Pending</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {activeViewingStage.sizeBreakdown.map((row) => (
                    <tr key={row.sizeId} className="hover:bg-factory-900/40">
                      <td className="p-3 font-bold text-slate-100">
                        Size {row.sizeName}
                      </td>
                      <td className="p-3 text-center text-slate-300">{row.totalPlanned}</td>
                      <td className="p-3 text-center font-bold text-sky-300">{row.inputAvailable}</td>
                      <td className="p-3 text-center font-bold text-emerald-400">{row.stagePassed}</td>
                      <td className="p-3 text-center font-bold text-rose-400">
                        {row.stageRejected > 0 ? `-${row.stageRejected}` : '0'}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-400">{row.stageRemaining}</td>
                      <td className="p-3 text-center text-slate-400">
                        {row.priorStagePending > 0 ? (
                          <span className="text-amber-400/80 font-semibold">{row.priorStagePending} pcs</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.stageRemaining === 0 && row.stagePassed >= row.totalPlanned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            ✓ Complete
                          </span>
                        ) : row.stageRemaining > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {row.stageRemaining} pcs WIP
                          </span>
                        ) : row.inputAvailable === 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Waiting
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                            In Flow
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-factory-900/90 font-black text-xs border-t border-slate-700">
                  <tr>
                    <td className="p-3 text-slate-200 uppercase">Stage Total ({activeViewingStage.stageName})</td>
                    <td className="p-3 text-center text-slate-200">{totalPlanned}</td>
                    <td className="p-3 text-center text-sky-300">{activeViewingStage.inputAvailable}</td>
                    <td className="p-3 text-center text-emerald-400">{activeViewingStage.totalPassed}</td>
                    <td className="p-3 text-center text-rose-400">-{activeViewingStage.totalRejected}</td>
                    <td className="p-3 text-center text-amber-400">{activeViewingStage.remainingInStage}</td>
                    <td className="p-3 text-center text-slate-400">{activeViewingStage.priorStagePending}</td>
                    <td className="p-3 text-center text-primary-400 font-bold">
                      {activeViewingStage.status}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-factory-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3 text-center">Ordered</th>
                    <th className="p-3 text-center">Planned</th>
                    <th className="p-3 text-center">Produced</th>
                    <th className="p-3 text-center text-rose-400">Rejected</th>
                    <th className="p-3 text-center text-emerald-400">Good Pcs</th>
                    <th className="p-3 text-center text-amber-400">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {sizeMatrix.map((row) => (
                    <tr key={row.sizeId} className="hover:bg-factory-900/40">
                      <td className="p-3 font-bold text-slate-100">
                        Size {row.sizeName}
                      </td>
                      <td className="p-3 text-center text-slate-400">{row.orderedQuantity}</td>
                      <td className="p-3 text-center font-semibold text-slate-200">{row.plannedQuantity}</td>
                      <td className="p-3 text-center font-bold text-slate-100">{row.producedQuantity}</td>
                      <td className="p-3 text-center font-bold text-rose-400">
                        {row.rejectedQuantity > 0 ? `-${row.rejectedQuantity}` : '0'}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-400">{row.goodQuantity}</td>
                      <td className="p-3 text-center font-bold text-amber-400">{row.remainingQuantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-factory-900/90 font-black text-xs border-t border-slate-700">
                  <tr>
                    <td className="p-3 text-slate-200 uppercase">Total (All Sizes)</td>
                    <td className="p-3 text-center text-slate-400">{totalOrdered}</td>
                    <td className="p-3 text-center text-slate-200">{totalPlanned}</td>
                    <td className="p-3 text-center text-slate-100">{totalProduced}</td>
                    <td className="p-3 text-center text-rose-400">-{totalRejected}</td>
                    <td className="p-3 text-center text-emerald-400">{totalGood}</td>
                    <td className="p-3 text-center text-amber-400">{totalRemaining}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Production Shift Entries & Quality Inspection History */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Shift Output & Rejection Audit Log ({productionOrder.entries?.length || 0})
              </span>
            </div>
            <Button
              size="sm"
              onClick={onOpenLogModal}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Log Shift Output
            </Button>
          </div>

          {(!productionOrder.entries || productionOrder.entries.length === 0) ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-factory-900/40 rounded-lg border border-slate-800">
              No daily entries recorded yet. Click "Log Shift Output" to record passed and rejected quantities, or use "1-Click Complete & Advance".
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {productionOrder.entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-factory-900 border border-slate-800 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">
                        {getSizeLabel(entry)}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-emerald-400 font-bold">+{entry.quantityPassed} passed</span>
                      {entry.quantityRejected > 0 && (
                        <span className="text-rose-400 font-bold">
                          (-{entry.quantityRejected} rejected: {entry.rejectionReason})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Logged by {entry.operatorName || 'Floor Operator'} on {new Date(entry.entryDate).toLocaleString()}
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="text-[11px] text-slate-400 italic">
                      "{entry.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintJobCard}
              icon={<Printer className="w-4 h-4 text-slate-300" />}
            >
              Print Route Slip
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete Order
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {nextStage && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => handleStageMove(nextStage.id)}
                isLoading={isAdvancing}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Advance to {nextStage.name}
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
