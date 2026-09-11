import React, { useState, useEffect } from 'react';
import { Supplier, CreateSupplierInput } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplierInput) => Promise<void>;
  supplier?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplier,
}) => {
  const [formData, setFormData] = useState<CreateSupplierInput>({
    supplierCode: '',
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstNumber: '',
    materialCategory: 'FABRIC',
    paymentTermsDays: 30,
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplierCode: supplier.supplierCode,
        name: supplier.name,
        companyName: supplier.companyName || '',
        phone: supplier.phone,
        email: supplier.email || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        gstNumber: supplier.gstNumber || '',
        materialCategory: supplier.materialCategory || 'FABRIC',
        paymentTermsDays: supplier.paymentTermsDays || 30,
        status: supplier.status,
      });
    } else {
      setFormData({
        supplierCode: '',
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        gstNumber: '',
        materialCategory: 'FABRIC',
        paymentTermsDays: 30,
        status: 'ACTIVE',
      });
    }
    setError(null);
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Contact Person Name and Phone are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? `Edit Supplier: ${supplier.name}` : 'Add New Supplier'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contact Person Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Arvind Mehta"
            required
          />

          <Input
            label="Supplier / Mill Name"
            value={formData.companyName || ''}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="e.g. Vardhman Textiles Ltd"
          />

          <Input
            label="Phone Number *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98250 12345"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="sales@vardhman.com"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Material Category Supplied</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.materialCategory}
              onChange={(e) => setFormData({ ...formData, materialCategory: e.target.value })}
            >
              <option value="FABRIC">Fabric / Greige / Dyed Goods</option>
              <option value="THREAD">Sewing Threads & Yarns</option>
              <option value="ACCESSORIES">Buttons, Zips & Elastics</option>
              <option value="PACKAGING">Boxes, Polybags & Tags</option>
              <option value="CHEMICALS">Dyes & Finishing Chemicals</option>
              <option value="GENERAL">General Consumables & Spares</option>
            </select>
          </div>

          <Input
            label="GSTIN (15 Digits)"
            value={formData.gstNumber || ''}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
            placeholder="24AAACV1234E1Z0"
          />

          <Input
            label="City"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g. Surat / Ahmedabad"
          />

          <Input
            label="Payment Terms (Days)"
            type="number"
            min="0"
            value={formData.paymentTermsDays || 30}
            onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
            >
              <option value="ACTIVE">Active Vendor</option>
              <option value="INACTIVE">Inactive / Blocked</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Office / Mill Address</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Plot No., Industrial Area, Ring Road..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            {supplier ? 'Update Supplier' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
