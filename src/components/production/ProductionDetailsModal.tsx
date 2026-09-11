import React from 'react';
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

  const currentStageIndex = stages.findIndex((s) => s.id === productionOrder.currentStageId);
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
  const isDelayed = new Date(productionOrder.targetCompletionDate) < new Date() && productionOrder.status !== 'COMPLETED';

  const handleAdvanceStage = async () => {
    if (!nextStage) return;
    try {
      await ProductionService.advanceStage(productionOrder.id, nextStage.id);
      onStageAdvanced();
    } catch (err) {
      console.error('Failed to advance stage:', err);
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
        {/* Top Header Card */}
        <div className="p-4 rounded-xl bg-factory-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-100">{productionOrder.productionNumber}</span>
              <Badge variant="primary">{productionOrder.currentStage?.name || 'PLANNING'}</Badge>
              {isDelayed && <Badge variant="danger">Delayed</Badge>}
            </div>
            <div className="text-xs text-slate-400">
              Assigned Team: <strong className="text-slate-200">{productionOrder.assignedTeam || 'Line 1'}</strong>
              {productionOrder.order && (
                <span className="ml-2">
                  • Order #{productionOrder.order.orderNumber} ({productionOrder.order.customer?.name})
                </span>
              )}
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

        {/* Visual 7-Stage Workflow Progress Stepper */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Manufacturing Pipeline Progression
            </span>
            <span className="text-xs text-slate-400">
              Current Stage: <strong className="text-primary-300">{productionOrder.currentStage?.name}</strong>
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
            {stages.map((st, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={st.id}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? 'bg-primary-950/60 border-primary-500 shadow-lg shadow-primary-500/10'
                      : isPast
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-factory-900/50 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1">
                    Step {st.sequence}
                  </div>
                  <div className={`text-xs font-black truncate ${isCurrent ? 'text-primary-300' : isPast ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {st.name}
                  </div>
                  <div className="text-[9px] mt-1 text-slate-400">
                    {isCurrent ? '● In Progress' : isPast ? '✓ Completed' : 'Pending'}
                  </div>
                </div>
              );
            })}
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
              No daily entries recorded yet. Click "Log Shift Output" to record passed and rejected quantities.
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
                        Size {entry.size?.name || 'All'}
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
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Target Completion: {new Date(productionOrder.targetCompletionDate).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-3">
            {nextStage && (
              <Button
                variant="accent"
                size="sm"
                onClick={handleAdvanceStage}
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
