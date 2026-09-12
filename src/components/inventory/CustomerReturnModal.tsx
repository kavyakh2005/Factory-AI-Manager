import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Product, Set, Size, ReturnQCStatus } from '../../types';
import { ProductService } from '../../services/products/productService';
import { CustomerService } from '../../services/customers/customerService';
import { FinishedGoodsService } from '../../services/inventory/finishedGoodsService';
import { RotateCcw, X, ShieldCheck, AlertOctagon, Wrench } from 'lucide-react';

interface CustomerReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnProcessed: () => void;
}

export const CustomerReturnModal: React.FC<CustomerReturnModalProps> = ({
  isOpen,
  onClose,
  onReturnProcessed,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSetId, setSelectedSetId] = useState('');
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [returnedQty, setReturnedQty] = useState(10);
  const [qcGoodQty, setQcGoodQty] = useState(10);
  const [qcDamagedQty, setQcDamagedQty] = useState(0);
  const [qcReworkQty, setQcReworkQty] = useState(0);
  const [reason, setReason] = useState('Customer fit alteration return');
  const [inspectedBy, setInspectedBy] = useState('QC Inspector 1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMasters();
    }
  }, [isOpen]);

  const loadMasters = async () => {
    try {
      const [p, s, c] = await Promise.all([
        ProductService.getProducts(),
        ProductService.getSetsWithSizes(),
        CustomerService.getCustomers(),
      ]);
      setProducts(p);
      setSets(s);
      setCustomers(c);
      if (p.length > 0) setSelectedProductId(p[0].id);
      if (s.length > 0) {
        setSelectedSetId(s[0].id);
        if (s[0].setSizes && s[0].setSizes.length > 0) {
          setSelectedSizeId(s[0].setSizes[0].sizeId);
        }
      }
      if (c.length > 0) setSelectedCustomerId(c[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetChange = (setId: string) => {
    setSelectedSetId(setId);
    const chosenSet = sets.find((s) => s.id === setId);
    if (chosenSet && chosenSet.setSizes && chosenSet.setSizes.length > 0) {
      setSelectedSizeId(chosenSet.setSizes[0].sizeId);
    }
  };

  const activeSet = sets.find((s) => s.id === selectedSetId);
  const availableSizes = activeSet?.setSizes?.map((ss) => ss.size) || [];

  const handleReturnedQtyChange = (val: number) => {
    const qty = Math.max(1, val);
    setReturnedQty(qty);
    setQcGoodQty(qty);
    setQcDamagedQty(0);
    setQcReworkQty(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qcGoodQty + qcDamagedQty + qcReworkQty !== returnedQty) {
      alert(`QC breakdown sum (${qcGoodQty + qcDamagedQty + qcReworkQty}) must equal total returned quantity (${returnedQty})!`);
      return;
    }

    try {
      setSubmitting(true);
      const cust = customers.find((c) => c.id === selectedCustomerId);
      await FinishedGoodsService.processCustomerReturn({
        customerId: selectedCustomerId,
        customerName: cust?.name,
        orderNumber,
        productId: selectedProductId,
        setId: selectedSetId,
        sizeId: selectedSizeId,
        returnedQuantity: returnedQty,
        qcPassedQuantity: qcGoodQty,
        qcDamagedQuantity: qcDamagedQty,
        qcReworkQuantity: qcReworkQty,
        reason,
        inspectedBy,
      });

      onReturnProcessed();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-factory-900 border border-slate-700 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-factory-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Customer Return & QC Inspection</h2>
              <p className="text-xs text-slate-400">Goods must pass QC before entering saleable ready stock</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Order / Invoice Ref #
              </label>
              <input
                type="text"
                placeholder="e.g. ORD-2026-0012"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Product Set
              </label>
              <select
                value={selectedSetId}
                onChange={(e) => handleSetChange(e.target.value)}
                className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Size
              </label>
              <select
                value={selectedSizeId}
                onChange={(e) => setSelectedSizeId(e.target.value)}
                className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                {availableSizes.map((sz) => sz && (
                  <option key={sz.id} value={sz.id}>
                    Size {sz.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Total Returned Quantity (Pcs)
            </label>
            <input
              type="number"
              min={1}
              value={returnedQty}
              onChange={(e) => handleReturnedQtyChange(Number(e.target.value))}
              className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* QC Inspection Routing Breakdown */}
          <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>QC Inspection Routing</span>
              <span className="text-indigo-400">Total: {qcGoodQty + qcDamagedQty + qcReworkQty} / {returnedQty} pcs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Good (Ready Stock)
                </div>
                <input
                  type="number"
                  min={0}
                  max={returnedQty}
                  value={qcGoodQty}
                  onChange={(e) => setQcGoodQty(Number(e.target.value))}
                  className="w-full bg-factory-900 border border-emerald-500/40 rounded px-2.5 py-1.5 text-sm text-emerald-300 font-bold focus:outline-none"
                />
                <span className="text-[10px] text-emerald-400/80 mt-1 block">Returns to saleable stock</span>
              </div>

              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-1">
                  <AlertOctagon className="w-3.5 h-3.5" /> Damaged Stock
                </div>
                <input
                  type="number"
                  min={0}
                  max={returnedQty}
                  value={qcDamagedQty}
                  onChange={(e) => setQcDamagedQty(Number(e.target.value))}
                  className="w-full bg-factory-900 border border-red-500/40 rounded px-2.5 py-1.5 text-sm text-red-300 font-bold focus:outline-none"
                />
                <span className="text-[10px] text-red-400/80 mt-1 block">Quarantined / scrapped</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                  <Wrench className="w-3.5 h-3.5" /> Rework Floor
                </div>
                <input
                  type="number"
                  min={0}
                  max={returnedQty}
                  value={qcReworkQty}
                  onChange={(e) => setQcReworkQty(Number(e.target.value))}
                  className="w-full bg-factory-900 border border-amber-500/40 rounded px-2.5 py-1.5 text-sm text-amber-300 font-bold focus:outline-none"
                />
                <span className="text-[10px] text-amber-400/80 mt-1 block">Sent for repair/steam</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                QC Inspector / Supervisor
              </label>
              <input
                type="text"
                value={inspectedBy}
                onChange={(e) => setInspectedBy(e.target.value)}
                className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Reason / Customer Remarks
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-factory-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Processing Return...' : 'Record Return & Update Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
