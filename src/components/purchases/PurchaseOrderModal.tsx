import React, { useState, useEffect } from 'react';
import { Supplier, CreatePurchaseOrderInput, CreatePurchaseOrderItemInput, InventoryItem } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Plus, Trash2, IndianRupee } from 'lucide-react';
import { SupplierService } from '../../services/suppliers/supplierService';
import { InventoryService } from '../../services/inventory/inventoryService';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseOrderInput) => Promise<void>;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreatePurchaseOrderItemInput[]>([
    {
      itemName: '',
      category: 'FABRIC',
      quantity: 500,
      unit: 'meters',
      rate: 150,
      taxRate: 5,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDropdowns();
    }
  }, [isOpen]);

  const loadDropdowns = async () => {
    try {
      const [supList, invList] = await Promise.all([
        SupplierService.getSuppliers({ status: 'ACTIVE' }),
        InventoryService.getInventoryItems(),
      ]);
      setSuppliers(supList);
      setInventoryItems(invList);
      if (supList.length > 0 && !supplierId) {
        setSupplierId(supList[0].id);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemName: '',
        category: 'FABRIC',
        quantity: 100,
        unit: 'meters',
        rate: 100,
        taxRate: 5,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof CreatePurchaseOrderItemInput, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSelectPredefinedSKU = (index: number, skuId: string) => {
    const selectedSKU = inventoryItems.find((i) => i.id === skuId);
    if (!selectedSKU) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      itemId: selectedSKU.id,
      itemName: selectedSKU.name,
      unit: selectedSKU.unit,
      rate: selectedSKU.unitCost || updated[index].rate,
    };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const sub = (item.quantity || 0) * (item.rate || 0);
      return sum + sub * (1 + (item.taxRate || 5) / 100);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (items.some((i) => !i.itemName.trim() || i.quantity <= 0 || i.rate <= 0)) {
      setError('Please fill in valid name, quantity (> 0), and rate (> 0) for all items');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        supplierId,
        expectedDate,
        notes,
        items,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Purchase Order (PO)" maxWidth="4xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Supplier / Mill *</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.companyName || s.supplierCode}) - {s.materialCategory || 'General'}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Expected Delivery Date *"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            required
          />
        </div>

        {/* PO Items Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Purchase Order Line Items</h3>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="flex items-center gap-1 text-xs"
              onClick={handleAddItem}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase font-medium text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-3 w-1/4">Link SKU (Optional)</th>
                  <th className="p-3 w-1/4">Item Description *</th>
                  <th className="p-3">Qty *</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Rate (₹) *</th>
                  <th className="p-3">GST %</th>
                  <th className="p-3 text-right">Total (₹)</th>
                  <th className="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((item, idx) => {
                  const lineSub = (item.quantity || 0) * (item.rate || 0);
                  const lineTot = lineSub * (1 + (item.taxRate || 5) / 100);
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="p-2">
                        <select
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs"
                          value={item.itemId || ''}
                          onChange={(e) => handleSelectPredefinedSKU(idx, e.target.value)}
                        >
                          <option value="">-- Custom Item --</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              [{inv.sku}] {inv.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                          placeholder="Item name / spec"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs text-right"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs text-right"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <select
                          className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                        </select>
                      </td>
                      <td className="p-2 text-right font-semibold text-emerald-400">
                        ₹{Math.round(lineTot).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-500 hover:text-red-400 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes / Terms of Purchase</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery terms, quality grade requirements, freight terms..."
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>₹{Math.round(calculateSubtotal()).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Tax (GST):</span>
              <span>₹{Math.round(calculateTotal() - calculateSubtotal()).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white border-t border-slate-700 pt-2">
              <span>Grand Total PO Value:</span>
              <span className="text-emerald-400">₹{Math.round(calculateTotal()).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Create & Issue PO
          </Button>
        </div>
      </form>
    </Modal>
  );
};
