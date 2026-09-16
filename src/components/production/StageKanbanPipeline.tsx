import React from 'react';
import { ProductionOrder, ProductionStage, Set as GarmentSet } from '../../types';
import { Badge } from '../common/Badge';
import { ArrowRight, Layers, PlusCircle } from 'lucide-react';
import { ProductionService } from '../../services/production/productionService';

interface StageKanbanPipelineProps {
  stages: ProductionStage[];
  productionOrders: ProductionOrder[];
  allSets?: GarmentSet[];
  onSelectOrder: (order: ProductionOrder, stageId?: string) => void;
  onAdvanceStage: (orderId: string, targetStageId: string) => void;
  onLogEntry?: (order: ProductionOrder, stageId: string) => void;
}

export const StageKanbanPipeline: React.FC<StageKanbanPipelineProps> = ({
  stages,
  productionOrders,
  allSets = [],
  onSelectOrder,
  onAdvanceStage,
  onLogEntry,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
      {stages.map((stage, idx) => {
        const nextStage = idx < stages.length - 1 ? stages[idx + 1] : null;

        // Compute orders that have presence/active pieces in this stage
        const stageCards = productionOrders
          .map((order) => {
            const setObj = (allSets.find((s) => s.id === order.setId) || order.set) as GarmentSet;
            const flow = ProductionService.calculateStageFlow(order, stages, setObj || ({} as any));
            const flowItem = flow.stagesFlow.find(
              (sf) => sf.stageId === stage.id || sf.stageName === stage.name
            );
            return {
              order,
              flowItem,
            };
          })
          .filter(({ order, flowItem }) => {
            if (!flowItem) return false;

            const isPlanning = stage.name === 'PLANNING' || stage.sequence === 1;
            const isReady = stage.name === 'READY' || stage.sequence === stages.length;

            if (isReady) {
              return order.status === 'COMPLETED' || flowItem.totalPassed > 0;
            }

            if (isPlanning) {
              const setObj = (allSets.find((s) => s.id === order.setId) || order.set) as GarmentSet;
              const cuttingFlow = (
                ProductionService.calculateStageFlow(order, stages, setObj || ({} as any))
              ).stagesFlow.find((s) => s.sequence === 2);
              return (
                (order.currentStageId === stage.id || order.currentStage?.name === 'PLANNING') &&
                (!cuttingFlow || cuttingFlow.totalPassed === 0)
              );
            }

            // For intermediate stages (CUTTING, STITCHING, FINISHING, QC, PACKING):
            // 1. If pieces arrived/are available at this stage and there are remaining pieces in progress/pending
            if (flowItem.inputAvailable > 0 && flowItem.remainingInStage > 0) {
              return true;
            }

            // 2. If batch was newly created with this stage and no entries logged yet anywhere
            if (
              (order.currentStageId === stage.id || order.currentStage?.name === stage.name) &&
              (!order.entries || order.entries.length === 0)
            ) {
              return true;
            }

            // 3. If batch was explicitly moved to this stage and has input pieces
            if (
              (order.currentStageId === stage.id || order.currentStage?.name === stage.name) &&
              flowItem.inputAvailable > 0
            ) {
              return true;
            }

            return false;
          });

        return (
          <div
            key={stage.id}
            className="flex flex-col rounded-xl bg-factory-950 border border-slate-800 min-w-[245px] max-h-[78vh]"
          >
            {/* Column Header */}
            <div className="p-3 border-b border-slate-800/80 bg-factory-900/60 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.colorCode || '#6366F1' }}
                />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate">
                  {stage.name}
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-factory-950 text-[11px] font-bold text-slate-300 border border-slate-800">
                {stageCards.length}
              </span>
            </div>

            {/* Orders Cards List */}
            <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
              {stageCards.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-slate-500 italic">
                  No batches in this stage
                </div>
              ) : (
                stageCards.map(({ order, flowItem }) => {
                  const isDelayed =
                    new Date(order.targetCompletionDate) < new Date() &&
                    order.status !== 'COMPLETED' &&
                    stage.name !== 'READY';

                  const isReadyStage = stage.name === 'READY';
                  const stageInput = flowItem?.inputAvailable || order.totalPlannedQty;
                  const stagePassed = flowItem?.totalPassed || 0;
                  const stageRemaining = flowItem ? flowItem.remainingInStage : order.totalPlannedQty;
                  const stageProgressPct =
                    stageInput > 0 ? Math.min(100, Math.round((stagePassed / stageInput) * 100)) : 0;

                  return (
                    <div
                      key={`${order.id}-${stage.id}`}
                      onClick={() => onSelectOrder(order, stage.id)}
                      className="p-3 rounded-lg bg-factory-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2.5 shadow-sm group hover:shadow-md"
                    >
                      {/* Top Row: Batch # & Status */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-100 group-hover:text-primary-300 transition-colors truncate">
                          {order.productionNumber}
                        </span>
                        {isDelayed ? (
                          <Badge variant="danger" size="sm">
                            Delayed
                          </Badge>
                        ) : stageRemaining > 0 && !isReadyStage ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                            {stageRemaining} pcs left
                          </span>
                        ) : isReadyStage ? (
                          <Badge variant="success" size="sm">
                            Ready ({stagePassed} pcs)
                          </Badge>
                        ) : null}
                      </div>

                      {/* Product & Set Name */}
                      <div>
                        <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {order.product?.name || 'Garment Product'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">{order.set?.name || 'Standard Set'}</span>
                        </div>
                      </div>

                      {/* Customer info if linked to order */}
                      {order.order && (
                        <div className="text-[10px] text-slate-400 truncate">
                          Cust: <strong className="text-slate-300">{order.order.customer?.name}</strong>
                        </div>
                      )}

                      {/* Dynamic Stage-Wise Size Breakdown Chips */}
                      {flowItem?.sizeBreakdown && flowItem.sizeBreakdown.length > 0 ? (
                        <div className="flex flex-wrap gap-1 py-0.5">
                          {flowItem.sizeBreakdown.map((sb) => {
                            const activeSizeQty = isReadyStage
                              ? sb.stagePassed
                              : sb.stageRemaining > 0
                              ? sb.stageRemaining
                              : sb.inputAvailable;

                            return (
                              <span
                                key={sb.sizeId}
                                title={`Planned: ${sb.totalPlanned} | Arrived: ${sb.inputAvailable} | Passed in ${stage.name}: ${sb.stagePassed} | Remaining in ${stage.name}: ${sb.stageRemaining}`}
                                className="px-1.5 py-0.5 rounded bg-factory-950 border border-slate-800 text-[10px] text-slate-300 font-mono"
                              >
                                {sb.sizeName}: <strong className="text-primary-300">{activeSizeQty}</strong>
                              </span>
                            );
                          })}
                        </div>
                      ) : order.plannedSizes && Object.keys(order.plannedSizes).length > 0 ? (
                        <div className="flex flex-wrap gap-1 py-0.5">
                          {Object.entries(order.plannedSizes).map(([szId, qty]) => {
                            const sizeObj = order.set?.setSizes?.find((ss) => ss.sizeId === szId)?.size;
                            const szName = sizeObj?.name || szId;
                            return (
                              <span
                                key={szId}
                                className="px-1.5 py-0.5 rounded bg-factory-950 border border-slate-800 text-[10px] text-slate-300 font-mono"
                              >
                                {szName}: <strong className="text-primary-300">{qty}</strong>
                              </span>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* Progress Bar for this Stage */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                          <span>
                            {stage.name}: {stagePassed}/{stageInput} pcs
                          </span>
                          <span className="font-bold text-slate-300">{stageProgressPct}%</span>
                        </div>
                        <div className="w-full bg-factory-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className="bg-primary-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${stageProgressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Direct Stage Actions */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px] gap-2">
                        {/* Quick Log Entry Button */}
                        {onLogEntry && !isReadyStage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLogEntry(order, stage.id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 transition-all"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Log {stage.name}</span>
                          </button>
                        )}

                        {/* Quick Jump Dropdown */}
                        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={stage.id}
                            onChange={(e) => {
                              e.stopPropagation();
                              onAdvanceStage(order.id, e.target.value);
                            }}
                            className="w-full bg-factory-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-[10px] text-slate-300 font-medium focus:border-primary-500 outline-none cursor-pointer"
                          >
                            {stages.map((st) => (
                              <option key={st.id} value={st.id}>
                                → {st.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {nextStage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdvanceStage(order.id, nextStage.id);
                            }}
                            title={`Advance batch to ${nextStage.name}`}
                            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold px-1.5 py-0.5 rounded bg-primary-950/40 border border-primary-500/30 hover:bg-primary-900/50 transition-all shrink-0"
                          >
                            <span>Next</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
