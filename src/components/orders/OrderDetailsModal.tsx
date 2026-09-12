import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  CheckCircle2,
  Printer,
  Calendar,
  User,
  Phone,
  MapPin,
  Layers,
  Truck,
  CreditCard,
  AlertTriangle,
  PlayCircle,
  PackageCheck,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  onOpenDispatch?: (order: Order) => void;
  onOpenPayment?: (order: Order) => void;
  onOpenPrint?: (order: Order) => void;
}

const LIFECYCLE_STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'IN_PRODUCTION', label: 'In Production' },
  { key: 'READY_FOR_DISPATCH', label: 'Ready to Ship' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmOrder,
  onUpdateStatus,
  onOpenDispatch,
  onOpenPayment,
  onOpenPrint,
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
      sizes: Array<{
        sizeName: string;
        quantity: number;
        availableStock?: number;
        reservedStock?: number;
        shortageQuantity?: number;
      }>;
      totalQuantity: number;
      lineTotal: number;
      hasShortage: boolean;
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
        hasShortage: false,
      };
    }
    const shortage = item.shortageQuantity || 0;
    if (shortage > 0) groupedItemsMap[key].hasShortage = true;

    groupedItemsMap[key].sizes.push({
      sizeName: item.size?.name || '-',
      quantity: item.quantity,
      availableStock: item.availableStock,
      reservedStock: item.reservedStock,
      shortageQuantity: shortage,
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
        return 'info';
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

  const currentStepIdx = LIFECYCLE_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const grandTotal = Number(order.grandTotal || 0);
  const paidAmount = Number(order.paidAmount || 0);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderNumber}`}
      subtitle={`Created on ${new Date(order.orderDate).toLocaleDateString()}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Visual Lifecycle Stepper */}
        {!isCancelled ? (
          <div className="p-4 rounded-xl bg-factory-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary-400" />
                <span>Order Execution Lifecycle</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Current Status: <span className="text-primary-300 font-bold">{order.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 relative">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center group">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-primary-500 text-white ring-4 ring-primary-500/20 font-black'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-semibold ${
                        isCurrent
                          ? 'text-primary-300 font-bold'
                          : isPassed
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>This order is marked <strong>CANCELLED</strong>. Stock reservations have been released.</span>
          </div>
        )}

        {/* Header Summary & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-factory-950/80 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-100">{order.orderNumber}</span>
              <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
              <Badge variant={getPriorityVariant(order.priority)} size="sm">
                {order.priority} PRIORITY
              </Badge>
              {order.fulfillmentStatus === 'SHORTAGE' && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                  SHORTAGE DETECTED
                </span>
              )}
              {order.fulfillmentStatus === 'PARTIALLY_AVAILABLE' && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  PARTIALLY RESERVED
                </span>
              )}
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
              <span>
                {order.customer?.name} {order.customer?.companyName ? `(${order.customer.companyName})` : ''}
              </span>
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
                    Set: <span className="text-primary-300 font-semibold">{group.setName}</span> • Color:{' '}
                    <span className="text-slate-200">{group.color}</span>
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
                  <div
                    key={sIdx}
                    className={`px-3 py-2 rounded-lg border text-center min-w-[85px] ${
                      s.shortageQuantity && s.shortageQuantity > 0
                        ? 'bg-rose-950/30 border-rose-800/60'
                        : 'bg-factory-900 border-slate-700/80'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-semibold">Size {s.sizeName}</div>
                    <div className="text-xs font-black text-slate-100 mt-0.5">{s.quantity} pcs</div>
                    {s.shortageQuantity && s.shortageQuantity > 0 ? (
                      <div className="text-[9px] text-rose-400 font-bold mt-1">
                        Short: {s.shortageQuantity} pcs
                      </div>
                    ) : (
                      <div className="text-[9px] text-emerald-400 font-semibold mt-1">
                        Reserved ✓
                      </div>
                    )}
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

        {/* Financial & Payment Tracker */}
        <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-primary-400" />
              <span>Commercials & Payment Tracker</span>
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPayment?.(order)}
              className="py-1 px-2.5 text-xs text-primary-300 border-primary-500/30 hover:bg-primary-500/10"
              icon={<CreditCard className="w-3.5 h-3.5" />}
            >
              Record Payment
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subtotal</span>
              <strong className="text-slate-200 font-bold text-sm">₹{order.subtotal.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">GST (5%)</span>
              <strong className="text-slate-200 font-bold text-sm">₹{order.taxAmount.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Grand Total</span>
              <strong className="text-slate-100 font-black text-sm">₹{grandTotal.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount Paid</span>
              <strong className="text-emerald-400 font-black text-sm">₹{paidAmount.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-amber-400 block text-[10px] uppercase font-bold">Balance Due</span>
              <strong
                className={`font-black text-sm ${
                  balanceDue === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {balanceDue === 0 ? '₹0 (Paid ✓)' : `₹${balanceDue.toLocaleString()}`}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Controls & Stage Progression */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPrint?.(order)}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Tax Invoice / Challan
            </Button>

            {!isCancelled && order.status !== 'COMPLETED' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Cancel order ${order.orderNumber}? This will release reserved stock.`)) {
                    onUpdateStatus?.(order.id, 'CANCELLED');
                    onClose();
                  }
                }}
                className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs"
              >
                Cancel Order
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Contextual Action Buttons */}
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
                Confirm Order
              </Button>
            )}

            {order.status === 'CONFIRMED' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdateStatus?.(order.id, 'IN_PRODUCTION');
                    onClose();
                  }}
                  icon={<PlayCircle className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Move to In-Production
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onOpenDispatch?.(order);
                    onClose();
                  }}
                  icon={<Truck className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  🚀 Dispatch & Ship Order
                </Button>
              </>
            )}

            {order.status === 'IN_PRODUCTION' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdateStatus?.(order.id, 'READY_FOR_DISPATCH');
                    onClose();
                  }}
                  icon={<PackageCheck className="w-3.5 h-3.5 text-primary-400" />}
                >
                  Mark Ready to Ship
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onOpenDispatch?.(order);
                    onClose();
                  }}
                  icon={<Truck className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  🚀 Dispatch & Ship Order
                </Button>
              </>
            )}

            {order.status === 'READY_FOR_DISPATCH' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onOpenDispatch?.(order);
                  onClose();
                }}
                icon={<Truck className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                🚀 Dispatch & Ship Order
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
