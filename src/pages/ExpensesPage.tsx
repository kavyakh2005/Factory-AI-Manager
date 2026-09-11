import React, { useState, useEffect } from 'react';
import { Expense, CreateExpenseInput } from '../types';
import { ExpenseService } from '../services/expenses/expenseService';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { Button } from '../components/common/Button';
import { Plus, Search, Receipt, IndianRupee, PieChart, Tag, Calendar, Building } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<{ totalExpenses: number; categoryBreakdown: Record<string, number> }>({
    totalExpenses: 0,
    categoryBreakdown: {},
  });

  const { currentRole } = useAuthStore();
  const canEdit = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(currentRole?.role || 'STAFF');

  useEffect(() => {
    loadData();
  }, [searchTerm, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, sum] = await Promise.all([
        ExpenseService.getExpenses({
          category: categoryFilter,
          search: searchTerm,
        }),
        ExpenseService.getExpenseSummary(),
      ]);
      setExpenses(list);
      setSummary(sum);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (data: CreateExpenseInput) => {
    await ExpenseService.createExpense(data);
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Factory Expenses & Overheads</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track electricity bills, machine maintenance, plant rent, and operational costs
          </p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Expense Entry
          </Button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Factory Overheads</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              ₹{Math.round(summary.totalExpenses).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Logged Vouchers</p>
            <p className="text-2xl font-bold text-white mt-1">{expenses.length} Entries</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Cost Categories</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {Object.keys(summary.categoryBreakdown).length} Heads
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by expense title, paid to, category, or narration..."
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
          <option value="ALL">All Cost Categories</option>
          <option value="Electricity & Utilities">Electricity & Utilities</option>
          <option value="Machine Maintenance">Machine Maintenance</option>
          <option value="Factory Rent">Factory Rent</option>
          <option value="Packaging Supplies">Packaging Supplies</option>
          <option value="Staff Welfare & Tea">Staff Welfare & Tea</option>
          <option value="Freight & Courier">Freight & Courier</option>
          <option value="Legal & Professional">Legal & Professional</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading expense vouchers...</div>
      ) : expenses.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base text-slate-300 font-medium">No expenses logged</p>
          <p className="text-sm text-slate-500 mt-1">Log factory overheads to calculate net business profitability.</p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Expense Title / Description</th>
                <th className="p-4">Paid To</th>
                <th className="p-4">Notes / Voucher</th>
                <th className="p-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 text-xs text-slate-300">
                    {new Date(e.expenseDate).toLocaleDateString('en-IN', {
                      dateStyle: 'medium',
                    })}
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-800 text-indigo-300 border border-slate-700">
                      {e.expenseCategory}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-white">{e.title}</td>
                  <td className="p-4 text-slate-400 text-xs">{e.paidTo || '-'}</td>
                  <td className="p-4 text-slate-400 text-xs">{e.notes || '-'}</td>
                  <td className="p-4 text-right font-bold text-red-400">
                    ₹{Math.round(e.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
};
