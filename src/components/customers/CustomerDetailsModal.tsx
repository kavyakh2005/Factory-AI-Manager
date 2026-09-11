import React, { useState, useEffect } from 'react';
import { Customer, Order } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { OrderService } from '../../services/orders/orderService';
import { Building2, Phone, Mail, MapPin, IndianRupee, ShoppingBag, Clock, ShieldCheck } from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      loadOrders();
    }
  }, [customer, isOpen]);

  const loadOrders = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      const allOrders = await OrderService.getOrders();
      const customerOrders = allOrders.filter(
        (o) => o.customerId === customer.id || o.customerName === customer.name
      );
      setOrders(customerOrders);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const totalOrderValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPieces = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile & Order History" maxWidth="4xl">
      <div className="space-y-6">
        {/* Header Profile Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30">
                  {customer.customerCode}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    customer.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{customer.name}</h2>
              {customer.companyName && (
                <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {customer.companyName}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(customer);
                }}
              >
                Edit Customer
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-700/60 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Phone</p>
              <p className="text-white font-medium flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> {customer.phone}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Email</p>
              <p className="text-white font-medium flex items-center gap-1 mt-0.5 truncate">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> {customer.email || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Location</p>
              <p className="text-white font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />{' '}
                {customer.city ? `${customer.city}, ${customer.state || ''}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">GSTIN</p>
              <p className="text-white font-medium font-mono text-xs mt-1">
                {customer.gstNumber || 'Unregistered'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Total Orders Placed</p>
            <p className="text-2xl font-bold text-white mt-1">{orders.length}</p>
            <p className="text-xs text-slate-500 mt-1">{totalPieces.toLocaleString('en-IN')} pcs manufactured</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Lifetime Business Value</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ₹{totalOrderValue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Gross order pipeline</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Credit Limit & Terms</p>
            <p className="text-2xl font-bold text-indigo-300 mt-1">
              ₹{(customer.creditLimit || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 mt-1">{customer.paymentTermsDays || 30} Days Net Terms</p>
          </div>
        </div>

        {/* Orders Table */}
        <div>
          <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            Associated Orders ({orders.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading order records...</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-xl border border-slate-800">
              No orders have been recorded for this customer yet.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Delivery</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-medium text-white">{o.orderNumber}</td>
                      <td className="p-3 text-slate-400">{o.orderDate}</td>
                      <td className="p-3 text-slate-400">{o.deliveryDate}</td>
                      <td className="p-3 text-right font-medium text-white">{o.totalQuantity} pcs</td>
                      <td className="p-3 text-right font-medium text-emerald-400">
                        ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            o.status === 'CONFIRMED'
                              ? 'bg-blue-500/20 text-blue-300'
                              : o.status === 'IN_PRODUCTION'
                              ? 'bg-amber-500/20 text-amber-300'
                              : o.status === 'READY_FOR_DISPATCH'
                              ? 'bg-purple-500/20 text-purple-300'
                              : o.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
