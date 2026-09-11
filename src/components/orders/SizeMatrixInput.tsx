import React, { useState } from 'react';
import { Product, Set, OrderItemDraft } from '../../types';
import { Trash2, Sparkles, Plus, Palette } from 'lucide-react';
import { DEFAULT_FACTORY_COLORS } from '../../services/products/productService';

interface SizeMatrixInputProps {
  itemIndex: number;
  item: OrderItemDraft;
  products: Product[];
  sets: Set[];
  onChange: (updatedItem: OrderItemDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const SizeMatrixInput: React.FC<SizeMatrixInputProps> = ({
  itemIndex,
  item,
  products,
  sets,
  onChange,
  onRemove,
  canRemove,
}) => {
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColorInput, setCustomColorInput] = useState('');

  const selectedProduct = products.find((p) => p.id === item.productId);
  
  // Filter sets according to product-assigned sets (or all sets if no restrictions)
  const assignedSetIds = selectedProduct?.productSets?.map((ps) => ps.setId) || [];
  const availableSets = assignedSetIds.length > 0
    ? sets.filter((s) => assignedSetIds.includes(s.id))
    : sets;

  const selectedSet = availableSets.find((s) => s.id === item.setId) || availableSets[0] || sets.find((s) => s.id === item.setId);
  const rawVariants = selectedProduct?.variants || [];
  const availableVariants = rawVariants.length > 0
    ? rawVariants
    : DEFAULT_FACTORY_COLORS.map((c) => ({
        id: c.name,
        productId: item.productId,
        sku: c.sku,
        color: c.name,
        colorCode: c.hex,
        status: 'ACTIVE' as const,
      }));

  const availableSizes = selectedSet?.setSizes || [];

  // Calculate row total pcs
  const rowTotalPcs = Object.values(item.sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);
  const lineSubtotal = rowTotalPcs * (item.unitRate || 0);
  const lineTotal = lineSubtotal * (1 + (item.taxRate || 5) / 100);

  const handleProductChange = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const prodSetIds = prod?.productSets?.map((ps) => ps.setId) || [];
    const prodSets = prodSetIds.length > 0 ? sets.filter((s) => prodSetIds.includes(s.id)) : sets;
    const defaultSet = prodSets[0] || sets[0];

    const initialQuantities: Record<string, number> = {};
    defaultSet?.setSizes?.forEach((ss) => {
      initialQuantities[ss.sizeId] = 0;
    });

    const defaultVariant = prod?.variants?.[0]?.color || prod?.variants?.[0]?.id || DEFAULT_FACTORY_COLORS[0].name;

    onChange({
      ...item,
      productId,
      variantId: defaultVariant,
      setId: defaultSet?.id || item.setId,
      unitRate: prod?.sellingPrice || item.unitRate || 850,
      sizeQuantities: initialQuantities,
    });
  };

  const handleSetChange = (setId: string) => {
    const newSet = sets.find((s) => s.id === setId);
    const initialQuantities: Record<string, number> = {};
    newSet?.setSizes?.forEach((ss) => {
      initialQuantities[ss.sizeId] = 0;
    });

    onChange({
      ...item,
      setId,
      sizeQuantities: initialQuantities,
    });
  };

  const handleQuantityChange = (sizeId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    onChange({
      ...item,
      sizeQuantities: {
        ...item.sizeQuantities,
        [sizeId]: num,
      },
    });
  };

  const handleCustomColorAdd = () => {
    if (customColorInput.trim()) {
      onChange({ ...item, variantId: customColorInput.trim() });
      setIsCustomColor(false);
      setCustomColorInput('');
    }
  };

  const applyQuickRatio = (multiplier: number) => {
    const updated: Record<string, number> = {};
    availableSizes.forEach((ss) => {
      updated[ss.sizeId] = (ss.ratio || 1) * multiplier;
    });
    onChange({
      ...item,
      sizeQuantities: updated,
    });
  };

  return (
    <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-4 transition-all">
      {/* Top Selectors Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30 text-xs font-bold flex items-center justify-center">
            {itemIndex + 1}
          </span>
          <span className="text-xs font-bold text-slate-200">Garment Item Configuration</span>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Item</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Product Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Product Master *
          </label>
          <select
            value={item.productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-medium"
          >
            <option value="">Select Product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        {/* Set Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Garment Set *
          </label>
          <select
            value={item.setId}
            onChange={(e) => handleSetChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-medium"
          >
            <option value="">Select Set...</option>
            {availableSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code}) — {s.type}
              </option>
            ))}
          </select>
        </div>

        {/* Color / Variant Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Colorway / Variant
            </label>
            <button
              type="button"
              onClick={() => setIsCustomColor(!isCustomColor)}
              className="text-[10px] text-primary-400 hover:text-primary-300 font-semibold"
            >
              {isCustomColor ? 'Pick Preset' : '+ Custom'}
            </button>
          </div>

          {isCustomColor ? (
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="e.g. Navy Blue, Mint..."
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomColorAdd();
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-medium"
              />
              <button
                type="button"
                onClick={handleCustomColorAdd}
                className="px-2 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg"
              >
                Set
              </button>
            </div>
          ) : (
            <select
              value={item.variantId || ''}
              onChange={(e) => onChange({ ...item, variantId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-medium"
            >
              <option value="">Select Color...</option>
              {availableVariants.map((v) => (
                <option key={v.id || v.color} value={v.id || v.color}>
                  🎨 {v.color} {v.sku ? `(${v.sku})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Unit Selling Rate */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Rate / Piece (₹) *
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={item.unitRate || 0}
            onChange={(e) => onChange({ ...item, unitRate: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-bold text-right"
          />
        </div>
      </div>

      {/* Dynamic Size Matrix Grid */}
      {selectedSet && availableSizes.length > 0 ? (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Size Matrix Quantity Breakdown</span>
              <span className="text-slate-500 text-[10px]">({selectedSet.name})</span>
            </span>

            {/* Quick Set Multiplier Preset */}
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Quick Fill:</span>
              {[25, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => applyQuickRatio(val)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {availableSizes.map((ss) => {
              const qty = item.sizeQuantities[ss.sizeId] || 0;
              return (
                <div
                  key={ss.sizeId}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    qty > 0
                      ? 'bg-primary-950/40 border-primary-500/50 shadow-sm'
                      : 'bg-factory-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1 px-1">
                    <span>Size {ss.size?.name}</span>
                    <span className="text-[10px] text-slate-500">#{ss.sequence}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={qty === 0 ? '' : qty}
                    onChange={(e) => handleQuantityChange(ss.sizeId, e.target.value)}
                    className="w-full text-center py-1 rounded bg-factory-950 border border-slate-700 text-slate-100 text-sm font-black focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              );
            })}
          </div>

          {/* Line Item Calculation Bar */}
          <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-factory-900/60 border border-slate-800 text-xs mt-2">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Item Total: <strong className="text-slate-100 font-bold">{rowTotalPcs} pcs</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Rate: <strong className="text-slate-200">₹{item.unitRate}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Tax: <strong className="text-slate-200">{item.taxRate || 5}%</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[11px]">Line Total: </span>
              <span className="text-emerald-400 font-black text-sm">
                ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-slate-500 bg-factory-900/40 rounded-lg border border-slate-800">
          Please select a Product and Garment Set to load the dynamic Size Matrix.
        </div>
      )}
    </div>
  );
};
