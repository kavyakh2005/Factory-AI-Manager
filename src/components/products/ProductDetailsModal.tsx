import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Product, Set as GarmentSet } from '../../types';
import { ProductService, ProductDetailFullStock } from '../../services/products/productService';
import {
  Package,
  Layers,
  Sparkles,
  Scissors,
  CheckCircle2,
  Edit2,
  Image as ImageIcon,
  Boxes,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  FileSpreadsheet,
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
  const [activeTab, setActiveTab] = useState<'STOCK' | 'SPECS' | 'PRODUCTION' | 'LEDGER'>('STOCK');

  const { data: detailData, isLoading } = useQuery<ProductDetailFullStock | null>({
    queryKey: ['product-details-with-stock', product?.id],
    queryFn: () => (product?.id ? ProductService.getProductDetailsWithStock(product.id) : null),
    enabled: !!product?.id && isOpen,
  });

  if (!product) return null;

  const activeProduct = detailData?.product || product;
  const marginMetrics = ProductService.calculateMargins(product.costPrice, product.sellingPrice);
  const assignedSets = product.productSets?.map((ps) => ps.set).filter(Boolean) as GarmentSet[] || [];
  const setWiseStock = detailData?.product?.setWiseStock || [];
  const productionBatches = detailData?.productionBatches || [];
  const stockMovements = detailData?.stockMovements || [];

  const totalReady = detailData?.product?.totalReadyStock || 0;
  const totalReserved = detailData?.product?.totalReservedStock || 0;
  const totalDispatchable = detailData?.product?.totalDispatchableStock || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Product Master & Ready Stock: ${product.name}`}
      subtitle={`Code: ${product.code} • Category: ${product.category} • Permanent Catalog Record`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Product Hero Card */}
        <div className="p-5 bg-gradient-to-r from-slate-900/90 via-factory-900 to-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-20 h-24 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
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
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    totalDispatchable > 20
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : totalDispatchable > 0
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      totalDispatchable > 20
                        ? 'bg-emerald-400 animate-pulse'
                        : totalDispatchable > 0
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  {totalDispatchable > 20
                    ? '🟢 Available'
                    : totalDispatchable > 0
                    ? '🟠 Low Stock'
                    : '🔴 Out of Stock'}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {product.code}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                <span>Fabric: <strong className="text-slate-200">{product.fabric}</strong></span>
                {product.pattern && <span>Pattern: <strong className="text-slate-200">{product.pattern}</strong></span>}
                <span>Unit: <strong className="text-slate-200">{product.unit || 'pcs'}</strong></span>
                <span>Wholesale: <strong className="text-emerald-400 font-bold">₹{product.sellingPrice}</strong></span>
              </div>

              {product.description && (
                <p className="text-xs text-slate-400 max-w-xl line-clamp-2 pt-0.5">
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
              className="shrink-0 flex items-center gap-1.5 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-primary-400" />
              Edit Style Specs
            </Button>
          )}
        </div>

        {/* Live Ready Stock Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Total Ready Stock (FG)
              </span>
              <div className="text-2xl font-black text-emerald-300 mt-0.5">
                {totalReady} <span className="text-xs font-normal text-emerald-500">{product.unit || 'pcs'}</span>
              </div>
              <span className="text-[10px] text-emerald-400/80">Passed QC & Packed in Factory</span>
            </div>
            <Boxes className="w-8 h-8 text-emerald-400/40" />
          </div>

          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Reserved for Orders
              </span>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                {totalReserved} <span className="text-xs font-normal text-amber-500">{product.unit || 'pcs'}</span>
              </div>
              <span className="text-[10px] text-amber-400/80">Committed to active customer orders</span>
            </div>
            <Clock className="w-8 h-8 text-amber-400/40" />
          </div>

          <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                Available to Dispatch
              </span>
              <div className="text-2xl font-black text-indigo-300 mt-0.5">
                {totalDispatchable} <span className="text-xs font-normal text-indigo-400">{product.unit || 'pcs'}</span>
              </div>
              <span className="text-[10px] text-indigo-400/80">Unreserved Ready Stock</span>
            </div>
            <CheckCircle2 className="w-8 h-8 text-indigo-400/40" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'STOCK'
                ? 'border-primary-400 text-primary-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Set & Size Ready Stock
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTION')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'PRODUCTION'
                ? 'border-primary-400 text-primary-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Production History ({productionBatches.length})
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'LEDGER'
                ? 'border-primary-400 text-primary-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Stock Movements ({stockMovements.length})
          </button>
          <button
            onClick={() => setActiveTab('SPECS')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'SPECS'
                ? 'border-primary-400 text-primary-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Pricing & Specs
          </button>
        </div>

        {/* Tab 1: SET-WISE & SIZE-WISE READY STOCK */}
        {activeTab === 'STOCK' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading live stock levels...</div>
            ) : setWiseStock.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                <Boxes className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-bold text-slate-300">No Ready Stock Recorded Yet</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  When production batches pass Quality Check and reach Packing & Ready, finished units will automatically register here under their corresponding sizes.
                </p>
              </div>
            ) : (
              setWiseStock.map((set) => (
                <div
                  key={set.setId}
                  className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="font-bold text-slate-100 text-sm">{set.setName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({set.setCode})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">
                        Total Stock:{' '}
                        <strong className="text-emerald-400 font-bold">{set.totalPhysical} {product.unit || 'pcs'}</strong>
                      </span>
                      {set.totalReserved > 0 && (
                        <span className="text-amber-400 font-semibold">
                          ({set.totalReserved} reserved)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Size Matrix Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                          <th className="py-2 px-3">Size</th>
                          <th className="py-2 px-3 text-center">Physical Ready Stock</th>
                          <th className="py-2 px-3 text-center">Reserved for Orders</th>
                          <th className="py-2 px-3 text-center">Available to Sell</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                        {set.sizes.map((sz) => (
                          <tr key={sz.sizeId} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                              {sz.sizeName}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  sz.physicalQuantity > 0
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-950 text-slate-600'
                                }`}
                              >
                                {sz.physicalQuantity}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-xs ${
                                  sz.reservedQuantity > 0
                                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                                    : 'text-slate-600'
                                }`}
                              >
                                {sz.reservedQuantity}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  sz.dispatchableQuantity > 0
                                    ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30'
                                    : 'text-slate-600'
                                }`}
                              >
                                {sz.dispatchableQuantity}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`text-[10px] font-bold ${
                                  sz.dispatchableQuantity > 5
                                    ? 'text-emerald-400'
                                    : sz.dispatchableQuantity > 0
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {sz.dispatchableQuantity > 5
                                  ? 'In Stock'
                                  : sz.dispatchableQuantity > 0
                                  ? 'Low Stock'
                                  : 'Out of Stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: PRODUCTION HISTORY */}
        {activeTab === 'PRODUCTION' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Manufacturing batches executed for this style and their completion numbers into Ready Stock:
            </div>

            {productionBatches.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                <Scissors className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-bold text-slate-300">No Production Batches Found</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Create a production order for this product in the Production Planning module to start tracking cutting, stitching, and finishing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/80">
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Current Stage</th>
                      <th className="py-2.5 px-3 text-center">Planned Qty</th>
                      <th className="py-2.5 px-3 text-center">QC Passed / Ready</th>
                      <th className="py-2.5 px-3 text-center">QC Rejected</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                    {productionBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                          {b.productionNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-primary-300 border border-slate-700">
                            {b.stageName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium">
                          {b.totalPlannedQty}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                          +{b.totalCompletedQty}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-400">
                          {b.totalRejectedQty > 0 ? `-${b.totalRejectedQty}` : '0'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant={
                              b.status === 'COMPLETED'
                                ? 'success'
                                : b.status === 'IN_PROGRESS'
                                ? 'primary'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: STOCK MOVEMENTS LEDGER */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Immutable audit ledger of all Finished Goods stock credits, customer order reservations, and dispatches:
            </div>

            {stockMovements.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                <History className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-bold text-slate-300">No Stock Transactions Logged</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Every production output, customer reservation, and delivery dispatch creates an immutable ledger entry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/80 sticky top-0">
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Transaction</th>
                      <th className="py-2.5 px-3 text-center">Change</th>
                      <th className="py-2.5 px-3 text-center">Balance After</th>
                      <th className="py-2.5 px-3">Reference / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                    {stockMovements.map((m) => {
                      const isPositive = m.quantityChange > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-[11px] text-slate-400 font-mono">
                            {new Date(m.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                m.transactionType.includes('IN') || m.transactionType.includes('OUTPUT')
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                                  : m.transactionType.includes('RESERVE')
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                                  : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                              }`}
                            >
                              {m.transactionType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-200">
                            {m.balanceAfter}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400">
                            <div>{m.notes || m.referenceType}</div>
                            {m.referenceId && (
                              <div className="font-mono text-[10px] text-slate-500">Ref: {m.referenceId}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: FINANCIAL & GROSS MARGIN SPECS */}
        {activeTab === 'SPECS' && (
          <div className="space-y-4">
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

            {/* Assigned Sets details */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Assigned Size Sets
              </div>
              <div className="flex flex-wrap gap-2">
                {assignedSets.map((s) => (
                  <div key={s.id} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                    <div className="font-bold text-slate-200">{s.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Sizes: {s.setSizes?.map((ss) => ss.size?.name || ss.sizeId).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
