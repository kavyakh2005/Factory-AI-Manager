import React, { useState } from 'react';
import { CreateExpenseInput } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExpenseInput) => Promise<void>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateExpenseInput>({
    expenseCategory: 'Electricity & Utilities',
    title: '',
    amount: 5000,
    expenseDate: new Date().toISOString().slice(0, 10),
    paidTo: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Expense Title / Description is required');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Factory Overhead Expense" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Expense Category *</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.expenseCategory}
              onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value })}
            >
              <option value="Electricity & Utilities">Electricity & Utilities</option>
              <option value="Machine Maintenance">Machine Maintenance & Spares</option>
              <option value="Factory Rent">Factory Rent & Property</option>
              <option value="Packaging Supplies">Packaging Supplies</option>
              <option value="Staff Welfare & Tea">Staff Welfare, Meals & Tea</option>
              <option value="Freight & Courier">Freight, Fuel & Transportation</option>
              <option value="Legal & Professional">Legal, Compliance & CA Fees</option>
              <option value="Miscellaneous">Miscellaneous Overheads</option>
            </select>
          </div>

          <Input
            label="Expense Date *"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            required
          />
        </div>

        <Input
          label="Expense Title / Description *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Needle replacement for Stitching Floor 1"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Amount (₹) *"
            type="number"
            min="1"
            step="1"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
          />

          <Input
            label="Paid To / Vendor Name"
            value={formData.paidTo || ''}
            onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
            placeholder="e.g. Apex Machine Works / DGVCL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Narration / Bill Reference</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Voucher #, bill number or reason details..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Log Expense Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
