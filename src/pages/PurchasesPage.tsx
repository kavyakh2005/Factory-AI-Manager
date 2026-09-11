import React, { useState, useEffect } from 'react';
import { PurchaseOrder, CreatePurchaseOrderInput } from '../types';
import { PurchaseService } from '../services/purchases/purchaseService';
import { PurchaseOrderModal } from '../components/purchases/PurchaseOrderModal';
import { ReceivePurchaseModal } from '../components/purchases/ReceivePurchaseModal';
import { Button } from '../components/common/Button';
import { Plus, Search, ShoppingCart, Truck, Calendar, IndianRupee, PackagePlus, Eye, Clock, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const PurchasesPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  const { currentRole } = useAuthStore();
  const canEdit = ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'].includes(
    currentRole?.role || 'STAFF'
  );

  const handleDeletePO = async (id: string, poNumber: string) => {
    if (window.confirm(`Are you sure you want to delete purchase order "${poNumber}"?`)) {
      try {
        await PurchaseService.deletePurchaseOrder(id);
        await loadPOs();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete PO');
      }
    }
  };

  useEffect(() => {
    loadPOs();
  }, [searchTerm, statusFilter]);

  const loadPOs = async () => {
    try {
      setLoading(true);
      const data = await PurchaseService.getPurchaseOrders({
        search: searchTerm,
        status: statusFilter,
      });
      setPurchaseOrders(data);
    } catch (err) {
      console.error('Error loading purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (data: CreatePurchaseOrderInput) => {
    await PurchaseService.createPurchaseOrder(data);
    setIsCreateOpen(false);
    loadPOs();
  };

  const handleReceiveGoods = async (
    poId: string,
    receivedList: Array<{ itemId?: string; itemName: string; receivedQty: number; unit: string }>
  ) => {
    await PurchaseService.receiveGoods(poId, receivedList);
    setReceivingPO(null);
    loadPOs();
  };

  const totalProcurementValue = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
  const pendingReceivalCount = purchaseOrders.filter(
    (po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Purchase Orders & Raw Material Inward</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track fabric procurement, supplier POs, and dock receiving ledger
          </p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </Button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Purchase Orders</p>
            <p className="text-2xl font-bold text-white mt-1">{purchaseOrders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending Delivery / In-Transit</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingReceivalCount} POs</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Procurement Budget</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ₹{Math.round(totalProcurementValue).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by PO #, supplier name, or item description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft PO</option>
          <option value="ORDERED">Ordered / In-Transit</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Fully Received</option>
        </select>
      </div>

      {/* PO List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading procurement orders...</div>
      ) : purchaseOrders.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base text-slate-300 font-medium">No purchase orders found</p>
          <p className="text-sm text-slate-500 mt-1">Create a purchase order to initiate raw material inward.</p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier / Mill</th>
                <th className="p-4">Items / Materials</th>
                <th className="p-4">Expected Date</th>
                <th className="p-4 text-right">PO Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {purchaseOrders.map((po) => {
                const isCompleted = po.status === 'RECEIVED';
                return (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-white text-sm">{po.poNumber}</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(po.orderDate).toLocaleDateString('en-IN')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{po.supplier?.name || 'Unknown Supplier'}</p>
                      <p className="text-xs text-slate-400">{po.supplier?.companyName}</p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {po.items?.map((it, idx) => (
                          <div key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            <span>
                              {it.itemName}: <span className="font-bold text-white">{it.quantity} {it.unit}</span>
                              {it.receivedQuantity !== undefined && it.receivedQuantity > 0 && (
                                <span className="text-emerald-400 ml-1">
                                  ({it.receivedQuantity} rec.)
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      {new Date(po.expectedDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400">
                      ₹{Math.round(po.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          po.status === 'RECEIVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : po.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {canEdit && !isCompleted && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={() => setReceivingPO(po)}
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            Receive Dock Inward
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            onClick={() => handleDeletePO(po.id, po.poNumber)}
                            title="Delete PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PO Modal */}
      <PurchaseOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreatePO}
      />

      {/* Receive Modal */}
      <ReceivePurchaseModal
        isOpen={!!receivingPO}
        onClose={() => setReceivingPO(null)}
        purchaseOrder={receivingPO}
        onReceive={handleReceiveGoods}
      />
    </div>
  );
};
