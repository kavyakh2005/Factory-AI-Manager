import React, { useState, useEffect } from 'react';
import { InventoryItem, CreateInventoryItemInput, InventoryItemType } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventoryItemInput) => Promise<void>;
  item?: InventoryItem | null;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const [formData, setFormData] = useState<CreateInventoryItemInput>({
    itemCode: '',
    itemName: '',
    itemType: 'RAW_MATERIAL',
    category: 'FABRIC',
    unit: 'MTR',
    currentStock: 0,
    minStockAlert: 100,
    unitCost: 0,
    storageLocation: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemType: item.itemType,
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        minStockAlert: item.minStockAlert,
        unitCost: item.unitCost,
        storageLocation: item.storageLocation || '',
        notes: item.notes || '',
      });
    } else {
      setFormData({
        itemCode: '',
        itemName: '',
        itemType: 'RAW_MATERIAL',
        category: 'FABRIC',
        unit: 'MTR',
        currentStock: 0,
        minStockAlert: 100,
        unitCost: 0,
        storageLocation: '',
        notes: '',
      });
    }
    setError(null);
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(formData.itemName || '').trim()) {
      setError('Item Name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Edit SKU: ${item.itemName}` : 'Create Inventory SKU'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SKU / Item Code"
            value={formData.itemCode || ''}
            onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })}
            placeholder="e.g. RM-RAY-01 / TRM-BTN-05"
          />

          <Input
            label="Item Name *"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            placeholder="e.g. Premium 140 GSM Rayon Fabric"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Item Classification *</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.itemType}
              onChange={(e) => setFormData({ ...formData, itemType: e.target.value as InventoryItemType })}
            >
              <option value="RAW_MATERIAL">Raw Material (Fabric, Trims)</option>
              <option value="WIP">Work in Progress (Semi-finished)</option>
              <option value="FINISHED_GOODS">Finished Goods (Ready Garments)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="FABRIC">Fabric / Textiles</option>
              <option value="THREAD">Thread / Yarn</option>
              <option value="BUTTONS">Buttons & Snaps</option>
              <option value="ZIPS">Zippers & Sliders</option>
              <option value="LABELS">Brand Labels & Wash Care</option>
              <option value="PACKAGING">Polybags & Master Boxes</option>
              <option value="APPAREL">Finished Garments</option>
              <option value="OTHER">Other Consumables</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Unit of Measurement (UOM)</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="MTR">Meters (MTR)</option>
              <option value="KG">Kilograms (KG)</option>
              <option value="PCS">Pieces (PCS)</option>
              <option value="ROLL">Rolls (ROLL)</option>
              <option value="BOX">Boxes / Cartons (BOX)</option>
              <option value="GROSS">Gross (144 pcs)</option>
            </select>
          </div>

          <Input
            label="Low Stock Warning Level"
            type="number"
            min="0"
            value={formData.minStockAlert}
            onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
          />

          <Input
            label="Standard Unit Cost (₹)"
            type="number"
            min="0"
            step="0.01"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
          />

          <Input
            label="Storage Rack / Bay"
            value={formData.storageLocation || ''}
            onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
            placeholder="e.g. Rack A-04 / Ground Floor Bay 2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Specifications / Notes</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Color codes, count, supplier grade..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            {item ? 'Update Item' : 'Save Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
