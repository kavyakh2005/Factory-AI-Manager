import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Size, CreateSizeInput } from '../../types';
import { ProductService } from '../../services/products/productService';
import { AlertCircle } from 'lucide-react';

interface SizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: Size | null;
  onSuccess: () => void;
}

export const SizeModal: React.FC<SizeModalProps> = ({
  isOpen,
  onClose,
  size,
  onSuccess,
}) => {
  const isEdit = !!size;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [chestMeasure, setChestMeasure] = useState<number | ''>('');
  const [waistMeasure, setWaistMeasure] = useState<number | ''>('');
  const [lengthMeasure, setLengthMeasure] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (size) {
      setName(size.name);
      setCode(size.code || '');
      setChestMeasure(size.chestMeasure || '');
      setWaistMeasure(size.waistMeasure || '');
      setLengthMeasure(size.lengthMeasure || '');
      setSortOrder(size.sortOrder || 1);
      setStatus(size.status || 'ACTIVE');
    } else {
      setName('');
      setCode('');
      setChestMeasure('');
      setWaistMeasure('');
      setLengthMeasure('');
      setSortOrder(1);
      setStatus('ACTIVE');
    }
    setError(null);
  }, [size, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Size Label is required (e.g. 38, 40, XL, Kids 24).');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateSizeInput = {
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        chestMeasure: chestMeasure !== '' ? Number(chestMeasure) : undefined,
        waistMeasure: waistMeasure !== '' ? Number(waistMeasure) : undefined,
        lengthMeasure: lengthMeasure !== '' ? Number(lengthMeasure) : undefined,
        sortOrder: Number(sortOrder) || 1,
        status,
      };

      if (isEdit && size) {
        await ProductService.updateSize(size.id, payload);
      } else {
        await ProductService.createSize(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save size.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Size: ${size?.name}` : 'Create New Garment Size'}
      subtitle="Configure standard numeric or alpha garment measurements"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Size Label *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 42 or XL or Kids 26"
            required
          />

          <Input
            label="Size Code / SKU"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SZ-42"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Chest (Inch)"
            type="number"
            step="0.5"
            value={chestMeasure}
            onChange={(e) => setChestMeasure(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="42"
          />

          <Input
            label="Waist (Inch)"
            type="number"
            step="0.5"
            value={waistMeasure}
            onChange={(e) => setWaistMeasure(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="36"
          />

          <Input
            label="Length (Inch)"
            type="number"
            step="0.5"
            value={lengthMeasure}
            onChange={(e) => setLengthMeasure(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="42"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Sort Order"
            type="number"
            min="1"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            placeholder="1"
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {isEdit ? 'Save Size' : 'Create Size'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
