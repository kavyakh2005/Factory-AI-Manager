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
} from 'lucide-react';

interface ProductionDetailsModalProps {
  productionOrder: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
  stages: ProductionStage[];
  allSets: Set[];
  onOpenLogModal: () => void;
  onStageAdvanced: () => void;
}

export const ProductionDetailsModal: React.FC<ProductionDetailsModalProps> = ({
  productionOrder,
  isOpen,
  onClose,
  stages,
  allSets,
  onOpenLogModal,
  onStageAdvanced,
}) => {
  if (!productionOrder) return null;

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showFastTrackConfirm, setShowFastTrackConfirm] = useState(false);
  const [selectedJumpStageId, setSelectedJumpStageId] = useState<string>('');

  const currentStageIndex = stages.findIndex((s) => s.id === productionOrder.currentStageId || s.name === productionOrder.currentStage?.name);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null;

  // Calculate dynamic size-wise breakdown
  const sizeMatrix = ProductionService.calculateSizeWiseMatrix(productionOrder, allSets);

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

    const currentSet = allSets.find((s) => s.id === productionOrder.setId) || productionOrder.set;
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
      const currentSet = allSets.find((s) => s.id === productionOrder.setId) || productionOrder.set;
      const availableSizes = currentSet?.setSizes || [];
      
      let fastTrackEntries: { sizeId: string; quantityPassed: number; quantityRejected: number }[] = [];
      
      if (productionOrder.plannedSizes && Object.keys(productionOrder.plannedSizes).length > 0) {
        fastTrackEntries = Object.entries(productionOrder.plannedSizes)
          .map(([sizeId, qty]) => {
            const planned = Number(qty) || 0;
            const alreadyPassedTotal = (productionOrder.entries || [])
              .filter((e) => e.sizeId === sizeId)
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
            .filter((e) => e.sizeId === ss.sizeId)
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
      const currentSet = allSets.find((s) => s.id === productionOrder.setId) || productionOrder.set;
      const availableSizes = currentSet?.setSizes || [];
      
      let stageEntries: { sizeId: string; quantityPassed: number; quantityRejected: number }[] = [];
      
      // Calculate ONLY remaining unpassed pieces for the current stage!
      if (productionOrder.plannedSizes && Object.keys(productionOrder.plannedSizes).length > 0) {
        stageEntries = Object.entries(productionOrder.plannedSizes)
          .map(([sizeId, qty]) => {
            const planned = Number(qty) || 0;
            const alreadyPassedInStage = (productionOrder.entries || [])
              .filter((e) => e.sizeId === sizeId && (e.stageId === productionOrder.currentStageId || e.stage?.id === productionOrder.currentStageId))
              .reduce((sum, e) => sum + e.quantityPassed, 0);
            const remainingToPass = Math.max(0, planned - alreadyPassedInStage);
            return {
              sizeId,
              quantityPassed: remainingToPass,
              quantityRejected: 0,
            };
          })
          .filter((e) => e.quantityPassed > 0);
      } else {
        stageEntries = availableSizes.map((ss) => {
          const planned = (productionOrder.order?.orderItems?.find((oi) => oi.sizeId === ss.sizeId)?.quantity) || 0;
          const alreadyPassedInStage = (productionOrder.entries || [])
            .filter((e) => e.sizeId === ss.sizeId && (e.stageId === productionOrder.currentStageId || e.stage?.id === productionOrder.currentStageId))
            .reduce((sum, e) => sum + e.quantityPassed, 0);
          const remainingToPass = Math.max(0, planned - alreadyPassedInStage);
          return {
            sizeId: ss.sizeId,
            quantityPassed: remainingToPass,
            quantityRejected: 0,
          };
        }).filter((e) => e.quantityPassed > 0);
      }

      if (stageEntries.length > 0) {
        await ProductionService.logProductionEntry({
          productionOrderId: productionOrder.id,
          stageId: productionOrder.currentStageId,
          entries: stageEntries,
          operatorName: 'Supervisor Approval',
          notes: `Stage ${productionOrder.currentStage?.name} completed`,
        });
      }

      await ProductionService.advanceStage(productionOrder.id, nextStage.id);
      onStageAdvanced();
    } catch (err) {
      console.error('Failed to complete stage:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handlePrintJobCard = () => {
    window.print();
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
                {productionOrder.currentStage?.name || 'PLANNING'}
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

        {/* Visual 7-Stage Workflow Progress Stepper (Interactive Jump / Skip) */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Manufacturing Pipeline Progression
              </span>
              <span className="text-[11px] text-slate-400">
                Click on any stage below to directly jump or skip intermediate steps
              </span>
            </div>

            {/* Direct Stage Jump Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <ArrowRightLeft className="w-3 h-3 text-primary-400" /> Jump to:
              </span>
              <select
                value={selectedJumpStageId || productionOrder.currentStageId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  setSelectedJumpStageId(targetId);
                  handleStageMove(targetId);
                }}
                disabled={isAdvancing}
                className="px-2.5 py-1 rounded-lg bg-factory-900 border border-slate-700 text-slate-200 text-xs focus:border-primary-500 outline-none font-semibold cursor-pointer"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    Step {st.sequence}: {st.name} {st.id === productionOrder.currentStageId ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Stepper Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
            {stages.map((st, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isFuture = idx > currentStageIndex;

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStageMove(st.id)}
                  disabled={isAdvancing || isCurrent}
                  title={`Click to shift batch directly to Step ${st.sequence}: ${st.name}`}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer group relative text-left sm:text-center ${
                    isCurrent
                      ? 'bg-primary-950/70 border-primary-500 shadow-lg shadow-primary-500/20 ring-1 ring-primary-500/50'
                      : isPast
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400'
                      : 'bg-factory-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between sm:justify-center">
                    <span>Step {st.sequence}</span>
                    {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-400 inline ml-1" />}
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-ping inline ml-1" />}
                  </div>
                  <div className={`text-xs font-black truncate ${isCurrent ? 'text-primary-300' : isPast ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {st.name}
                  </div>
                  <div className="text-[9px] mt-1 text-slate-400">
                    {isCurrent ? '● Active' : isPast ? '✓ Completed' : '→ Click to Shift'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Stage Progression Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] text-slate-400">
              Current Floor Stage: <strong className="text-primary-300">{productionOrder.currentStage?.name}</strong>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Size-Wise Production Breakdown ({productionOrder.set?.name || 'Standard Set'})
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Good Qty = Produced - Rejected
            </span>
          </div>

          <div className="overflow-x-auto">
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
