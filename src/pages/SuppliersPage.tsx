import React, { useState, useEffect } from 'react';
import { Supplier, CreateSupplierInput } from '../types';
import { SupplierService } from '../services/suppliers/supplierService';
import { SupplierModal } from '../components/suppliers/SupplierModal';
import { Button } from '../components/common/Button';
import { Plus, Search, Truck, Phone, Mail, MapPin, Edit, Trash2, Tag } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { currentRole } = useAuthStore();
  const canEdit = ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'].includes(
    currentRole?.role || 'STAFF'
  );

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"? This cannot be undone.`)) {
      try {
        await SupplierService.deleteSupplier(id);
        await loadSuppliers();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete supplier');
      }
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [searchTerm, categoryFilter]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await SupplierService.getSuppliers({
        search: searchTerm,
        category: categoryFilter,
      });
      setSuppliers(data);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async (data: CreateSupplierInput) => {
    if (editingSupplier) {
      await SupplierService.updateSupplier(editingSupplier.id, data);
    } else {
      await SupplierService.createSupplier(data);
    }
    setEditingSupplier(null);
    loadSuppliers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Supplier Master</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage fabric mills, yarn spinners, trims vendors, and payment terms
          </p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by supplier name, company, phone, code or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Categories</option>
          <option value="FABRIC">Fabric & Textiles</option>
          <option value="THREAD">Thread & Yarns</option>
          <option value="ACCESSORIES">Buttons & Accessories</option>
          <option value="PACKAGING">Packaging & Cartons</option>
          <option value="GENERAL">General Consumables</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading vendor list...</div>
      ) : suppliers.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base text-slate-300 font-medium">No suppliers found</p>
          <p className="text-sm text-slate-500 mt-1">Add your fabric mills and trims vendors to enable purchase orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all rounded-xl p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">
                    {s.supplierCode}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-2">{s.name}</h3>
                {s.companyName && <p className="text-sm text-slate-400 mt-0.5">{s.companyName}</p>}

                <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-slate-900/80 text-indigo-300 px-2.5 py-1 rounded-md border border-slate-700">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  Category: <span className="font-semibold text-white">{s.materialCategory || 'General'}</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-300 border-t border-slate-700/60 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        {s.city}
                        {s.state ? `, ${s.state}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/60 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Payment Terms</span>
                  <span className="text-slate-200 font-semibold">{s.paymentTermsDays || 30} Days Net</span>
                </div>
              </div>

              {canEdit && (
                <div className="mt-4 pt-3 border-t border-slate-700 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                    onClick={() => {
                      setEditingSupplier(s);
                      setIsModalOpen(true);
                    }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Vendor
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                    onClick={() => handleDeleteSupplier(s.id, s.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleSaveSupplier}
        supplier={editingSupplier}
      />
    </div>
  );
};
