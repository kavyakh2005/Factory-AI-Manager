import React from 'react';
import { Order } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CheckCircle2, Printer, Calendar, User, Phone, MapPin, Layers } from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (orderId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmOrder,
}) => {
  if (!order) return null;

  // Group items by Product + Set + Colorway to render a clean Size Matrix Table
  const groupedItemsMap: Record<
    string,
    {
      productName: string;
      productCode: string;
      color: string;
      setName: string;
      unitRate: number;
      taxRate: number;
      sizes: Array<{ sizeName: string; quantity: number }>;
      totalQuantity: number;
      lineTotal: number;
    }
  > = {};

  (order.orderItems || []).forEach((item) => {
    const key = `${item.productId}_${item.setId}_${item.variantId || 'base'}`;
    if (!groupedItemsMap[key]) {
      groupedItemsMap[key] = {
        productName: item.product?.name || 'Garment Product',
        productCode: item.product?.code || 'PRD',
        color: item.variant?.color || item.variantId || 'Standard',
        setName: item.set?.name || 'Standard Set',
        unitRate: item.unitRate,
        taxRate: item.taxRate || 5,
        sizes: [],
        totalQuantity: 0,
        lineTotal: 0,
      };
    }
    groupedItemsMap[key].sizes.push({
      sizeName: item.size?.name || '-',
      quantity: item.quantity,
    });
    groupedItemsMap[key].totalQuantity += item.quantity;
    groupedItemsMap[key].lineTotal += item.lineTotal;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'primary';
      case 'IN_PRODUCTION':
        return 'warning';
      case 'READY_FOR_DISPATCH':
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'danger';
      case 'NORMAL':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderNumber}`}
      subtitle={`Created on ${new Date(order.orderDate).toLocaleDateString()}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Header Summary & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-factory-950/80 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-100">{order.orderNumber}</span>
              <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
              <Badge variant={getPriorityVariant(order.priority)} size="sm">{order.priority} PRIORITY</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Order: {new Date(order.orderDate).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Delivery Due: {new Date(order.deliveryDate).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Order Volume</div>
            <div className="text-2xl font-black text-slate-100">{order.totalQuantity.toLocaleString()} pcs</div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-2 text-xs">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">Customer Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <User className="w-4 h-4 text-primary-400 shrink-0" />
              <span>{order.customer?.name} {order.customer?.companyName ? `(${order.customer.companyName})` : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{order.customer?.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{order.customer?.city || 'India'}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Size Matrix Breakdown Tables */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary-400" />
            <span>Product & Size Matrix Breakdown</span>
          </h4>

          {Object.values(groupedItemsMap).map((group, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <div className="font-bold text-slate-100 text-sm">
                    {group.productName} <span className="text-slate-500 font-normal">({group.productCode})</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Set: <span className="text-primary-300 font-semibold">{group.setName}</span> • Color: <span className="text-slate-200">{group.color}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-200">{group.totalQuantity} pcs</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    ₹{group.lineTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Size Matrix Grid Display */}
              <div className="flex flex-wrap gap-2 pt-1">
                {group.sizes.map((s, sIdx) => (
                  <div key={sIdx} className="px-3 py-1.5 rounded-lg bg-factory-900 border border-slate-700/80 text-center min-w-[70px]">
                    <div className="text-[10px] text-slate-400 font-semibold">Size {s.sizeName}</div>
                    <div className="text-xs font-black text-slate-100 mt-0.5">{s.quantity} pcs</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-3 rounded-lg bg-factory-950/60 border border-slate-800 text-xs text-slate-300">
            <strong className="text-slate-400">Special Notes: </strong> {order.notes}
          </div>
        )}

        {/* Financial Summary */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400">Subtotal: </span>
              <strong className="text-slate-200 font-bold">₹{order.subtotal.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-slate-400">GST (5%): </span>
              <strong className="text-slate-200 font-bold">₹{order.taxAmount.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-slate-400">Paid: </span>
              <strong className="text-slate-200 font-bold">₹{order.paidAmount.toLocaleString()}</strong>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold">Grand Total: </span>
            <span className="text-xl font-black text-emerald-400 ml-2">₹{order.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Order Challan
          </Button>

          <div className="flex items-center gap-3">
            {order.status === 'DRAFT' && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  onConfirmOrder(order.id);
                  onClose();
                }}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Order & Move to Planning
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
