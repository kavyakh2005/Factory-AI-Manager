import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Product, Set as GarmentSet, CreateProductInput } from '../../types';
import { ProductService, DEFAULT_FACTORY_COLORS } from '../../services/products/productService';
import { Upload, X, Sparkles, AlertCircle, Layers, Image as ImageIcon, Palette, Plus } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  availableSets: GarmentSet[];
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  availableSets,
  onSuccess,
}) => {
  const isEdit = !!product;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Coord Sets');
  const [subcategory, setSubcategory] = useState('');
  const [fabric, setFabric] = useState('100% Cotton');
  const [pattern, setPattern] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [retailPrice, setRetailPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>(['Navy Blue', 'Jet Black', 'Pure White', 'Maroon']);
  const [customColorInput, setCustomColorInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCode(product.code);
      setCategory(product.category);
      setSubcategory(product.subcategory || '');
      setFabric(product.fabric);
      setPattern(product.pattern || '');
      setUnit(product.unit || 'pcs');
      setCostPrice(product.costPrice);
      setSellingPrice(product.sellingPrice);
      setRetailPrice(product.retailPrice || '');
      setDescription(product.description || '');
      setStatus(product.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
      setImageUrl(product.imageUrl || (product.images && product.images[0]) || '');
      setSelectedSetIds(product.productSets?.map((ps) => ps.setId) || []);
      const existingColors = product.variants?.map((v) => v.color) || [];
      setSelectedColors(existingColors.length > 0 ? existingColors : ['Navy Blue', 'Jet Black', 'Pure White', 'Maroon']);
    } else {
      setName('');
      setCode(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory('Coord Sets');
      setSubcategory('');
      setFabric('100% Cotton');
      setPattern('');
      setUnit('pcs');
      setCostPrice('');
      setSellingPrice('');
      setRetailPrice('');
      setDescription('');
      setStatus('ACTIVE');
      setImageUrl('');
      // Default to first set if available
      setSelectedSetIds(availableSets.length > 0 ? [availableSets[0].id] : []);
      setSelectedColors(['Navy Blue', 'Jet Black', 'Pure White', 'Maroon']);
    }
    setError(null);
  }, [product, isOpen, availableSets]);

  // Real-time Margin Calculation
  const cost = typeof costPrice === 'number' ? costPrice : 0;
  const wholesale = typeof sellingPrice === 'number' ? sellingPrice : 0;
  const marginMetrics = ProductService.calculateMargins(cost, wholesale);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const uploadedUrl = await ProductService.uploadProductImage(file);
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      setError('Image upload failed. Using local preview.');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleSetSelection = (setId: string) => {
    setSelectedSetIds((prev) =>
      prev.includes(setId) ? prev.filter((id) => id !== setId) : [...prev, setId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Product Code / SKU is required.');
      return;
    }
    if (costPrice === '' || Number(costPrice) < 0) {
      setError('Cost Price must be a non-negative number.');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      setError('Wholesale Selling Price must be a non-negative number.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateProductInput = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category.trim(),
        subcategory: subcategory.trim() || undefined,
        fabric: fabric.trim(),
        pattern: pattern.trim() || undefined,
        unit,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        retailPrice: retailPrice !== '' ? Number(retailPrice) : undefined,
        description: description.trim() || undefined,
        status,
        imageUrl: imageUrl || undefined,
        setIds: selectedSetIds,
        variants: selectedColors.map((c) => ({ color: c })),
      };

      if (isEdit && product) {
        await ProductService.updateProduct(product.id, payload);
      } else {
        await ProductService.createProduct(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Product: ${product?.name}` : 'Create New Garment Product'}
      subtitle="Configure product specifications, pricing, fabrics and assigned size sets"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Image Upload & Preview */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Product Image
            </label>

            <div className="relative border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl overflow-hidden bg-slate-900/60 aspect-[3/4] flex flex-col items-center justify-center p-4 group transition-all">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all">
                    <label className="cursor-pointer px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg">
                      <Upload className="w-3.5 h-3.5" />
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">
                      {uploadingImage ? 'Uploading...' : 'Upload catalog photo'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 5MB</div>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-all">
                    <Upload className="w-3.5 h-3.5 text-primary-400" />
                    Select File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Status Select */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Catalog Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
              >
                <option value="ACTIVE">ACTIVE (Available for Orders & Production)</option>
                <option value="INACTIVE">INACTIVE (Hidden from new orders)</option>
              </select>
            </div>
          </div>

          {/* Center & Right Column: Details & Pricing */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cotton Linen Coord Set"
                required
              />

              <Input
                label="Product Code / SKU *"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. PRD-COORD-01"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="Coord Sets">Coord Sets</option>
                  <option value="Ethnic Wear">Ethnic Wear</option>
                  <option value="Kurtis & Tunics">Kurtis & Tunics</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Shirts">Shirts</option>
                  <option value="Bottoms & Pants">Bottoms & Pants</option>
                  <option value="Kids Wear">Kids Wear</option>
                  <option value="Casuals">Casuals</option>
                </select>
              </div>

              <Input
                label="Fabric / Material *"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. 100% Linen Slub"
                required
              />

              <Input
                label="Pattern / Print"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. Solid, Ikat, Foil"
              />
            </div>

            {/* Financials & Gross Margin Card */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Pricing & Real-Time Margin
                </span>
                <span className="text-[11px] text-slate-400">Values in ₹ (INR)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="420"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Wholesale Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="850"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Optional Retail MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1299"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Dynamic Gross Margin Preview */}
              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Gross Margin / Pc:</span>
                    <span className="font-bold text-slate-200 text-sm">₹{marginMetrics.grossMargin}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Gross Margin %:</span>
                    <span className={`font-extrabold text-sm ${marginMetrics.marginPercent >= 40 ? 'text-emerald-400' : marginMetrics.marginPercent >= 20 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {marginMetrics.marginPercent}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 italic">Formula: ((Wholesale - Cost) / Wholesale) × 100</span>
              </div>
            </div>

            {/* Available Colorways & Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-primary-400" />
                  Product Colorways & Swatches
                </label>
                <span className="text-[10px] text-slate-400">Select active colors or add custom</span>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {DEFAULT_FACTORY_COLORS.map((c) => {
                    const isSelected = selectedColors.includes(c.name);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedColors((prev) =>
                            isSelected ? prev.filter((col) => col !== c.name) : [...prev, c.name]
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary-600/20 border-primary-500/60 text-primary-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-slate-600" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-800/80">
                  <input
                    type="text"
                    placeholder="Add custom colorway (e.g. Mint Green, Sage)..."
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                          setSelectedColors([...selectedColors, customColorInput.trim()]);
                          setCustomColorInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                        setSelectedColors([...selectedColors, customColorInput.trim()]);
                        setCustomColorInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Assigned Sets Allocation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary-400" />
                  Available Garment Sets For This Product
                </label>
                <span className="text-[10px] text-slate-400">Select which sets this product manufactures</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-900/60 border border-slate-800 rounded-xl max-h-36 overflow-y-auto">
                {availableSets.map((s) => {
                  const isChecked = selectedSetIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-primary-500/10 border-primary-500/40 text-primary-200'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSetSelection(s.id)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-primary-600 focus:ring-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold flex items-center justify-between">
                          <span>{s.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{s.code}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          Sizes: {s.setSizes?.map((ss) => ss.size?.name || ss.sizeId).join(', ') || 'No sizes'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Product Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Key design details, stitch notes, or fit guide..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
