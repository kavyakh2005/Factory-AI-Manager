import React, { useState, useEffect } from 'react';
import { Payment, CreatePaymentInput, PaymentType } from '../types';
import { PaymentService } from '../services/payments/paymentService';
import { PaymentModal } from '../components/payments/PaymentModal';
import { Button } from '../components/common/Button';
import { Plus, Search, IndianRupee, ArrowDownLeft, ArrowUpRight, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<PaymentType>('CUSTOMER_RECEIPT');
  const [financialSummary, setFinancialSummary] = useState({
    totalReceived: 0,
    totalPaid: 0,
    netReceivable: 0,
    netPayable: 0,
  });

  const { currentRole } = useAuthStore();
  const canEdit = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(currentRole?.role || 'STAFF');

  useEffect(() => {
    loadData();
  }, [searchTerm, typeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, summary] = await Promise.all([
        PaymentService.getPayments({
          paymentType: typeFilter,
          search: searchTerm,
        }),
        PaymentService.getFinancialSummary(),
      ]);
      setPayments(list);
      setFinancialSummary(summary);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (data: CreatePaymentInput) => {
    await PaymentService.createPayment(data);
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments & Financial Ledger</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track customer collections, supplier disbursements, and market dues
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => {
                setModalDefaultType('SUPPLIER_PAYMENT');
                setIsModalOpen(true);
              }}
            >
              <ArrowUpRight className="w-4 h-4 text-red-400" />
              Pay Supplier
            </Button>
            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => {
                setModalDefaultType('CUSTOMER_RECEIPT');
                setIsModalOpen(true);
              }}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Receive Payment
            </Button>
          </div>
        )}
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Customer Collections Received</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{Math.round(financialSummary.totalReceived).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total cash / bank inflow</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Supplier Payouts Released</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            ₹{Math.round(financialSummary.totalPaid).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Procurement payouts</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Market Receivables Outstanding</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            ₹{Math.round(financialSummary.netReceivable).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Due from buyers</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Vendor Payables Outstanding</p>
          <p className="text-2xl font-bold text-indigo-300 mt-1">
            ₹{Math.round(financialSummary.netPayable).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Due to fabric mills</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by transaction #, reference UTR, party name, or order #..."
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
          <option value="ALL">All Ledger Entries</option>
          <option value="CUSTOMER_RECEIPT">Customer Receipts (+)</option>
          <option value="SUPPLIER_PAYMENT">Supplier Payouts (-)</option>
        </select>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading payment ledger...</div>
      ) : payments.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <IndianRupee className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base text-slate-300 font-medium">No payment transactions recorded</p>
          <p className="text-sm text-slate-500 mt-1">
            Record customer advances or vendor bill payments to maintain the factory balance ledger.
          </p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-4">Payment #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Party / Account</th>
                <th className="p-4">Linked Reference</th>
                <th className="p-4">Mode / UTR</th>
                <th className="p-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {payments.map((p) => {
                const isReceipt = p.paymentType === 'CUSTOMER_RECEIPT';
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-white text-sm">
                      {p.paymentNumber}
                      <span
                        className={`block text-[11px] font-semibold mt-0.5 ${
                          isReceipt ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isReceipt ? 'RECEIPT (+)' : 'PAYOUT (-)'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-white">
                        {isReceipt
                          ? p.customer?.name || 'Customer'
                          : p.supplier?.name || 'Supplier'}
                      </p>
                      <span className="text-xs text-slate-400">
                        {isReceipt ? p.customer?.companyName : p.supplier?.companyName}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {p.order && (
                        <span className="font-mono text-indigo-400">
                          Order #{p.order.orderNumber}
                        </span>
                      )}
                      {p.purchaseOrder && (
                        <span className="font-mono text-blue-400">
                          PO #{p.purchaseOrder.poNumber}
                        </span>
                      )}
                      {!p.order && !p.purchaseOrder && (
                        <span className="text-slate-500">General Ledger Account</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      <p className="font-medium text-white">{p.paymentMode.replace('_', ' ')}</p>
                      {p.transactionReference && (
                        <span className="text-slate-500 font-mono">{p.transactionReference}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`text-base font-bold ${
                          isReceipt ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isReceipt ? '+' : '-'}₹{Math.round(p.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePayment}
        defaultType={modalDefaultType}
      />
    </div>
  );
};
