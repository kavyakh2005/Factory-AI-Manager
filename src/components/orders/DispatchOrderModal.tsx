import React, { useState } from 'react';
import { Order } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DispatchService } from '../../services/dispatch/dispatchService';
import { Truck, Package, Hash, AlertCircle } from 'lucide-react';

interface DispatchOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatchSuccess: () => void;
}

const COMMON_CARRIERS = [
  'DTDC Express',
  'Blue Dart Express',
  'Delhivery Logistics',
  'TCI Freight',
  'VRL Logistics',
  'Trackon Courier',
  'Professional Couriers',
  'Direct Factory Pickup / Handover',
  'Local Tempo / Transport',
];

export const DispatchOrderModal: React.FC<DispatchOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onDispatchSuccess,
}) => {
  if (!order) return null;

  const [carrierName, setCarrierName] = useState('DTDC Express');
  const [customCarrier, setCustomCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [totalPackages, setTotalPackages] = useState(
    Math.max(1, Math.ceil((order.totalQuantity || 50) / 30))
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCarrier = carrierName === 'OTHER' ? customCarrier : carrierName;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCarrier.trim()) {
      setErrorMsg('Please specify the Transport / Courier carrier.');
      return;
    }

    setIsSubmitting(true);
    try {
      await DispatchService.createDispatch({
        orderId: order.id,
        customerId: order.customerId,
        carrierName: selectedCarrier,
        trackingNumber: trackingNumber.trim() || `TRK-${Date.now().toString().slice(-6)}`,
        vehicleNumber: vehicleNumber.trim() || undefined,
        totalPackages: Number(totalPackages) || 1,
        totalItemsCount: order.totalQuantity,
        notes: notes.trim() || `Dispatched order ${order.orderNumber}`,
      });

      onDispatchSuccess();
      onClose();
    } catch (err: any) {
      console.error('Dispatch failed:', err);
      setErrorMsg(err?.message || 'Failed to dispatch order. Please verify stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispatch Order: ${order.orderNumber}`}
      subtitle={`Customer: ${order.customer?.name || 'Customer'} • Volume: ${order.totalQuantity} pcs`}
      maxWidth="lg"
    >
      <form onSubmit={handleDispatch} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Order Brief Box */}
        <div className="p-3.5 rounded-xl bg-factory-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Pcs</span>
            <span className="text-slate-100 font-black text-sm">{order.totalQuantity} pcs</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Order Value</span>
            <span className="text-emerald-400 font-bold text-sm">₹{order.grandTotal.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment</span>
            <span className="font-bold text-slate-200">{order.paymentStatus || 'UNPAID'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
            <span className="text-primary-400 font-semibold">{order.status}</span>
          </div>
        </div>

        {/* Carrier Selection */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary-400" />
              <span>Courier / Transport Carrier *</span>
            </label>
            <select
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            >
              {COMMON_CARRIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="OTHER">Other / Custom Transport...</option>
            </select>
          </div>

          {carrierName === 'OTHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Transporter Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Maruti Freight Agency"
                value={customCarrier}
                onChange={(e) => setCustomCarrier(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>LR / Tracking / AWB #</span>
              </label>
              <input
                type="text"
                placeholder="e.g. DTDC-98765432"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Cartons / Parcels Count *</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalPackages}
                onChange={(e) => setTotalPackages(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle / Tempo No. (Optional)</label>
            <input
              type="text"
              placeholder="e.g. RJ-14-GA-1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dispatch Remarks / Gate Pass Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Handed over to driver Ramesh with 3 cartons sealed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-[11px] text-primary-300">
          💡 <strong>Automatic Fulfillment:</strong> Completing this dispatch will mark the order as <strong>COMPLETED</strong>, release/consume the size-wise stock reservation, deduct ready warehouse stock, and create an immutable dispatch movement ledger entry.
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            isLoading={isSubmitting}
            icon={<Truck className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            Confirm & Dispatch Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
