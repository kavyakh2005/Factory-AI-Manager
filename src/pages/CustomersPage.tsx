import React, { useState, useEffect } from 'react';
import { Customer, CreateCustomerInput } from '../types';
import { CustomerService } from '../services/customers/customerService';
import { CustomerModal } from '../components/customers/CustomerModal';
import { CustomerDetailsModal } from '../components/customers/CustomerDetailsModal';
import { Button } from '../components/common/Button';
import { Plus, Search, Building2, Phone, Mail, MapPin, Eye, Edit, Trash2, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const { currentRole } = useAuthStore();
  const canEdit = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(currentRole?.role || 'STAFF');

  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, statusFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const data = await CustomerService.getCustomers({
        search: searchTerm,
        status: statusFilter,
      });
      setCustomers(data);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setPageError(err?.message || 'Failed to load customers from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? This cannot be undone.`)) {
      try {
        await CustomerService.deleteCustomer(id);
        await loadCustomers();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete customer');
      }
    }
  };

  const handleSaveCustomer = async (data: CreateCustomerInput) => {
    if (editingCustomer) {
      await CustomerService.updateCustomer(editingCustomer.id, data);
    } else {
      await CustomerService.createCustomer(data);
    }
    setEditingCustomer(null);
    setIsCreateOpen(false);
    await loadCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Master</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage buyers, wholesale clients, retail chains, and credit limits
          </p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => {
              setEditingCustomer(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        )}
      </div>

      {pageError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Sync Warning:</span> {pageError}
          </div>
          <Button variant="secondary" size="sm" onClick={() => loadCustomers()}>
            Retry Live Sync
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, company, phone, code or city..."
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
          <option value="ACTIVE">Active Customers</option>
          <option value="INACTIVE">Inactive Customers</option>
        </select>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading customer directory...</div>
      ) : customers.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base text-slate-300 font-medium">No customers found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or add a new customer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all rounded-xl p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                    {c.customerCode || 'CUST'}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-2">{c.name}</h3>
                {c.companyName && (
                  <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {c.companyName}
                  </p>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-slate-300 border-t border-slate-700/60 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        {c.city}
                        {c.state ? `, ${c.state}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/60 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Credit Limit</span>
                  <span className="text-indigo-300 font-semibold">
                    ₹{(c.creditLimit || 0).toLocaleString('en-IN')} ({c.paymentTermsDays || 30}d)
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                  onClick={() => setViewingCustomer(c)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Button>
                {canEdit && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => {
                        setEditingCustomer(c);
                        setIsCreateOpen(true);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => handleDeleteCustomer(c.id, c.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <CustomerModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSaveCustomer}
        customer={editingCustomer}
      />

      {/* Details Modal */}
      <CustomerDetailsModal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        customer={viewingCustomer}
        onEdit={(cust) => {
          setEditingCustomer(cust);
          setIsCreateOpen(true);
        }}
      />
    </div>
  );
};
