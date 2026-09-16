import React, { useState } from 'react';
import { Order, Product, Set } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ProductionService } from '../../services/production/productionService';
import { Factory, Calendar, AlertCircle } from 'lucide-react';
import { DEFAULT_FACTORY_COLORS } from '../../services/products/productService';

interface ProductionPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmedOrders: Order[];
  products: Product[];
  sets: Set[];
  onPlanCreated: () => void;
}

export const ProductionPlanningModal: React.FC<ProductionPlanningModalProps> = ({
  isOpen,
  onClose,
  confirmedOrders,
  products,
  sets,
  onPlanCreated,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [variantId, setVariantId] = useState<string>('Navy Blue');
  const [setId, setSetId] = useState<string>(sets[0]?.id || '');
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [plannedSizes, setPlannedSizes] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedOrder = confirmedOrders.find((o) => o.id === selectedOrderId);
  const selectedProduct = products.find((p) => p.id === productId);
  const selectedSet = sets.find((s) => s.id === setId);
  const availableSizes = selectedSet?.setSizes || [];

  const rawVariants = selectedProduct?.variants || [];
  const effectiveVariants = rawVariants.length > 0
    ? rawVariants
    : DEFAULT_FACTORY_COLORS.map((c) => ({
        id: c.name,
        productId: productId,
        sku: c.sku,
        color: c.name,
        colorCode: c.hex,
        status: 'ACTIVE' as const,
      }));

  // When order is selected, automatically populate product, set, and ordered size quantities
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = confirmedOrders.find((o) => o.id === orderId);
    if (ord && ord.orderItems && ord.orderItems.length > 0) {
      const firstItem = ord.orderItems[0];
      setProductId(firstItem.productId);
      setVariantId(firstItem.variantId || '');
      setSetId(firstItem.setId);
      setTargetDate(new Date(ord.deliveryDate).toISOString().split('T')[0]);

      // Populate planned size quantities from order items
      const initialSizes: Record<string, number> = {};
      ord.orderItems.forEach((item) => {
        initialSizes[item.sizeId] = item.quantity;
      });
      setPlannedSizes(initialSizes);
    }
  };

  const handleSizeQuantityChange = (sizeId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setPlannedSizes((prev) => ({
      ...prev,
      [sizeId]: num,
    }));
  };

  const totalPlannedQty = Object.values(plannedSizes).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!productId || !setId) {
      setErrorMessage('Product and Set are required.');
      return;
    }
    if (totalPlannedQty <= 0) {
      setErrorMessage('Please enter planned quantities for at least one size.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ProductionService.createProductionPlan({
        orderId: selectedOrderId || undefined,
        productId,
        variantId: variantId || undefined,
        setId,
        plannedSizes,
        targetCompletionDate: new Date(targetDate).toISOString(),
        notes,
      });

      onPlanCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create production plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Production Work Order Plan"
      subtitle="Allocate garment batch quantities, assign floor team, and set target timeline"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Missing Catalog Warning Banner */}
        {(products.length === 0 || sets.length === 0) && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Catalog Data Needed to Plan Production
            </div>
            <p className="text-[11px] text-amber-200/80">
              {products.length === 0 && sets.length === 0
                ? 'Aapke catalog mein abhi koi Product Style aur Size Set registered nahi hai. Production plan karne se pehle "Product Master" (/products) mein style aur "Sets & Sizes" (/sets-sizes) mein set create karein.'
                : products.length === 0
                ? 'Product Master (/products) mein pehle ek garment style add karein.'
                : 'Sets & Sizes (/sets-sizes) mein pehle ek size set (jaise Standard 38-46) add karein.'}
            </p>
          </div>
        )}

        {/* Source Order Selector */}
        <div className="p-4 rounded-xl bg-factory-950/80 border border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Link to Confirmed Customer Order (Optional)
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => handleOrderSelect(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-medium"
          >
            <option value="">Standalone Production Batch (Stock Build)...</option>
            {confirmedOrders.map((o) => (
              <option key={o.id} value={o.id}>
                Order #{o.orderNumber} — {o.customer?.name} ({o.totalQuantity} pcs, Due: {new Date(o.deliveryDate).toLocaleDateString()})
              </option>
            ))}
          </select>
          {selectedOrder && (
            <div className="text-[11px] text-primary-400 font-medium">
              ✓ Loaded customer order specifications: {selectedOrder.customer?.name} ({selectedOrder.totalQuantity} pcs)
            </div>
          )}
        </div>

        {/* Product & Set Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Product Master *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            >
              {products.length === 0 ? (
                <option value="">⚠️ No Products (Add in /products)</option>
              ) : (
                <>
                  <option value="">Select Product Style...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Garment Set *
            </label>
            <select
              value={setId}
              onChange={(e) => setSetId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            >
              {sets.length === 0 ? (
                <option value="">⚠️ No Sets (Add in /sets-sizes)</option>
              ) : (
                <>
                  <option value="">Select Size Set...</option>
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Colorway / Swatch
            </label>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            >
              <option value="">Default Colorway</option>
              {effectiveVariants.map((v) => (
                <option key={v.id || v.color} value={v.id || v.color}>
                  🎨 {v.color} {v.sku ? `(${v.sku})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Size-Wise Planned Targets Matrix */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Size-Wise Planned Production Targets ({selectedSet?.name || 'Set'})
            </span>
            <span className="text-xs font-bold text-primary-400">
              Total Planned: {totalPlannedQty} pcs
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {availableSizes.map((ss) => {
              const qty = plannedSizes[ss.sizeId] || 0;
              return (
                <div key={ss.sizeId} className="p-2.5 rounded-lg bg-factory-900 border border-slate-700/80 text-center">
                  <div className="text-[11px] font-bold text-slate-300 mb-1">
                    Size {ss.size?.name}
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={qty === 0 ? '' : qty}
                    onChange={(e) => handleSizeQuantityChange(ss.sizeId, e.target.value)}
                    className="w-full text-center py-1 rounded bg-factory-950 border border-slate-700 text-slate-100 text-sm font-black focus:outline-none focus:border-primary-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>Target Floor Completion Date *</span>
          </label>
          <input
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Production & Material Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Pre-wash fabric before cutting, verify thread shade matching..."
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
            icon={<Factory className="w-4 h-4" />}
          >
            Create Production Work Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
