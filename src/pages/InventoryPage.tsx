import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  InventoryTransaction,
  CreateInventoryItemInput,
  CreateStockAdjustmentInput,
  FinishedGoodsStock,
  StockReturn,
  StockAgingSummary,
} from '../types';
import { InventoryService } from '../services/inventory/inventoryService';
import { FinishedGoodsService } from '../services/inventory/finishedGoodsService';
import { InventoryItemModal } from '../components/inventory/InventoryItemModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { CustomerReturnModal } from '../components/inventory/CustomerReturnModal';
import { Button } from '../components/common/Button';
import {
  Plus,
  Search,
  Layers,
  AlertTriangle,
  ArrowUpDown,
  History,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Sparkles,
  ShieldCheck,
  Wrench,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [finishedStock, setFinishedStock] = useState<FinishedGoodsStock[]>([]);
  const [agingReport, setAgingReport] = useState<StockAgingSummary | null>(null);
  const [stockReturns, setStockReturns] = useState<StockReturn[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'READY_STOCK' | 'RAW_MATERIAL' | 'LEDGER' | 'RETURNS'>('READY_STOCK');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [agingFilter, setAgingFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedItemForAdj, setSelectedItemForAdj] = useState<InventoryItem | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission('INVENTORY', 'canCreate') || hasPermission('INVENTORY', 'canEdit');

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete SKU / item "${name}"?`)) {
      try {
        await InventoryService.deleteInventoryItem(id);
        await loadData();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete item');
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, categoryFilter, agingFilter, lowStockOnly, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, fgData, agingData, returnsData, txData] = await Promise.all([
        InventoryService.getInventoryItems({
          itemType: typeFilter,
          category: categoryFilter,
          lowStockOnly,
          search: searchTerm,
        }),
        FinishedGoodsService.getFinishedGoodsStock({
          search: searchTerm,
          agingBracket: agingFilter,
        }),
        FinishedGoodsService.getStockAgingReport(),
        FinishedGoodsService.getStockReturns(),
        InventoryService.getTransactions(),
      ]);
      setItems(itemsData);
      setFinishedStock(fgData);
      setAgingReport(agingData);
      setStockReturns(returnsData);
      setTransactions(txData);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (data: CreateInventoryItemInput) => {
    if (editingItem) {
      await InventoryService.updateInventoryItem(editingItem.id, data);
    } else {
      await InventoryService.createInventoryItem(data);
    }
    setEditingItem(null);
    loadData();
  };

  const handleStockAdjustment = async (data: CreateStockAdjustmentInput) => {
    await InventoryService.recordStockMovement(data);
    setSelectedItemForAdj(null);
    loadData();
  };

  // Live Calculations
  const totalPhysical = agingReport?.totalReadyStock || 0;
  const totalReserved = agingReport?.totalReservedStock || 0;
  const totalDispatchable = agingReport?.totalDispatchableStock || 0;
  const totalStockValuation = agingReport?.totalStockValue || items.reduce((acc, i) => acc + (i.currentStock || 0) * (i.unitCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Warehouse & Ready-Stock Inventory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Make-to-Stock Architecture
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time finished goods ready stock, customer order reservations, material ledger & QC returns
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <Button
                variant="secondary"
                className="flex items-center gap-2 border-indigo-500/30 text-indigo-300"
                onClick={() => setIsReturnModalOpen(true)}
              >
                <RotateCcw className="w-4 h-4" />
                Customer Return (QC)
              </Button>
              <Button
                variant="secondary"
                className="flex items-center gap-2"
                onClick={() => {
                  setSelectedItemForAdj(null);
                  setIsAdjustmentModalOpen(true);
                }}
              >
                <ArrowUpDown className="w-4 h-4" />
                Stock In / Out
              </Button>
              <Button
                variant="primary"
                className="flex items-center gap-2"
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Item / SKU
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Ready-Stock Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-factory-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Physical Ready Stock</p>
            <p className="text-2xl font-extrabold text-white mt-1">{totalPhysical.toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-normal">pcs</span></p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Packed & in warehouse</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-factory-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Reserved for Orders</p>
            <p className="text-2xl font-extrabold text-amber-300 mt-1">{totalReserved.toLocaleString('en-IN')} <span className="text-xs text-amber-400/70 font-normal">pcs</span></p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Allocated to active buyers</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-factory-900/60 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between shadow-sm bg-gradient-to-br from-emerald-950/20 to-teal-950/10">
          <div>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Dispatchable (Available)</p>
            <p className="text-2xl font-extrabold text-emerald-300 mt-1">{totalDispatchable.toLocaleString('en-IN')} <span className="text-xs text-emerald-400/70 font-normal">pcs</span></p>
            <span className="text-[11px] text-emerald-400/80 mt-0.5 block">Free to sell / ship</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-factory-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ready Stock Valuation</p>
            <p className="text-2xl font-extrabold text-cyan-400 mt-1">₹{Math.round(totalStockValuation).toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">At inventory standard cost</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stock Aging Summary Strip */}
      {agingReport && (
        <div className="bg-factory-950 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-300 gap-2">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Clock className="w-4 h-4 text-indigo-400" /> Finished Goods Stock Aging & Velocity:
            </span>
            <span className="text-slate-400 font-normal text-[11px]">
              Fast: <strong className="text-emerald-400">{agingReport.fastMovingCount}</strong> | Slow: <strong className="text-amber-400">{agingReport.slowMovingCount}</strong> | Dead: <strong className="text-red-400">{agingReport.deadStockCount}</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">0–30 Days (Fresh)</span>
              <span className="text-sm font-extrabold text-emerald-300">{agingReport.bracket0To30.toLocaleString('en-IN')} pcs</span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">31–60 Days</span>
              <span className="text-sm font-extrabold text-blue-300">{agingReport.bracket31To60.toLocaleString('en-IN')} pcs</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">61–90 Days (Slow)</span>
              <span className="text-sm font-extrabold text-amber-300">{agingReport.bracket61To90.toLocaleString('en-IN')} pcs</span>
            </div>
            <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-red-400 block">90+ Days (Dead Stock)</span>
              <span className="text-sm font-extrabold text-red-300">{agingReport.bracket90Plus.toLocaleString('en-IN')} pcs</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('READY_STOCK')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'READY_STOCK'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          Ready Finished Goods ({finishedStock.length})
        </button>
        <button
          onClick={() => setActiveTab('RAW_MATERIAL')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'RAW_MATERIAL'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Raw Materials & Trims ({items.filter(i => i.itemType !== 'FINISHED_GOODS').length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'LEDGER'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Stock Movement Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('RETURNS')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'RETURNS'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          QC Customer Returns ({stockReturns.length})
        </button>
      </div>

      {/* 1. READY STOCK TAB */}
      {activeTab === 'READY_STOCK' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-factory-900/60 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search style, product name, set, or size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-factory-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="px-3 py-2 bg-factory-950 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Aging Brackets</option>
              <option value="0-30">0–30 Days (Fresh)</option>
              <option value="31-60">31–60 Days</option>
              <option value="61-90">61–90 Days (Slow)</option>
              <option value="90+">90+ Days (Dead)</option>
            </select>
          </div>

          {/* Ready Stock Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-factory-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-factory-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Product Style & Set</th>
                    <th className="p-4">Size</th>
                    <th className="p-4 text-right">Physical Stock</th>
                    <th className="p-4 text-right">Reserved</th>
                    <th className="p-4 text-right">Dispatchable (Free)</th>
                    <th className="p-4">Stock Aging</th>
                    <th className="p-4">Velocity</th>
                    <th className="p-4">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {finishedStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No finished ready-stock records found. Move packed batches through production to populate ready stock.
                      </td>
                    </tr>
                  ) : (
                    finishedStock.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <p className="font-bold text-white">{s.productName}</p>
                          <span className="text-xs text-slate-400">
                            {s.productCode} • Set: <strong className="text-slate-300">{s.setName || 'Standard'}</strong>
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-300 font-bold border border-slate-700 text-xs">
                            Size {s.sizeName}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-white text-base">
                          {s.physicalQuantity.toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-normal">pcs</span>
                        </td>
                        <td className="p-4 text-right font-bold text-amber-400 text-base">
                          {s.reservedQuantity > 0 ? `${s.reservedQuantity.toLocaleString('en-IN')} pcs` : '0'}
                        </td>
                        <td className="p-4 text-right font-extrabold text-emerald-400 text-base">
                          {s.dispatchableQuantity.toLocaleString('en-IN')} <span className="text-xs text-emerald-400/80 font-normal">pcs</span>
                        </td>
                        <td className="p-4 text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            s.agingBracket === '0-30'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : s.agingBracket === '31-60'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : s.agingBracket === '61-90'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {s.agingBracket} days ({s.stockAgeDays || 0}d)
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold">
                          <span className={`px-2 py-0.5 rounded-full ${
                            s.movementSpeed === 'FAST'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : s.movementSpeed === 'SLOW'
                              ? 'text-amber-400 bg-amber-500/10'
                              : s.movementSpeed === 'DEAD'
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-blue-400 bg-blue-500/10'
                          }`}>
                            {s.movementSpeed}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-400">{s.storageLocation || 'Finished Bay'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. RAW MATERIAL TAB */}
      {activeTab === 'RAW_MATERIAL' && (
        <div className="space-y-4">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-factory-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-factory-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">SKU / Material</th>
                    <th className="p-4">Classification</th>
                    <th className="p-4">Location</th>
                    <th className="p-4 text-right">Unit Cost</th>
                    <th className="p-4 text-right">Current Stock</th>
                    <th className="p-4 text-right">Valuation</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.filter(i => i.itemType !== 'FINISHED_GOODS').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No raw material items found.
                      </td>
                    </tr>
                  ) : (
                    items
                      .filter((i) => i.itemType !== 'FINISHED_GOODS')
                      .map((it) => {
                        const isLow = it.currentStock <= (it.minimumStockThreshold || it.minStockAlert || 10);
                        return (
                          <tr key={it.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-4">
                              <span className="text-xs font-mono bg-slate-800 text-indigo-400 px-2 py-0.5 rounded border border-slate-700">
                                {it.sku}
                              </span>
                              <p className="font-semibold text-white mt-1">{it.name}</p>
                              <span className="text-xs text-slate-500">{it.category || it.itemType}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {it.itemType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 text-xs">{it.storageLocation || 'Raw Material Rack'}</td>
                            <td className="p-4 text-right font-medium text-slate-300">₹{it.unitCost}</td>
                            <td className="p-4 text-right">
                              <span className={`font-bold text-base ${isLow ? 'text-red-400' : 'text-white'}`}>
                                {it.currentStock.toLocaleString('en-IN')}
                              </span>{' '}
                              <span className="text-xs text-slate-400">{it.unit}</span>
                            </td>
                            <td className="p-4 text-right font-semibold text-emerald-400">
                              ₹{Math.round(it.currentStock * it.unitCost).toLocaleString('en-IN')}
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                {canEdit && (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedItemForAdj(it);
                                        setIsAdjustmentModalOpen(true);
                                      }}
                                    >
                                      Adjust
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDeleteItem(it.id, it.name || it.sku || 'Item')}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEDGER TAB */}
      {activeTab === 'LEDGER' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-factory-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-factory-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Item / Reference</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3">Reason / Purpose</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-xs text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3 font-medium text-white">{tx.itemName || tx.itemId}</td>
                      <td className="p-3">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            tx.transactionType === 'IN'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : tx.transactionType === 'OUT'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange} pcs
                      </td>
                      <td className="p-3 text-xs text-slate-300">{tx.referenceType || tx.reason}</td>
                      <td className="p-3 text-xs text-slate-400">{tx.notes || tx.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. RETURNS TAB */}
      {activeTab === 'RETURNS' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-factory-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-factory-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Return Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Size & Product</th>
                  <th className="p-3 text-right">Returned Qty</th>
                  <th className="p-3 text-center">QC Routing Breakdown</th>
                  <th className="p-3">Inspector</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stockReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No customer returns recorded yet.
                    </td>
                  </tr>
                ) : (
                  stockReturns.map((rtn) => (
                    <tr key={rtn.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-xs font-bold text-indigo-400">{rtn.returnNumber}</td>
                      <td className="p-3 font-medium text-white">{rtn.customerName || 'Customer'}</td>
                      <td className="p-3 text-xs text-slate-300">Size {rtn.sizeId}</td>
                      <td className="p-3 text-right font-bold text-white">{rtn.returnedQuantity} pcs</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Good: {rtn.qcPassedQuantity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                            Damaged: {rtn.qcDamagedQuantity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Rework: {rtn.qcReworkQuantity}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-slate-400">{rtn.inspectedBy || 'QC Floor'}</td>
                      <td className="p-3 text-xs text-slate-400">{rtn.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Modal */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        item={editingItem}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedItemForAdj(null);
        }}
        onSubmit={handleStockAdjustment}
        items={items}
        selectedItem={selectedItemForAdj}
      />

      {/* Customer Return Modal */}
      <CustomerReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onReturnProcessed={loadData}
      />
    </div>
  );
};
