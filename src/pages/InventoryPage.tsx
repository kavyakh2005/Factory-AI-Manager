import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryTransaction, CreateInventoryItemInput, CreateStockAdjustmentInput } from '../types';
import { InventoryService } from '../services/inventory/inventoryService';
import { InventoryItemModal } from '../components/inventory/InventoryItemModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { Button } from '../components/common/Button';
import { Plus, Search, Layers, AlertTriangle, ArrowUpDown, History, ShieldAlert, PackageCheck, Archive, Filter, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LEDGER'>('STOCK');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedItemForAdj, setSelectedItemForAdj] = useState<InventoryItem | null>(null);

  const { currentRole } = useAuthStore();
  const canEdit = ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER'].includes(
    currentRole?.role || 'STAFF'
  );

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
  }, [typeFilter, categoryFilter, lowStockOnly, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, txData] = await Promise.all([
        InventoryService.getInventoryItems({
          itemType: typeFilter,
          category: categoryFilter,
          lowStockOnly,
          search: searchTerm,
        }),
        InventoryService.getTransactions(),
      ]);
      setItems(itemsData);
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

  // Live Metrics
  const totalStockValuation = items.reduce((acc, i) => acc + (i.currentStock || 0) * (i.unitCost || 0), 0);
  const lowStockCount = items.filter((i) => i.currentStock <= (i.minimumStockThreshold || i.minStockAlert || 10)).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory & Stock Ledger</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time material ledger, finished goods stock, and audit movements
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Registered SKUs</p>
            <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Inventory Valuation</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ₹{Math.round(totalStockValuation).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
            lowStockOnly
              ? 'bg-red-500/20 border-red-500/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-xs text-slate-400 font-medium">Low Stock Critical Alerts</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{lowStockCount} Items</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'STOCK'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Live Stock Balances
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'LEDGER'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Immutable Movement Ledger ({transactions.length})
        </button>
      </div>

      {/* Stock Tab */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by SKU code, item name, rack location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="RAW_MATERIAL">Raw Material</option>
              <option value="WIP">Work in Progress</option>
              <option value="FINISHED_GOODS">Finished Goods</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="FABRIC">Fabric</option>
              <option value="THREAD">Thread</option>
              <option value="BUTTONS">Buttons</option>
              <option value="ZIPS">Zips</option>
              <option value="PACKAGING">Packaging</option>
              <option value="APPAREL">Apparel</option>
            </select>
          </div>

          {/* Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-4">SKU / Item</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-right">Unit Cost</th>
                  <th className="p-4 text-right">Current Stock</th>
                  <th className="p-4 text-right">Valuation</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No inventory items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => {
                    const isLow = it.currentStock <= (it.minimumStockThreshold || it.minStockAlert || 10);
                    const skuCode = it.sku || it.itemCode || 'SKU';
                    const name = it.name || it.itemName || 'Item';
                    return (
                      <tr key={it.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <span className="text-xs font-mono bg-slate-800 text-indigo-400 px-2 py-0.5 rounded border border-slate-700">
                            {skuCode}
                          </span>
                          <p className="font-semibold text-white mt-1">{name}</p>
                          <span className="text-xs text-slate-500">{it.category || it.itemType}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              it.itemType === 'RAW_MATERIAL'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : it.itemType === 'WIP'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {it.itemType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-xs">{it.storageLocation || 'Warehouse Floor'}</td>
                        <td className="p-4 text-right font-medium text-slate-300">₹{it.unitCost}</td>
                        <td className="p-4 text-right">
                          <span
                            className={`font-bold text-base ${
                              isLow ? 'text-red-400' : 'text-white'
                            }`}
                          >
                            {it.currentStock.toLocaleString('en-IN')}
                          </span>{' '}
                          <span className="text-xs text-slate-400">{it.unit}</span>
                          {isLow && (
                            <span className="block text-[11px] text-red-400 font-medium">
                              Alert: Min {it.minStockAlert} {it.unit}
                            </span>
                          )}
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
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(it);
                                    setIsItemModalOpen(true);
                                  }}
                                >
                                  Edit
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
      )}

      {/* Ledger Tab */}
      {activeTab === 'LEDGER' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Item / SKU</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3">Reason / Purpose</th>
                <th className="p-3">Remarks / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No transactions recorded yet.
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
                      {tx.transactionType === 'IN' ? '+' : tx.transactionType === 'OUT' ? '-' : ''}
                      {tx.quantity} {tx.unit}
                    </td>
                    <td className="p-3 text-xs text-slate-300">{tx.reason}</td>
                    <td className="p-3 text-xs text-slate-400">{tx.remarks || tx.referenceType || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
};
