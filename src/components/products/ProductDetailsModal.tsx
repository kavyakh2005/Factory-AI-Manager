import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Product, Set as GarmentSet } from '../../types';
import { ProductService } from '../../services/products/productService';
import {
  Package,
  Layers,
  Sparkles,
  Tag,
  Scissors,
  Calendar,
  Percent,
  CheckCircle2,
  Edit2,
  Image as ImageIcon,
} from 'lucide-react';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
}) => {
  if (!product) return null;

  const marginMetrics = ProductService.calculateMargins(product.costPrice, product.sellingPrice);
  const assignedSets = product.productSets?.map((ps) => ps.set).filter(Boolean) as GarmentSet[] || [];

  // Total unique sizes across all assigned sets
  const allAssignedSizes = new Map<string, string>();
  assignedSets.forEach((s) => {
    s.setSizes?.forEach((ss) => {
      if (ss.size) allAssignedSizes.set(ss.size.id, ss.size.name);
    });
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Product Specification: ${product.name}`}
      subtitle={`Code / SKU: ${product.code} • Category: ${product.category}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Product Hero Card */}
        <div className="p-5 bg-gradient-to-r from-slate-900/90 via-factory-900 to-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-20 h-24 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-500" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white">{product.name}</h3>
                <Badge
                  variant={product.status === 'ACTIVE' ? 'success' : 'neutral'}
                  size="sm"
                >
                  {product.status}
                </Badge>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {product.code}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                <span>Fabric: <strong className="text-slate-200">{product.fabric}</strong></span>
                {product.pattern && <span>Pattern: <strong className="text-slate-200">{product.pattern}</strong></span>}
                <span>Unit: <strong className="text-slate-200">{product.unit || 'pcs'}</strong></span>
              </div>

              {product.description && (
                <p className="text-xs text-slate-400 max-w-xl line-clamp-2 pt-1">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="shrink-0 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-primary-400" />
              Edit Specs
            </Button>
          )}
        </div>

        {/* Financial & Gross Margin Analysis */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Wholesale Pricing & Margins
            </h4>
            <span className="text-[11px] text-slate-500">Live Calculated</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Cost Price</div>
              <div className="text-base font-bold text-slate-200 mt-1">₹{product.costPrice}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Manufacturing / pc</div>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Wholesale Price</div>
              <div className="text-base font-bold text-emerald-400 mt-1">₹{product.sellingPrice}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Standard Order Rate</div>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Gross Margin</div>
              <div className="text-base font-bold text-emerald-300 mt-1">₹{marginMetrics.grossMargin}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Profit per piece</div>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Gross Margin %</div>
              <div className={`text-base font-extrabold mt-1 ${marginMetrics.marginPercent >= 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {marginMetrics.marginPercent}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Yield on revenue</div>
            </div>
          </div>
        </div>

        {/* Assigned Sets & Dynamic Size Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary-400" />
              Configured Sets & Size Matrix Hierarchy
            </h4>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-primary-300 font-bold">{assignedSets.length}</span> Sets •{' '}
              <span className="text-emerald-300 font-bold">{allAssignedSizes.size}</span> Total Sizes
            </div>
          </div>

          {assignedSets.length === 0 ? (
            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
              No specific sets assigned. This product can utilize all global factory sets.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedSets.map((set) => (
                <div
                  key={set.id}
                  className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-400" />
                      <span className="font-bold text-slate-200 text-xs">{set.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({set.code})</span>
                    </div>
                    <Badge variant="primary" size="sm">
                      {set.type}
                    </Badge>
                  </div>

                  {set.description && (
                    <div className="text-[11px] text-slate-400 italic">
                      {set.description}
                    </div>
                  )}

                  {/* Size Matrix for this Set */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">
                      Available Sizes in this Set:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {set.setSizes && set.setSizes.length > 0 ? (
                        set.setSizes.map((ss) => (
                          <div
                            key={ss.id}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center min-w-[54px]"
                          >
                            <div className="text-xs font-black text-slate-100">
                              {ss.size?.name || ss.sizeId}
                            </div>
                            {ss.size?.chestMeasure ? (
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                Chest {ss.size.chestMeasure}"
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500 text-xs italic">No sizes mapped</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamps Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div>
            Created:{' '}
            <span className="text-slate-400">
              {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Active catalog'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
