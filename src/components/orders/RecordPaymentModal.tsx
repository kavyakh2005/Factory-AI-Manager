import React, { useState } from 'react';
import { Order } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { OrderService } from '../../services/orders/orderService';
import { CreditCard, IndianRupee, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RecordPaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  if (!order) return null;

  const currentPaid = Number(order.paidAmount || 0);
  const grandTotal = Number(order.grandTotal || 0);
  const pendingBalance = Math.max(0, grandTotal - currentPaid);

  const [paymentAmount, setPaymentAmount] = useState<number>(pendingBalance);
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const newTotalPaid = currentPaid + Number(paymentAmount || 0);
  const newRemainingBalance = Math.max(0, grandTotal - newTotalPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid positive payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullNote = `Received ₹${amount} via ${paymentMode} (Ref: ${referenceNo || 'N/A'}). ${notes}`.trim();
      await OrderService.updateOrderPayment(order.id, newTotalPaid, fullNote);
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      console.error('Payment record error:', err);
      setErrorMessage(err?.message || 'Failed to update payment record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment: ${order.orderNumber}`}
      subtitle={`Customer: ${order.customer?.name || 'Customer'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Balance Overview */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Order Total</span>
            <span className="text-sm font-black text-slate-100">₹{grandTotal.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Already Paid</span>
            <span className="text-sm font-black text-emerald-400">₹{currentPaid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-semibold block">Balance Due</span>
            <span className="text-sm font-black text-amber-400">₹{pendingBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Amount Received (₹) *</span>
              <button
                type="button"
                onClick={() => setPaymentAmount(pendingBalance)}
                className="text-[10px] text-primary-400 hover:text-primary-300 underline font-semibold"
              >
                Pay Full Balance (₹{pendingBalance})
              </button>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
              <input
                type="number"
                step="any"
                min={1}
                required
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-sm font-black focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Mode *</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-medium"
              >
                <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                <option value="UPI">UPI / Google Pay / PhonePe</option>
                <option value="CASH">Cash Payment</option>
                <option value="CHEQUE">Cheque / DD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">UTR / Ref / Cheque #</label>
              <input
                type="text"
                placeholder="e.g. UTR12345678"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 50% advance against dispatch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Projected Outcome */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Updated Remaining Due:</span>
          <span className={`font-black ${newRemainingBalance === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {newRemainingBalance === 0 ? '₹0 (Fully Settled ✓)' : `₹${newRemainingBalance.toLocaleString()}`}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            isLoading={isSubmitting}
            icon={<CreditCard className="w-4 h-4" />}
            className="bg-primary-600 hover:bg-primary-500 text-white font-bold"
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
