import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../services/orders/orderService';
import { Order, OrderStatus } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CreateOrderModal } from '../components/orders/CreateOrderModal';
import { OrderDetailsModal } from '../components/orders/OrderDetailsModal';
import { DispatchOrderModal } from '../components/orders/DispatchOrderModal';
import { RecordPaymentModal } from '../components/orders/RecordPaymentModal';
import { OrderPrintInvoiceModal } from '../components/orders/OrderPrintInvoiceModal';
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  IndianRupee,
  Layers,
  Trash2,
  Truck,
  CreditCard,
  Printer,
  TrendingUp,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const queryClient = useQueryClient();

  // Load Orders
  const {
    data: rawOrders = [],
    isLoading: isLoadingOrders,
    isFetching,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['orders', statusFilter, searchQuery],
    queryFn: () => OrderService.getOrders({ status: statusFilter, search: searchQuery }),
  });

  // Filter orders by payment if selected
  const orders = rawOrders.filter((o) => {
    if (paymentFilter === 'ALL') return true;
    return o.paymentStatus === paymentFilter;
  });

  // Load Customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => OrderService.getCustomers(),
  });

  // Load Products
  const { data: products = [] } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => OrderService.getProducts(),
  });

  // Load Sets with Sizes
  const { data: sets = [] } = useQuery({
    queryKey: ['sets-sizes-list'],
    queryFn: () => OrderService.getSetsWithSizes(),
  });

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      OrderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ready-stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-reservations'] });
    },
    onError: (err: any) => {
      alert(`Status update failed: ${err?.message || 'Error updating status'}`);
    },
  });

  // Delete Order Mutation
  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => OrderService.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ready-stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-reservations'] });
    },
    onError: (err: any) => {
      alert(`Error deleting order: ${err?.message || 'Could not delete order'}`);
    },
  });

  const handleDeleteOrder = (orderId: string, orderNumber: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete order "${orderNumber}"? This will also remove any attached dispatch records and release reserved stock.`
      )
    ) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  // Overall calculations
  const totalOrdersCount = rawOrders.length;
  const pendingOrdersCount = rawOrders.filter((o) =>
    ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH'].includes(o.status)
  ).length;
  const readyToShipCount = rawOrders.filter((o) => o.status === 'READY_FOR_DISPATCH').length;
  const totalPcsBooked = rawOrders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
  const totalValuation = rawOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalPaid = rawOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
  const totalReceivable = Math.max(0, totalValuation - totalPaid);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="primary">Confirmed</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">Draft</Badge>;
      case 'IN_PRODUCTION':
        return <Badge variant="warning">In Production</Badge>;
      case 'READY_FOR_DISPATCH':
        return <Badge variant="info">Ready to Ship</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black">
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
            HIGH
          </span>
        );
      case 'LOW':
        return <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">LOW</span>;
      default:
        return (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
            NORMAL
          </span>
        );
    }
  };

  const getPaymentBadge = (status?: string, paid?: number, total?: number) => {
    const isPaid = status === 'PAID' || (paid && total && paid >= total);
    const isPartial = status === 'PARTIAL' || (paid && paid > 0);

    if (isPaid) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
          PAID ✓
        </span>
      );
    }
    if (isPartial) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
          PARTIAL (₹{(paid || 0).toLocaleString()})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
        UNPAID
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            Garment Orders & Wholesale Matrix
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/30">
              Supabase Connected
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture wholesale orders on Ready Stock, manage size-wise allocations, dispatch shipments, and track payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrders()}
            isLoading={isFetching}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="bg-primary-600 hover:bg-primary-500 text-white font-bold"
          >
            Create Garment Order
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Booked</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100">
            {totalOrdersCount} <span className="text-xs font-normal text-slate-400">orders</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{totalPcsBooked.toLocaleString()} pcs total</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Floor Pipeline</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100">
            {pendingOrdersCount} <span className="text-xs font-normal text-slate-400">active</span>
          </div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">
            {readyToShipCount} orders ready for dispatch
          </div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Valuation</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">₹{totalValuation.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Received: ₹{totalPaid.toLocaleString()}</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receivable Balance</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400">₹{totalReceivable.toLocaleString()}</div>
          <div className="text-[11px] text-rose-400/80 font-medium mt-1">Pending collection</div>
        </Card>
      </div>

      {/* Filter & Search Controls */}
      <Card className="p-4 border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order #, Customer, City, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-factory-950 border border-slate-700 text-slate-300 text-xs focus:border-primary-500 outline-none font-medium"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Fully Paid</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="UNPAID">Unpaid Only</option>
            </select>

            {/* Status Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'All Orders' },
                { id: 'CONFIRMED', label: 'Confirmed' },
                { id: 'IN_PRODUCTION', label: 'In Production' },
                { id: 'READY_FOR_DISPATCH', label: 'Ready to Ship' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'DRAFT', label: 'Drafts' },
                { id: 'CANCELLED', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-factory-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="border-slate-800 overflow-hidden">
        {isLoadingOrders ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading orders from Supabase PostgreSQL...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-factory-950 text-slate-500 flex items-center justify-center mx-auto border border-slate-800">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">No Orders Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'ALL' || paymentFilter !== 'ALL'
                  ? 'No orders match your filter criteria.'
                  : 'Start by clicking "Create Garment Order" above.'}
              </p>
            </div>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Create First Order
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-factory-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Products / Sets</th>
                  <th className="p-3.5 text-center">Volume (Pcs)</th>
                  <th className="p-3.5">Target Delivery</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => {
                  const isOverdue =
                    new Date(order.deliveryDate) < new Date() &&
                    order.status !== 'COMPLETED' &&
                    order.status !== 'CANCELLED';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-factory-900/60 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      {/* Order # and Priority */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 group-hover:text-primary-300 transition-colors">
                            {order.orderNumber}
                          </span>
                          {getPriorityBadge(order.priority)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">
                          {order.customer?.name || 'Retail Client'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.customer?.companyName || order.customer?.city || '—'}
                        </div>
                      </td>

                      {/* Products Summary */}
                      <td className="p-3.5">
                        <div className="text-slate-200 font-medium">
                          {order.orderItems && order.orderItems.length > 0
                            ? order.orderItems[0].product?.name
                            : 'Garment Set'}
                          {order.orderItems && order.orderItems.length > 1 && (
                            <span className="text-[10px] text-primary-400 ml-1.5 font-bold">
                              +{order.orderItems.length - 1} more
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {order.orderItems?.[0]?.set?.name || 'Standard Set'}
                        </div>
                      </td>

                      {/* Total Pcs */}
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-factory-950 font-black text-slate-100 text-xs border border-slate-800">
                          {order.totalQuantity.toLocaleString()} pcs
                        </span>
                      </td>

                      {/* Delivery Date */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar
                            className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}
                          />
                          <span className={`font-semibold ${isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isOverdue && (
                          <div className="text-[10px] text-rose-400 font-bold mt-0.5">Delayed</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {getStatusBadge(order.status)}
                          {order.fulfillmentStatus === 'SHORTAGE' && (
                            <div className="text-[9px] text-rose-400 font-bold">Shortage</div>
                          )}
                        </div>
                      </td>

                      {/* Payment Badge */}
                      <td className="p-3.5">
                        {getPaymentBadge(order.paymentStatus, order.paidAmount, order.grandTotal)}
                      </td>

                      {/* Grand Total */}
                      <td className="p-3.5 text-right font-black text-slate-100">
                        ₹{order.grandTotal.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5"
                            title="View / Process Order"
                          >
                            <Eye className="w-4 h-4 text-slate-400 hover:text-slate-100" />
                          </Button>

                          {/* Quick Dispatch Action */}
                          {['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH'].includes(order.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDispatchingOrder(order)}
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              title="Dispatch / Ship Order"
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Quick Payment Action */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPayingOrder(order)}
                            className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>

                          {/* Quick Print Invoice Action */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrintingOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            title="Print Tax Invoice / Challan"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>

                          {/* Quick Confirm if Draft */}
                          {order.status === 'DRAFT' && (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({ orderId: order.id, status: 'CONFIRMED' })
                              }
                              className="px-2 py-1 text-[11px]"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Confirm
                            </Button>
                          )}

                          {/* Delete Order */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            isLoading={
                              deleteOrderMutation.isPending && deleteOrderMutation.variables === order.id
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        customers={customers}
        products={products}
        sets={sets}
        onOrderCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['ready-stock-items'] });
        }}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onConfirmOrder={(id) => updateStatusMutation.mutate({ orderId: id, status: 'CONFIRMED' })}
        onUpdateStatus={(id, status) => updateStatusMutation.mutate({ orderId: id, status })}
        onOpenDispatch={(ord) => setDispatchingOrder(ord)}
        onOpenPayment={(ord) => setPayingOrder(ord)}
        onOpenPrint={(ord) => setPrintingOrder(ord)}
      />

      <DispatchOrderModal
        order={dispatchingOrder}
        isOpen={!!dispatchingOrder}
        onClose={() => setDispatchingOrder(null)}
        onDispatchSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['dispatches'] });
          queryClient.invalidateQueries({ queryKey: ['ready-stock-items'] });
        }}
      />

      <RecordPaymentModal
        order={payingOrder}
        isOpen={!!payingOrder}
        onClose={() => setPayingOrder(null)}
        onPaymentSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }}
      />

      <OrderPrintInvoiceModal
        order={printingOrder}
        isOpen={!!printingOrder}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
};
