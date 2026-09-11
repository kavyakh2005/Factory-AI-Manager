import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Set as GarmentSet, Size, CreateSetInput } from '../../types';
import { ProductService, DEFAULT_FACTORY_SIZES } from '../../services/products/productService';
import { Layers, AlertCircle, ArrowUp, ArrowDown, Plus, Trash2, Wand2, Sparkles } from 'lucide-react';

interface SetModalProps {
  isOpen: boolean;
  onClose: () => void;
  set?: GarmentSet | null;
  availableSizes: Size[];
  onSuccess: () => void;
}

export const SetModal: React.FC<SetModalProps> = ({
  isOpen,
  onClose,
  set,
  availableSizes,
  onSuccess,
}) => {
  const isEdit = !!set;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('ADULT');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [orderedSizeIds, setOrderedSizeIds] = useState<string[]>([]);
  const [allSizesList, setAllSizesList] = useState<Size[]>([]);
  const [newQuickSize, setNewQuickSize] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Populate sizes list with prop or fallback default factory sizes
    const initialList = availableSizes && availableSizes.length > 0 ? availableSizes : DEFAULT_FACTORY_SIZES;
    setAllSizesList(initialList);

    if (set) {
      setName(set.name);
      setCode(set.code);
      setType(set.type || 'ADULT');
      setDescription(set.description || '');
      setStatus(set.status || 'ACTIVE');
      setSortOrder(set.sortOrder || 1);
      setOrderedSizeIds(set.setSizes?.map((ss) => ss.sizeId) || []);
    } else {
      setName('');
      setCode(`SET-${Math.floor(100 + Math.random() * 900)}`);
      setType('ADULT');
      setDescription('');
      setStatus('ACTIVE');
      setSortOrder(1);
      // Auto-select standard 38-46 for adult by default for great UX
      const defaultAdult = initialList.filter((s: Size) => ['38', '40', '42', '44', '46'].includes(s.name)).map((s: Size) => s.id);
      setOrderedSizeIds(defaultAdult.length > 0 ? defaultAdult : []);
    }
    setError(null);
  }, [set, isOpen, availableSizes]);

  const toggleSizeInSet = (sizeId: string) => {
    if (orderedSizeIds.includes(sizeId)) {
      setOrderedSizeIds(orderedSizeIds.filter((id) => id !== sizeId));
    } else {
      setOrderedSizeIds([...orderedSizeIds, sizeId]);
    }
  };

  const applyPreset = (names: string[]) => {
    const matchedIds: string[] = [];
    names.forEach((n) => {
      const found = allSizesList.find((s: Size) => s.name.toLowerCase() === n.toLowerCase());
      if (found) matchedIds.push(found.id);
    });
    if (matchedIds.length > 0) {
      setOrderedSizeIds(matchedIds);
    }
  };

  const handleAddQuickSize = async () => {
    const clean = newQuickSize.trim().toUpperCase();
    if (!clean) return;

    const existing = allSizesList.find((s: Size) => s.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      if (!orderedSizeIds.includes(existing.id)) {
        setOrderedSizeIds([...orderedSizeIds, existing.id]);
      }
      setNewQuickSize('');
      return;
    }

    try {
      const created = await ProductService.createSize({
        name: clean,
        code: `SZ-${clean}`,
        status: 'ACTIVE',
      });
      setAllSizesList((prev) => [...prev, created]);
      setOrderedSizeIds((prev) => [...prev, created.id]);
      setNewQuickSize('');
    } catch {
      // Offline / local fallback
      const fallbackId = `sz-${clean.toLowerCase()}-${Date.now()}`;
      const fallbackSize: Size = {
        id: fallbackId,
        name: clean,
        code: `SZ-${clean}`,
        status: 'ACTIVE',
      };
      setAllSizesList((prev) => [...prev, fallbackSize]);
      setOrderedSizeIds((prev) => [...prev, fallbackId]);
      setNewQuickSize('');
    }
  };

  const moveSize = (index: number, direction: 'UP' | 'DOWN') => {
    const newArr = [...orderedSizeIds];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setOrderedSizeIds(newArr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Set Name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Set Code is required.');
      return;
    }
    if (orderedSizeIds.length === 0) {
      setError('Please assign at least one size to this set.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateSetInput = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        description: description.trim() || undefined,
        status,
        sortOrder: Number(sortOrder) || 1,
        sizeIds: orderedSizeIds,
      };

      if (isEdit && set) {
        await ProductService.updateSet(set.id, payload);
      } else {
        await ProductService.createSet(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Garment Set: ${set?.name}` : 'Create New Garment Set'}
      subtitle="A Set is a business grouping of sizes (e.g. Standard Set 38-46, Kids Set 24-32)"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Set Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Set, Extra Plus"
            required
          />

          <Input
            label="Set Code *"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SET-STD"
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="ADULT">ADULT (Standard Mens / Womens)</option>
              <option value="PLUS">PLUS (Extended Sizes)</option>
              <option value="KIDS">KIDS (Junior Age Groups)</option>
              <option value="CUSTOM">CUSTOM / EXPORT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Input
            label="Sort Priority"
            type="number"
            min="1"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            placeholder="1"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Set Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="e.g. Ready-to-wear standard five-size run with 1:1 carton ratio"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        {/* Assigned Sizes & Reordering Sequence */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-primary-400" />
              Assigned Sizes & Sequence ({orderedSizeIds.length} Selected)
            </label>
            <span className="text-[10px] text-slate-400">
              Use arrows to order sizes from smallest to largest
            </span>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-indigo-400" /> Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset(['38', '40', '42', '44', '46'])}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition"
            >
              Standard (38-46)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['48', '50', '52'])}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
            >
              Plus Size (48-52)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['24', '26', '28', '30', '32'])}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
            >
              Kids Run (24-32)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['S', 'M', 'L', 'XL', 'XXL'])}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition"
            >
              Alpha (S-XXL)
            </button>
            <button
              type="button"
              onClick={() => setOrderedSizeIds([])}
              className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 transition underline"
            >
              Clear
            </button>
          </div>

          {/* Currently Ordered Sizes List */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 max-h-48 overflow-y-auto">
            {orderedSizeIds.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No sizes assigned yet. Click from the available sizes palette below or use a preset.
              </div>
            ) : (
              orderedSizeIds.map((szId, idx) => {
                const sz = allSizesList.find((s) => s.id === szId);
                return (
                  <div
                    key={szId}
                    className="flex items-center justify-between p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <strong className="text-slate-100 font-bold">{sz?.name || szId}</strong>
                      {sz?.chestMeasure && (
                        <span className="text-[10px] text-slate-400">Chest {sz.chestMeasure}"</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSize(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-400 hover:text-slate-200"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSize(idx, 'DOWN')}
                        disabled={idx === orderedSizeIds.length - 1}
                        className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-400 hover:text-slate-200"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSizeInSet(szId)}
                        className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded ml-1"
                        title="Remove from Set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Available Sizes Quick Selection Chips & Inline Add Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
              <span>Available Factory Master Sizes (Click to add/remove):</span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg max-h-36 overflow-y-auto">
              {allSizesList.map((sz) => {
                const isSelected = orderedSizeIds.includes(sz.id);
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => toggleSizeInSet(sz.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-sm ring-1 ring-primary-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{sz.name}</span>
                    {isSelected && <span className="text-[10px] opacity-80">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Quick Add Custom Size Inline */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Type custom size (e.g. 54, XS, Free Size)..."
                value={newQuickSize}
                onChange={(e) => setNewQuickSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuickSize();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddQuickSize}
                className="text-xs"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Size
              </Button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {isEdit ? 'Save Changes' : 'Create Set'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

