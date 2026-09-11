import React, { useState } from 'react';
import { ProductionOrder, ProductionStage, RejectionReason, Set } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ProductionService } from '../../services/production/productionService';
import { CheckCircle2, AlertTriangle, User, AlertCircle } from 'lucide-react';

interface LogProductionEntryModalProps {
  productionOrder: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
  stages: ProductionStage[];
  rejectionReasons: RejectionReason[];
  allSets: Set[];
  onEntryLogged: () => void;
}

export const LogProductionEntryModal: React.FC<LogProductionEntryModalProps> = ({
  productionOrder,
  isOpen,
  onClose,
  stages,
  rejectionReasons,
  allSets,
  onEntryLogged,
}) => {
  if (!productionOrder) return null;

  const currentSet = allSets.find((s) => s.id === productionOrder.setId) || productionOrder.set;
  const availableSizes = currentSet?.setSizes || [];

  const [selectedStageId, setSelectedStageId] = useState<string>(
    productionOrder.currentStageId || stages[0]?.id || ''
  );
  const [operatorName, setOperatorName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [entries, setEntries] = useState<
    Record<string, { passed: number; rejected: number; rejectionReason: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePassedChange = (sizeId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setEntries((prev) => ({
      ...prev,
      [sizeId]: {
        passed: num,
        rejected: prev[sizeId]?.rejected || 0,
        rejectionReason: prev[sizeId]?.rejectionReason || rejectionReasons[0]?.name || 'Fabric Defect / Flaw',
      },
    }));
  };

  const handleRejectedChange = (sizeId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setEntries((prev) => ({
      ...prev,
      [sizeId]: {
        passed: prev[sizeId]?.passed || 0,
        rejected: num,
        rejectionReason: prev[sizeId]?.rejectionReason || rejectionReasons[0]?.name || 'Fabric Defect / Flaw',
      },
    }));
  };

  const handleReasonChange = (sizeId: string, reason: string) => {
    setEntries((prev) => ({
      ...prev,
      [sizeId]: {
        passed: prev[sizeId]?.passed || 0,
        rejected: prev[sizeId]?.rejected || 0,
        rejectionReason: reason,
      },
    }));
  };

  let totalPassedBatch = 0;
  let totalRejectedBatch = 0;

  Object.values(entries).forEach((e) => {
    totalPassedBatch += e.passed || 0;
    totalRejectedBatch += e.rejected || 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalPassedBatch === 0 && totalRejectedBatch === 0) {
      setErrorMessage('Please enter passed or rejected quantities for at least one size.');
      return;
    }

    const payloadEntries = Object.entries(entries).map(([sizeId, val]) => ({
      sizeId,
      quantityPassed: val.passed,
      quantityRejected: val.rejected,
      rejectionReason: val.rejected > 0 ? val.rejectionReason : undefined,
    }));

    setIsSubmitting(true);
    try {
      await ProductionService.logProductionEntry({
        productionOrderId: productionOrder.id,
        stageId: selectedStageId,
        entries: payloadEntries,
        operatorName: operatorName.trim() || undefined,
        notes,
      });

      onEntryLogged();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to log production entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Floor Output: ${productionOrder.productionNumber}`}
      subtitle={`${productionOrder.product?.name} (${productionOrder.set?.name || 'Standard Set'})`}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stage & Operator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-factory-950 border border-slate-800">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Manufacturing Stage *
            </label>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-bold"
            >
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  Step {st.sequence}: {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-primary-400" />
              <span>Operator / Line Tailor Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Verma (Line A)"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Size-wise Log Input Table */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Size-Wise Stage Output & Quality Inspection
              </span>
              <span className="text-[11px] text-slate-400">
                Track exact pieces planned during order booking vs passed in current manufacturing stage
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const autoFilled: Record<string, { passed: number; rejected: number; rejectionReason: string }> = {};
                  availableSizes.forEach((ss) => {
                    const plannedQty = productionOrder.plannedSizes?.[ss.sizeId] || (productionOrder.order?.orderItems?.find((oi) => oi.sizeId === ss.sizeId)?.quantity) || 0;
                    const passedSoFar = (productionOrder.entries || []).filter((e) => e.sizeId === ss.sizeId && (e.stageId === selectedStageId || e.stage?.id === selectedStageId)).reduce((sum, e) => sum + e.quantityPassed, 0);
                    const remaining = Math.max(0, plannedQty - passedSoFar);
                    autoFilled[ss.sizeId] = {
                      passed: remaining,
                      rejected: 0,
                      rejectionReason: rejectionReasons[0]?.name || 'Fabric Defect / Flaw',
                    };
                  });
                  setEntries(autoFilled);
                }}
                className="px-2.5 py-1 rounded-lg bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/40 text-[11px] font-semibold transition-all"
              >
                ⚡ Autofill Remaining Target
              </button>
              <div className="flex items-center gap-2 text-[11px] ml-auto sm:ml-0">
                <span className="text-emerald-400 font-bold">Passed: {totalPassedBatch} pcs</span>
                <span className="text-rose-400 font-bold">Rejected: {totalRejectedBatch} pcs</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {availableSizes.map((ss) => {
              const row = entries[ss.sizeId] || { passed: 0, rejected: 0, rejectionReason: '' };
              const plannedQty = productionOrder.plannedSizes?.[ss.sizeId] || (productionOrder.order?.orderItems?.find((oi) => oi.sizeId === ss.sizeId)?.quantity) || 0;
              const passedSoFar = (productionOrder.entries || []).filter((e) => e.sizeId === ss.sizeId && (e.stageId === selectedStageId || e.stage?.id === selectedStageId)).reduce((sum, e) => sum + e.quantityPassed, 0);
              const rejectedSoFar = (productionOrder.entries || []).filter((e) => e.sizeId === ss.sizeId && (e.stageId === selectedStageId || e.stage?.id === selectedStageId)).reduce((sum, e) => sum + e.quantityRejected, 0);
              const remaining = Math.max(0, plannedQty - passedSoFar);

              return (
                <div
                  key={ss.sizeId}
                  className="p-3 rounded-lg bg-factory-900/90 border border-slate-800 space-y-2.5"
                >
                  {/* Top Stats Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary-600/20 text-primary-300 font-bold border border-primary-500/30 text-xs">
                        Size {ss.size?.name || ss.sizeId}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="text-slate-400">
                        🎯 Planning Target: <strong className="text-slate-100 font-semibold">{plannedQty} pcs</strong>
                      </span>
                      <span className="text-slate-400">
                        ✅ Passed So Far: <strong className="text-emerald-400 font-semibold">{passedSoFar} pcs</strong>
                      </span>
                      {rejectedSoFar > 0 && (
                        <span className="text-slate-400">
                          ❌ Rejected: <strong className="text-rose-400 font-semibold">{rejectedSoFar} pcs</strong>
                        </span>
                      )}
                      <span className="text-slate-400">
                        ⏳ Remaining: <strong className="text-amber-400 font-semibold">{remaining} pcs</strong>
                      </span>
                    </div>
                  </div>

                  {/* Input Form Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Passed Qty */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] text-emerald-400 font-semibold mb-0.5">
                        Passed in This Shift (Good Pcs)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.passed === 0 ? '' : row.passed}
                        onChange={(e) => handlePassedChange(ss.sizeId, e.target.value)}
                        className="w-full text-center py-1.5 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Rejected Qty */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-rose-400 font-semibold mb-0.5">
                        Rejected (Defects)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.rejected === 0 ? '' : row.rejected}
                        onChange={(e) => handleRejectedChange(ss.sizeId, e.target.value)}
                        className="w-full text-center py-1.5 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* Defect Reason */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                        Defect Reason
                      </label>
                      <select
                        disabled={row.rejected === 0}
                        value={row.rejectionReason || rejectionReasons[0]?.name || ''}
                        onChange={(e) => handleReasonChange(ss.sizeId, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-[11px] focus:border-primary-500 outline-none disabled:opacity-40"
                      >
                        {rejectionReasons.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Shift & Quality Remarks
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Afternoon shift line output completed, inspected by QC head..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            isLoading={isSubmitting}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Save Shift Production Output
          </Button>
        </div>
      </form>
    </Modal>
  );
};
