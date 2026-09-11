import React, { useState, useEffect } from 'react';
import { Customer, Product, Set, OrderItemDraft, OrderPriority, OrderStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SizeMatrixInput } from './SizeMatrixInput';
import { Plus, AlertCircle, ShoppingCart, UserPlus, Calendar } from 'lucide-react';
import { OrderService } from '../../services/orders/orderService';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  sets: Set[];
  onOrderCreated: () => void;
}

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const suffix = `${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
  return `ORD-${year}-${suffix}`;
};

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  products,
  sets,
  onOrderCreated,
}) => {
  // Order Header Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const deliveryDueStr = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

  const [orderNumber, setOrderNumber] = useState(generateOrderNumber());
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(todayStr);
  const [deliveryDate, setDeliveryDate] = useState(deliveryDueStr);
  const [priority, setPriority] = useState<OrderPriority>('NORMAL');
  const [status, setStatus] = useState<OrderStatus>('CONFIRMED');
  const [notes, setNotes] = useState('');

  // Items State (supports multiple product/set line items)
  const [items, setItems] = useState<OrderItemDraft[]>([
    {
      productId: products[0]?.id || '',
      variantId: products[0]?.variants?.[0]?.color || products[0]?.variants?.[0]?.id || 'Navy Blue',
      setId: sets[0]?.id || '',
      unitRate: products[0]?.sellingPrice || 850,
      taxRate: 5,
      discount: 0,
      sizeQuantities: {},
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setOrderNumber(generateOrderNumber());
      setErrorMessage(null);
    }
  }, [isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Customer Modal State
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('');

  // Calculations
  let grandTotalPcs = 0;
  let subtotalAmount = 0;

  items.forEach((item) => {
    const rowPcs = Object.values(item.sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);
    grandTotalPcs += rowPcs;
    subtotalAmount += rowPcs * (item.unitRate || 0);
  });

  const taxAmount = (subtotalAmount * 5) / 100;
  const grandTotal = subtotalAmount + taxAmount;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: products[0]?.id || '',
        variantId: products[0]?.variants?.[0]?.color || products[0]?.variants?.[0]?.id || 'Navy Blue',
        setId: sets[0]?.id || '',
        unitRate: products[0]?.sellingPrice || 850,
        taxRate: 5,
        discount: 0,
        sizeQuantities: {},
      },
    ]);
  };

  const handleItemChange = (index: number, updated: OrderItemDraft) => {
    const newItems = [...items];
    newItems[index] = updated;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerId) {
      setErrorMessage('Please select a Customer for this order.');
      return;
    }
    if (!orderNumber.trim()) {
      setErrorMessage('Order Number is required.');
      return;
    }
    if (new Date(deliveryDate) < new Date(orderDate)) {
      setErrorMessage('Delivery Date cannot be earlier than the Order Date.');
      return;
    }
    if (grandTotalPcs === 0) {
      setErrorMessage('Please enter at least one size quantity in the Size Matrix.');
      return;
    }

    setIsSubmitting(true);
    try {
      await OrderService.createOrder({
        orderNumber,
        customerId,
        orderDate: new Date(orderDate).toISOString(),
        deliveryDate: new Date(deliveryDate).toISOString(),
        priority,
        status,
        notes,
        items,
      });

      onOrderCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create order. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    try {
      const created = await OrderService.createCustomerQuick({
        name: newCustName,
        companyName: newCustCompany,
        phone: newCustPhone,
        city: newCustCity,
      });
      setCustomerId(created.id);
      setIsQuickCustomerOpen(false);
      setNewCustName('');
      setNewCustCompany('');
      setNewCustPhone('');
      setNewCustCity('');
    } catch (err) {
      console.error('Quick customer creation failed:', err);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create New Garment Order"
        subtitle="Dynamic Size Matrix breakdown across Products and Sets"
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Header Details */}
          <div className="p-4 rounded-xl bg-factory-950/70 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Order Master Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Customer Selector */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Customer / Wholesale Buyer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickCustomerOpen(true)}
                    className="text-[10px] text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Quick Add</span>
                  </button>
                </div>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-medium"
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.city || c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Number */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Order Number *
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-mono font-bold"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as OrderPriority)}
                  className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-semibold"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High (Festive)</option>
                  <option value="URGENT">Urgent (Express)</option>
                </select>
              </div>
            </div>

            {/* Dates & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Order Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Delivery Target Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Initial Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-factory-900 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-semibold"
                >
                  <option value="CONFIRMED">Confirmed (Queue for Planning)</option>
                  <option value="DRAFT">Draft (Pending Review)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items & Dynamic Size Matrices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Garment Products & Size Matrix Items ({items.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Configure size-wise piece quantities for every product and set
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Another Product / Set
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <SizeMatrixInput
                  key={idx}
                  itemIndex={idx}
                  item={item}
                  products={products}
                  sets={sets}
                  onChange={(updated) => handleItemChange(idx, updated)}
                  onRemove={() => handleRemoveItem(idx)}
                  canRemove={items.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Special Cutting / Packing / Transport Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Master polybag per set required, label barcode placement on top flap..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          {/* Bottom Financial Summary Bar & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-factory-950 border border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left w-full sm:w-auto">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Garment Pcs</div>
                <div className="text-xl font-black text-slate-100">{grandTotalPcs.toLocaleString()} pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal</div>
                <div className="text-sm font-bold text-slate-200">₹{subtotalAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">GST (5%)</div>
                <div className="text-sm font-bold text-slate-300">₹{taxAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Grand Total</div>
                <div className="text-lg font-black text-emerald-400">
                  ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="md"
                isLoading={isSubmitting}
                icon={<ShoppingCart className="w-4 h-4" />}
              >
                Create & Save Order
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Quick Add Customer Sub-Modal */}
      <Modal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        title="Quick Add Customer"
        subtitle="Create a new wholesale buyer"
        maxWidth="md"
      >
        <form onSubmit={handleQuickCustomerSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Contact Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Store Name</label>
            <input
              type="text"
              placeholder="e.g. Raj Garment Traders"
              value={newCustCompany}
              onChange={(e) => setNewCustCompany(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="+91 98200 XXXXX"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">City / Region</label>
            <input
              type="text"
              placeholder="e.g. Ahmedabad"
              value={newCustCity}
              onChange={(e) => setNewCustCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsQuickCustomerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add Customer
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
