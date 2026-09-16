import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductService, ProductWithReadyStock } from '../services/products/productService';
import { Product, Set as GarmentSet } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProductModal } from '../components/products/ProductModal';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { useAuthStore } from '../store/authStore';
import {
  Package,
  Plus,
  Search,
  Layers,
  Sparkles,
  Edit2,
  Eye,
  Trash2,
  TrendingUp,
  LayoutGrid,
  List,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Boxes,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuthStore();
  const canManage = hasRole('OWNER', 'ADMIN', 'MANAGER');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'ALL' | 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Queries with Ready Stock computation from Finished Goods inventory
  const { data: rawProducts = [], isLoading: productsLoading } = useQuery<ProductWithReadyStock[]>({
    queryKey: ['products-with-ready-stock', selectedCategory, selectedStatus, search],
    queryFn: () => ProductService.getProductsWithReadyStock({ category: selectedCategory, status: selectedStatus, search }),
  });

  const { data: sets = [] } = useQuery<GarmentSet[]>({
    queryKey: ['sets-with-sizes'],
    queryFn: () => ProductService.getSetsWithSizes(),
  });

  // Apply stock status filter if selected
  const products = rawProducts.filter((p) => {
    if (selectedStockFilter === 'ALL') return true;
    return p.stockStatus === selectedStockFilter;
  });

  // Calculate High-Level Metrics
  const totalProducts = rawProducts.length;
  const activeProducts = rawProducts.filter((p) => p.status === 'ACTIVE').length;
  const categoriesList = Array.from(new Set(rawProducts.map((p) => p.category)));
  const totalReadyStockPcs = rawProducts.reduce((acc, p) => acc + (p.totalReadyStock || 0), 0);
  const lowStockCount = rawProducts.filter((p) => p.stockStatus === 'LOW_STOCK').length;
  const outOfStockCount = rawProducts.filter((p) => p.stockStatus === 'OUT_OF_STOCK').length;

  const avgGrossMarginPercent =
    rawProducts.length > 0
      ? Number(
          (
            rawProducts.reduce((acc, p) => {
              const { marginPercent } = ProductService.calculateMargins(p.costPrice, p.sellingPrice);
              return acc + marginPercent;
            }, 0) / rawProducts.length
          ).toFixed(1)
        )
      : 0;

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the catalog?`)) {
      await ProductService.deleteProduct(id);
      queryClient.invalidateQueries({ queryKey: ['products-with-ready-stock'] });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await ProductService.updateProduct(product.id, { status: nextStatus });
    queryClient.invalidateQueries({ queryKey: ['products-with-ready-stock'] });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-400" />
              Product Master & Ready Stock
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
              {totalProducts} Styles
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {totalReadyStockPcs.toLocaleString()} Pcs in Ready Stock
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Permanent product master catalog integrated with live Finished Goods Ready Stock, QC-passed batches & size matrices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {canManage && (
            <Button
              variant="primary"
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-factory-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Catalog</span>
          <div className="text-2xl font-black text-white">{totalProducts}</div>
          <span className="text-[10px] text-slate-500">Manufactured Styles</span>
        </div>

        <div className="p-4 bg-factory-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active for Orders</span>
          <div className="text-2xl font-black text-emerald-400">{activeProducts}</div>
          <span className="text-[10px] text-emerald-500/80">Ready for booking</span>
        </div>

        <div className="p-4 bg-factory-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</span>
          <div className="text-2xl font-black text-indigo-300">{categoriesList.length}</div>
          <span className="text-[10px] text-slate-500">Coord, Ethnic, Tops</span>
        </div>

        <div className="p-4 bg-factory-900/80 border border-emerald-950/40 bg-emerald-950/10 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Boxes className="w-3.5 h-3.5 text-emerald-400" />
            Total Ready Stock
          </span>
          <div className="text-2xl font-black text-emerald-300">{totalReadyStockPcs}</div>
          <span className="text-[10px] text-emerald-500">Finished goods ready</span>
        </div>

        <div 
          onClick={() => setSelectedStockFilter(selectedStockFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`p-4 border rounded-xl space-y-1 cursor-pointer transition-all ${
            selectedStockFilter === 'LOW_STOCK' 
              ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30' 
              : 'bg-factory-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Low Stock
          </span>
          <div className="text-2xl font-black text-amber-400">{lowStockCount}</div>
          <span className="text-[10px] text-slate-500">Under 20 pcs available</span>
        </div>

        <div 
          onClick={() => setSelectedStockFilter(selectedStockFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
          className={`p-4 border rounded-xl space-y-1 cursor-pointer transition-all ${
            selectedStockFilter === 'OUT_OF_STOCK' 
              ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/30' 
              : 'bg-factory-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Out of Stock</span>
          <div className="text-2xl font-black text-rose-400">{outOfStockCount}</div>
          <span className="text-[10px] text-slate-500">0 pcs available</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-factory-900/60 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, SKU, fabric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Stock Filter:</span>
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="AVAILABLE">🟢 Available (&gt;20 pcs)</option>
              <option value="LOW_STOCK">🟠 Low Stock (1-20 pcs)</option>
              <option value="OUT_OF_STOCK">🔴 Out of Stock (0 pcs)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table vs Grid */}
      {productsLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading garment catalog and ready stock from database...
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-300">No products found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedCategory !== 'ALL' || selectedStockFilter !== 'ALL'
              ? 'No products match your search filter.'
              : 'Add your first garment style to get started with Order and Production management.'}
          </p>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
            >
              Create Product
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-factory-900/60 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Garment Style</th>
                <th className="py-3 px-4">Code / SKU</th>
                <th className="py-3 px-4">Category & Fabric</th>
                <th className="py-3 px-4">Ready Stock Breakdown</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Wholesale Rate</th>
                <th className="py-3 px-4 text-center">Gross Margin</th>
                <th className="py-3 px-4 text-center">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {products.map((p) => {
                const { grossMargin, marginPercent } = ProductService.calculateMargins(p.costPrice, p.sellingPrice);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setViewingProduct(p)}
                  >
                    {/* Style Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-primary-300 transition-colors">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.unit || 'pcs'} • {p.variants?.length || 0} Colors
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      {p.code}
                    </td>

                    {/* Category & Fabric */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{p.category}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.fabric}</div>
                    </td>

                    {/* Size-Wise Ready Stock Breakdown */}
                    <td className="py-3 px-4">
                      <div className="space-y-1.5 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-400">
                            {p.totalReadyStock || 0} {p.unit || 'pcs'}
                          </span>
                          {p.totalReservedStock > 0 && (
                            <span className="text-[10px] text-amber-400 font-medium">
                              ({p.totalReservedStock} reserved)
                            </span>
                          )}
                        </div>

                        {/* Set & Size breakdown badges */}
                        {p.setWiseStock && p.setWiseStock.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.setWiseStock.flatMap((s) =>
                              s.sizes.map((sz) => (
                                <span
                                  key={`${s.setId}-${sz.sizeId}`}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                    sz.physicalQuantity > 0
                                      ? 'bg-slate-900 text-emerald-300 border-emerald-500/30'
                                      : 'bg-slate-950 text-slate-500 border-slate-800'
                                  }`}
                                  title={`${s.setName} - Size ${sz.sizeName}: ${sz.physicalQuantity} physical (${sz.dispatchableQuantity} dispatchable)`}
                                >
                                  {sz.sizeName}: <span className="font-bold">{sz.physicalQuantity}</span>
                                </span>
                              ))
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">No stock registered</span>
                        )}
                      </div>
                    </td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 text-right font-medium text-slate-300">
                      ₹{p.costPrice}
                    </td>

                    {/* Wholesale Price */}
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                      ₹{p.sellingPrice}
                    </td>

                    {/* Gross Margin */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">₹{grossMargin} / pc</span>
                        <span
                          className={`text-xs font-extrabold ${
                            marginPercent >= 40
                              ? 'text-emerald-400'
                              : marginPercent >= 20
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {marginPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.stockStatus === 'AVAILABLE'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : p.stockStatus === 'LOW_STOCK'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.stockStatus === 'AVAILABLE'
                              ? 'bg-emerald-400 animate-pulse'
                              : p.stockStatus === 'LOW_STOCK'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        {p.stockStatus === 'AVAILABLE'
                          ? 'Available'
                          : p.stockStatus === 'LOW_STOCK'
                          ? 'Low Stock'
                          : 'Out of Stock'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingProduct(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                          title="View Ready Stock & Specs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-primary-300 transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const { grossMargin, marginPercent } = ProductService.calculateMargins(p.costPrice, p.sellingPrice);

            return (
              <div
                key={p.id}
                onClick={() => setViewingProduct(p)}
                className="bg-factory-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Thumbnail */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700">
                        {p.code}
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                          p.stockStatus === 'AVAILABLE'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : p.stockStatus === 'LOW_STOCK'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {p.stockStatus === 'AVAILABLE'
                          ? '🟢 Available'
                          : p.stockStatus === 'LOW_STOCK'
                          ? '🟠 Low Stock'
                          : '🔴 Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm group-hover:text-primary-300 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.category} • {p.fabric}
                      </div>
                    </div>

                    {/* Ready Stock Size Breakdown */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-400">Total Ready Stock:</span>
                        <span className="font-black text-emerald-400">{p.totalReadyStock || 0} {p.unit || 'pcs'}</span>
                      </div>

                      {p.setWiseStock && p.setWiseStock.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.setWiseStock.flatMap((s) =>
                            s.sizes.map((sz) => (
                              <span
                                key={`${s.setId}-${sz.sizeId}`}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                  sz.physicalQuantity > 0
                                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                                }`}
                              >
                                {sz.sizeName}: {sz.physicalQuantity}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Pricing & Actions */}
                <div className="p-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Wholesale Rate:</span>
                    <span className="text-sm font-extrabold text-emerald-400">₹{p.sellingPrice}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Margin:</span>
                    <span className="text-xs font-bold text-emerald-300">{marginPercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Create / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        availableSets={sets}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products-with-ready-stock'] });
          queryClient.invalidateQueries({ queryKey: ['products-list'] });
          setSelectedCategory('ALL');
          setSelectedStatus('ALL');
          setSelectedStockFilter('ALL');
        }}
      />

      {/* Product Details Specification & Ready Stock Modal */}
      <ProductDetailsModal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
        onEdit={(p) => {
          setEditingProduct(p);
          setIsProductModalOpen(true);
        }}
      />
    </div>
  );
};

