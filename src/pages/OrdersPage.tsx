import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../services/orders/orderService';
import { Order, OrderStatus } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CreateOrderModal } from '../components/orders/CreateOrderModal';
import { OrderDetailsModal } from '../components/orders/OrderDetailsModal';
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
  Sparkles,
  Trash2,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Load Orders
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    isFetching,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['orders', statusFilter, searchQuery],
    queryFn: () => OrderService.getOrders({ status: statusFilter, search: searchQuery }),
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

  // Confirm Order Mutation
  const confirmOrderMutation = useMutation({
    mutationFn: (orderId: string) => OrderService.updateOrderStatus(orderId, 'CONFIRMED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
    if (window.confirm(`Are you sure you want to delete order "${orderNumber}"? This will also remove any attached dispatch records and release reserved stock.`)) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  // Overall calculations
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH'].includes(o.status)).length;
  const totalPcsBooked = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
  const totalValuation = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

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
        return <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black">URGENT</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">HIGH</span>;
      case 'LOW':
        return <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">LOW</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            Garment Orders & Size Matrix
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/30">
              Supabase Connected
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture and track wholesale orders with multi-product, multi-set, and dynamic size matrices.
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
          <div className="mt-2 text-2xl font-black text-slate-100">{totalOrdersCount} <span className="text-xs font-normal text-slate-400">orders</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Wholesale accounts</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100">{pendingOrdersCount} <span className="text-xs font-normal text-slate-400">active</span></div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">Awaiting floor execution</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Volume</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100">{totalPcsBooked.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Size matrix aggregated</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Value</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">₹{totalValuation.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Inclusive of GST</div>
        </Card>
      </div>

      {/* Filter & Search Controls */}
      <Card className="p-4 border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order #, Customer, City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'CONFIRMED', label: 'Confirmed' },
              { id: 'DRAFT', label: 'Draft' },
              { id: 'IN_PRODUCTION', label: 'In Production' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
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
                {searchQuery || statusFilter !== 'ALL'
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
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => {
                  const isOverdue = new Date(order.deliveryDate) < new Date() && order.status !== 'COMPLETED';

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
                          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`} />
                          <span className={`font-semibold ${isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isOverdue && (
                          <div className="text-[10px] text-rose-400 font-bold mt-0.5">Delayed</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">{getStatusBadge(order.status)}</td>

                      {/* Grand Total */}
                      <td className="p-3.5 text-right font-black text-slate-100">
                        ₹{order.grandTotal.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td
                        className="p-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-slate-400 hover:text-slate-100" />
                          </Button>

                          {order.status === 'DRAFT' && (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => confirmOrderMutation.mutate(order.id)}
                              className="px-2 py-1 text-[11px]"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Confirm
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            isLoading={deleteOrderMutation.isPending && deleteOrderMutation.variables === order.id}
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
        onOrderCreated={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onConfirmOrder={(id) => confirmOrderMutation.mutate(id)}
      />
    </div>
  );
};
