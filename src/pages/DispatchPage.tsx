import React, { useState, useEffect } from 'react';
import { Dispatch, CreateDispatchInput } from '../types';
import { DispatchService } from '../services/dispatch/dispatchService';
import { CreateDispatchModal } from '../components/dispatch/CreateDispatchModal';
import { Button } from '../components/common/Button';
import { Plus, Search, Truck, PackageCheck, MapPin, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const DispatchPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { currentRole } = useAuthStore();
  const canEdit = ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER'].includes(
    currentRole?.role || 'STAFF'
  );

  useEffect(() => {
    loadDispatches();
  }, [searchTerm, statusFilter]);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const data = await DispatchService.getDispatches({
        search: searchTerm,
        status: statusFilter,
      });
      setDispatches(data);
    } catch (err) {
      console.error('Error loading dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async (data: CreateDispatchInput) => {
    await DispatchService.createDispatch(data);
    setIsModalOpen(false);
    loadDispatches();
  };

  const totalDispatchedPieces = dispatches.reduce((sum, d) => sum + (d.totalItemsCount || 0), 0);
  const totalPackages = dispatches.reduce((sum, d) => sum + (d.totalPackages || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finished Goods Dispatch & Logistics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage transport manifests, carrier tracking numbers, and delivery gate passes
          </p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create Dispatch Manifest
          </Button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Shipments Dispatched</p>
            <p className="text-2xl font-bold text-white mt-1">{dispatches.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Garments Dispatched</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {totalDispatchedPieces.toLocaleString('en-IN')} pcs
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Master Cartons / Boxes</p>
            <p className="text-2xl font-bold text-indigo-300 mt-1">{totalPackages} Cartons</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by manifest #, carrier name, tracking LR #, customer..."
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
          <option value="ALL">All Delivery Statuses</option>
          <option value="PACKED">Packed & Ready</option>
          <option value="IN_TRANSIT">In-Transit</option>
          <option value="DELIVERED">Delivered to Buyer</option>
        </select>
      </div>

      {/* Dispatch Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading dispatch manifests...</div>
      ) : dispatches.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base text-slate-300 font-medium">No dispatch entries recorded yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch completed garments directly against confirmed customer orders.
          </p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-4">Manifest #</th>
                <th className="p-4">Customer & Order</th>
                <th className="p-4">Carrier & Tracking</th>
                <th className="p-4 text-right">Packages</th>
                <th className="p-4 text-right">Dispatched Qty</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Dispatch Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dispatches.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-white text-sm">
                    {d.dispatchNumber}
                    {d.vehicleNumber && (
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">
                        Vehicle: {d.vehicleNumber}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white">
                      {d.customer?.name || d.order?.customerName || 'Direct Customer'}
                    </p>
                    <span className="text-xs font-mono text-indigo-400">
                      Order: #{d.order?.orderNumber || d.orderId}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-200 font-medium">{d.carrierName || 'Self Transport'}</p>
                    {d.trackingNumber && (
                      <span className="text-xs font-mono text-slate-400">LR: {d.trackingNumber}</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-medium text-slate-300">
                    {d.totalPackages} Cartons
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-400">
                    {d.totalItemsCount.toLocaleString('en-IN')} pcs
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        d.deliveryStatus === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : d.deliveryStatus === 'IN_TRANSIT'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {d.deliveryStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    {new Date(d.dispatchDate).toLocaleDateString('en-IN', {
                      dateStyle: 'medium',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <CreateDispatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateDispatch}
      />
    </div>
  );
};
