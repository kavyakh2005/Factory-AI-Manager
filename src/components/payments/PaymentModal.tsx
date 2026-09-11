import React, { useState, useEffect } from 'react';
import { Customer, Supplier, Order, PurchaseOrder, CreatePaymentInput, PaymentType, PaymentMode } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CustomerService } from '../../services/customers/customerService';
import { SupplierService } from '../../services/suppliers/supplierService';
import { OrderService } from '../../services/orders/orderService';
import { PurchaseService } from '../../services/purchases/purchaseService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePaymentInput) => Promise<void>;
  defaultType?: PaymentType;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'CUSTOMER_RECEIPT',
}) => {
  const [paymentType, setPaymentType] = useState<PaymentType>(defaultType);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('BANK_TRANSFER');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentType(defaultType);
      loadParties();
    }
  }, [isOpen, defaultType]);

  const loadParties = async () => {
    try {
      const [custList, supList, ordList, poList] = await Promise.all([
        CustomerService.getCustomers(),
        SupplierService.getSuppliers(),
        OrderService.getOrders(),
        PurchaseService.getPurchaseOrders(),
      ]);
      setCustomers(custList);
      setSuppliers(supList);
      setOrders(ordList);
      setPos(poList);

      if (custList.length > 0) setCustomerId(custList[0].id);
      if (supList.length > 0) setSupplierId(supList[0].id);
    } catch (err) {
      console.error('Error loading parties:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (paymentType === 'CUSTOMER_RECEIPT' && !customerId) {
      setError('Please select a customer');
      return;
    }
    if (paymentType === 'SUPPLIER_PAYMENT' && !supplierId) {
      setError('Please select a supplier');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        paymentType,
        customerId: paymentType === 'CUSTOMER_RECEIPT' ? customerId : undefined,
        supplierId: paymentType === 'SUPPLIER_PAYMENT' ? supplierId : undefined,
        orderId: orderId || undefined,
        purchaseOrderId: purchaseOrderId || undefined,
        amount,
        paymentDate,
        paymentMode,
        transactionReference,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paymentType === 'CUSTOMER_RECEIPT' ? 'Record Customer Payment Collection' : 'Record Supplier Payout'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              paymentType === 'CUSTOMER_RECEIPT'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setPaymentType('CUSTOMER_RECEIPT')}
          >
            Customer Inward Collection (+)
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              paymentType === 'SUPPLIER_PAYMENT'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setPaymentType('SUPPLIER_PAYMENT')}
          >
            Supplier Outward Payout (-)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentType === 'CUSTOMER_RECEIPT' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Select Customer *</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName || c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Link Order (Optional)</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                >
                  <option value="">-- General Account Receipt --</option>
                  {orders
                    .filter((o) => !customerId || o.customerId === customerId)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.orderNumber} - ₹{(o.totalAmount || 0).toLocaleString('en-IN')} [{o.status}]
                      </option>
                    ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Select Supplier *</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.companyName || s.supplierCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Link Purchase Order (Optional)</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={purchaseOrderId}
                  onChange={(e) => setPurchaseOrderId(e.target.value)}
                >
                  <option value="">-- General Advance / Vendor Bill --</option>
                  {pos
                    .filter((p) => !supplierId || p.supplierId === supplierId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.poNumber} - ₹{Math.round(p.totalAmount).toLocaleString('en-IN')} [{p.status}]
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <Input
            label="Payment Amount (₹) *"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />

          <Input
            label="Payment Date *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method *</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CHEQUE">Cheque / Demand Draft</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_NOTE">Credit Note / Adjust</option>
            </select>
          </div>

          <Input
            label="UTR / Cheque / Reference #"
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            placeholder="e.g. UTR-998822 / Chq #443211"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Payment Remarks</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Transaction narration, bank account details..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={paymentType === 'CUSTOMER_RECEIPT' ? 'primary' : 'primary'}
            type="submit"
            isLoading={loading}
          >
            Post to Financial Ledger
          </Button>
        </div>
      </form>
    </Modal>
  );
};
