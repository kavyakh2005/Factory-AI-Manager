import React from 'react';
import { ProductionOrder, ProductionStage } from '../../types';
import { Badge } from '../common/Badge';
import { ArrowRight, Clock, AlertTriangle, User, Layers } from 'lucide-react';

interface StageKanbanPipelineProps {
  stages: ProductionStage[];
  productionOrders: ProductionOrder[];
  onSelectOrder: (order: ProductionOrder) => void;
  onAdvanceStage: (orderId: string, targetStageId: string) => void;
}

export const StageKanbanPipeline: React.FC<StageKanbanPipelineProps> = ({
  stages,
  productionOrders,
  onSelectOrder,
  onAdvanceStage,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
      {stages.map((stage, idx) => {
        const stageOrders = productionOrders.filter(
          (p) => p.currentStageId === stage.id || p.currentStage?.name === stage.name
        );
        const nextStage = idx < stages.length - 1 ? stages[idx + 1] : null;

        return (
          <div
            key={stage.id}
            className="flex flex-col rounded-xl bg-factory-950 border border-slate-800 min-w-[240px] max-h-[75vh]"
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
                {stageOrders.length}
              </span>
            </div>

            {/* Orders Cards List */}
            <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
              {stageOrders.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-slate-500 italic">
                  No orders in this stage
                </div>
              ) : (
                stageOrders.map((order) => {
                  const isDelayed =
                    new Date(order.targetCompletionDate) < new Date() &&
                    order.status !== 'COMPLETED' &&
                    stage.name !== 'READY';

                  const goodQty = Math.max(0, order.totalCompletedQty - order.totalRejectedQty);
                  const progressPct =
                    order.totalPlannedQty > 0
                      ? Math.min(100, Math.round((goodQty / order.totalPlannedQty) * 100))
                      : 0;

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="p-3 rounded-lg bg-factory-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2.5 shadow-sm group hover:shadow-md"
                    >
                      {/* Top Row: Batch # & Status */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-100 group-hover:text-primary-300 transition-colors">
                          {order.productionNumber}
                        </span>
                        {isDelayed && (
                          <Badge variant="danger" size="sm">
                            Delayed
                          </Badge>
                        )}
                      </div>

                      {/* Product & Set Name */}
                      <div>
                        <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {order.product?.name || 'Garment Product'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-400" />
                          <span>{order.set?.name || 'Standard Set'}</span>
                        </div>
                      </div>

                      {/* Customer info if linked to order */}
                      {order.order && (
                        <div className="text-[10px] text-slate-400 truncate">
                          Cust: <strong className="text-slate-300">{order.order.customer?.name}</strong>
                        </div>
                      )}

                      {/* Size Matrix Breakdown Chips */}
                      {order.plannedSizes && Object.keys(order.plannedSizes).length > 0 && (
                        <div className="flex flex-wrap gap-1 py-0.5">
                          {Object.entries(order.plannedSizes).map(([szId, qty]) => {
                            const sizeObj = order.set?.setSizes?.find((ss) => ss.sizeId === szId)?.size;
                            const szName = sizeObj?.name || szId;
                            return (
                              <span key={szId} className="px-1.5 py-0.5 rounded bg-factory-950 border border-slate-800 text-[10px] text-slate-300 font-mono">
                                {szName}: <strong className="text-primary-300">{qty}</strong>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                          <span>Output: {goodQty}/{order.totalPlannedQty} pcs</span>
                          <span className="font-bold text-slate-300">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-factory-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className="bg-primary-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Assigned Line & Advance Action */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
                        <div className="text-slate-400 flex items-center gap-1 truncate max-w-[120px]">
                          <User className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{order.assignedTeam || 'Floor Line 1'}</span>
                        </div>

                        {nextStage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdvanceStage(order.id, nextStage.id);
                            }}
                            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold hover:underline"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
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
