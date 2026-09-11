import React, { useState, useEffect } from 'react';
import { Order, CreateDispatchInput } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { OrderService } from '../../services/orders/orderService';
import { Truck, Package, ShieldCheck } from 'lucide-react';

interface CreateDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDispatchInput) => Promise<void>;
}

export const CreateDispatchModal: React.FC<CreateDispatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState<CreateDispatchInput>({
    orderId: '',
    customerId: '',
    carrierName: 'SafeXpress Logistics',
    trackingNumber: '',
    vehicleNumber: '',
    totalPackages: 1,
    totalItemsCount: 100,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    try {
      const allOrders = await OrderService.getOrders();
      // Allow dispatching confirmed, in production or ready orders
      const dispatchable = allOrders.filter(
        (o) => o.status === 'READY_FOR_DISPATCH' || o.status === 'CONFIRMED' || o.status === 'IN_PRODUCTION'
      );
      setOrders(dispatchable.length > 0 ? dispatchable : allOrders);
      if (dispatchable.length > 0) {
        setFormData((prev) => ({
          ...prev,
          orderId: dispatchable[0].id,
          customerId: dispatchable[0].customerId,
          totalItemsCount: dispatchable[0].totalQuantity || 100,
        }));
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const handleOrderChange = (orderId: string) => {
    const selected = orders.find((o) => o.id === orderId);
    if (!selected) return;
    setFormData((prev) => ({
      ...prev,
      orderId: selected.id,
      customerId: selected.customerId,
      totalItemsCount: selected.totalQuantity || 100,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderId) {
      setError('Please select an order to dispatch');
      return;
    }
    if (formData.totalPackages <= 0 || formData.totalItemsCount <= 0) {
      setError('Package count and item quantity must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create dispatch manifest');
    } finally {
      setLoading(false);
    }
  };

  const currentOrder = orders.find((o) => o.id === formData.orderId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Goods Dispatch Manifest" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Select Order to Dispatch *</label>
          <select
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.orderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            required
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.orderNumber} - {o.customerName || 'Customer'} ({o.totalQuantity} pcs) [{o.status}]
              </option>
            ))}
          </select>
        </div>

        {currentOrder && (
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Buyer / Consignee:</span>
              <p className="font-semibold text-white mt-0.5">{currentOrder.customerName}</p>
            </div>
            <div>
              <span className="text-slate-400">Order Size:</span>
              <p className="font-semibold text-emerald-400 mt-0.5">{currentOrder.totalQuantity} pieces</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Logistics Transporter / Courier *"
            value={formData.carrierName || ''}
            onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
            placeholder="e.g. SafeXpress / V-Trans / Delhivery"
            required
          />

          <Input
            label="LR / Docket / Tracking Number"
            value={formData.trackingNumber || ''}
            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value.toUpperCase() })}
            placeholder="e.g. SFX-99882211"
          />

          <Input
            label="Vehicle Registration Number"
            value={formData.vehicleNumber || ''}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
            placeholder="e.g. GJ-05-XX-1234"
          />

          <Input
            label="Total Master Cartons / Boxes *"
            type="number"
            min="1"
            value={formData.totalPackages}
            onChange={(e) => setFormData({ ...formData, totalPackages: Number(e.target.value) })}
            required
          />

          <Input
            label="Total Pieces Dispatched *"
            type="number"
            min="1"
            value={formData.totalItemsCount}
            onChange={(e) => setFormData({ ...formData, totalItemsCount: Number(e.target.value) })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Dispatch Notes / Gate Pass Remarks</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Delivery instructions, seal numbers, driver contact..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Generate Dispatch Gate Pass
          </Button>
        </div>
      </form>
    </Modal>
  );
};
