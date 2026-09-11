import React, { useState, useEffect } from 'react';
import { Customer, CreateCustomerInput } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Building2, Phone, Mail, MapPin, IndianRupee, FileText } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  customer?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customer,
}) => {
  const [formData, setFormData] = useState<CreateCustomerInput>({
    customerCode: '',
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstNumber: '',
    creditLimit: 500000,
    paymentTermsDays: 30,
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        customerCode: customer.customerCode,
        name: customer.name,
        companyName: customer.companyName || '',
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        gstNumber: customer.gstNumber || '',
        creditLimit: customer.creditLimit || 0,
        paymentTermsDays: customer.paymentTermsDays || 30,
        status: customer.status,
      });
    } else {
      setFormData({
        customerCode: '',
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        gstNumber: '',
        creditLimit: 500000,
        paymentTermsDays: 30,
        status: 'ACTIVE',
      });
    }
    setError(null);
  }, [customer, isOpen]);

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
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? `Edit Customer: ${customer.name}` : 'Add New Customer'}
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
            placeholder="e.g. Ramesh Shah"
            required
          />

          <Input
            label="Company / Firm Name"
            value={formData.companyName || ''}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="e.g. Westside Retail Ltd"
          />

          <Input
            label="Phone Number *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="buyer@company.com"
          />

          <Input
            label="City"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g. Surat / Mumbai"
          />

          <Input
            label="State"
            value={formData.state || ''}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="e.g. Gujarat"
          />

          <Input
            label="GSTIN (15 Digits)"
            value={formData.gstNumber || ''}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
            placeholder="24AAAAA0000A1Z5"
          />

          <Input
            label="Credit Limit (₹)"
            type="number"
            min="0"
            value={formData.creditLimit || 0}
            onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
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
              <option value="ACTIVE">Active Customer</option>
              <option value="INACTIVE">Inactive / On-Hold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Billing / Delivery Address</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Shop / Unit address, Textile Market, Ring Road..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            {customer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
