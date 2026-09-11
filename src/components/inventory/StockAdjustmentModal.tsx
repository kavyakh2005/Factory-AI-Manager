import React, { useState, useEffect } from 'react';
import { InventoryItem, CreateStockAdjustmentInput } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStockAdjustmentInput) => Promise<void>;
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  selectedItem,
}) => {
  const [formData, setFormData] = useState<CreateStockAdjustmentInput>({
    itemId: '',
    transactionType: 'IN',
    quantity: 10,
    unit: 'MTR',
    reason: 'PHYSICAL_COUNT',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem) {
      setFormData((prev) => ({
        ...prev,
        itemId: selectedItem.id,
        unit: selectedItem.unit,
      }));
    } else if (items.length > 0 && !formData.itemId) {
      setFormData((prev) => ({
        ...prev,
        itemId: items[0].id,
        unit: items[0].unit,
      }));
    }
  }, [selectedItem, items, isOpen]);

  const currentItem = items.find((i) => i.id === formData.itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId) {
      setError('Please select an inventory item');
      return;
    }
    if ((formData.quantity || 0) <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record stock movement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Ledger Entry / Adjustment" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Select Item / SKU *</label>
          <select
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.itemId}
            onChange={(e) => {
              const it = items.find((i) => i.id === e.target.value);
              setFormData({
                ...formData,
                itemId: e.target.value,
                unit: it ? it.unit : formData.unit,
              });
            }}
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                [{i.itemCode}] {i.itemName} (Current: {i.currentStock} {i.unit})
              </option>
            ))}
          </select>
        </div>

        {currentItem && (
          <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-lg flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Ledger Stock</span>
            <span className="text-lg font-bold text-white">
              {currentItem.currentStock} <span className="text-xs text-slate-400 font-normal">{currentItem.unit}</span>
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Movement Type *</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.transactionType}
              onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT' })}
            >
              <option value="IN">Stock IN (+) (Receiving / Audit Found)</option>
              <option value="OUT">Stock OUT (-) (Usage / Scrapped / Loss)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Reset to Exact Count)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reason / Purpose *</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            >
              <option value="PHYSICAL_COUNT">Physical Count Audit</option>
              <option value="DAMAGE_WASTAGE">Wastage / Defect / Damage</option>
              <option value="SAMPLE_USE">Sampling / Client Prototype</option>
              <option value="VENDOR_RETURN">Return to Mill / Vendor</option>
              <option value="OPENING_BALANCE">Opening Stock Setup</option>
              <option value="OTHER">Other Movement</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Quantity (${formData.unit}) *`}
            type="number"
            min="0.01"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            required
          />

          <Input
            label="UOM"
            value={formData.unit}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Remarks & Reference</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            value={formData.remarks || ''}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Challan # / Roll batch number / Reason details..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Post to Stock Ledger
          </Button>
        </div>
      </form>
    </Modal>
  );
};
