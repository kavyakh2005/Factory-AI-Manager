import React from 'react';
import { Order } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, Download, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface OrderPrintInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderPrintInvoiceModal: React.FC<OrderPrintInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;

  // Group items by Product + Set
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
      taxableAmount: number;
      gstAmount: number;
      lineTotal: number;
    }
  > = {};

  (order.orderItems || []).forEach((item) => {
    const key = `${item.productId}_${item.setId}_${item.variantId || 'base'}`;
    if (!groupedItemsMap[key]) {
      const uRate = item.unitRate || 850;
      groupedItemsMap[key] = {
        productName: item.product?.name || 'Garment Product',
        productCode: item.product?.code || 'PRD',
        color: item.variant?.color || item.variantId || 'Standard',
        setName: item.set?.name || 'Standard Set',
        unitRate: uRate,
        taxRate: item.taxRate || 5,
        sizes: [],
        totalQuantity: 0,
        taxableAmount: 0,
        gstAmount: 0,
        lineTotal: 0,
      };
    }
    const qty = item.quantity || 0;
    groupedItemsMap[key].sizes.push({
      sizeName: item.size?.name || '-',
      quantity: qty,
    });
    groupedItemsMap[key].totalQuantity += qty;
    const itemTaxable = qty * groupedItemsMap[key].unitRate;
    const itemGst = (itemTaxable * groupedItemsMap[key].taxRate) / 100;
    groupedItemsMap[key].taxableAmount += itemTaxable;
    groupedItemsMap[key].gstAmount += itemGst;
    groupedItemsMap[key].lineTotal += itemTaxable + itemGst;
  });

  const handlePrint = () => {
    window.print();
  };

  const grandTotal = Number(order.grandTotal || 0);
  const paidAmount = Number(order.paidAmount || 0);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tax Invoice & Delivery Challan"
      subtitle={`Printable document for Order ${order.orderNumber}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Printable Paper Canvas */}
        <div id="printable-order-invoice" className="p-6 bg-white text-slate-900 rounded-lg shadow-sm font-sans text-xs space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-4">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900 uppercase">
                Shree Raas Krishnam Creation
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                Wholesale Garments Manufacturer & Exporter
              </div>
              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                <div>Plot No. 42-45, Industrial Apparel Park, Jaipur, Rajasthan - 302022</div>
                <div>GSTIN: <strong>08AAAAA0000A1Z5</strong> | PAN: <strong>AAAAA0000A</strong></div>
                <div>Contact: +91 98290 12345 | info@shreeraaskrishnam.com</div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs tracking-wider uppercase rounded mb-2">
                TAX INVOICE / CHALLAN
              </div>
              <div className="text-[11px] text-slate-700 font-bold">
                Invoice No: <span className="font-mono text-slate-900">{order.orderNumber}</span>
              </div>
              <div className="text-[10px] text-slate-600">
                Date: {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-[10px] text-slate-600">
                Delivery Target: {new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
            <div>
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
                Billed To (Buyer):
              </div>
              <div className="font-bold text-slate-800 text-xs">{order.customer?.name}</div>
              {order.customer?.companyName && (
                <div className="font-medium text-slate-700">{order.customer.companyName}</div>
              )}
              <div className="text-slate-600 mt-0.5">Phone: {order.customer?.phone}</div>
              <div className="text-slate-600">City / State: {order.customer?.city || 'India'}</div>
              {order.customer?.email && <div className="text-slate-600">Email: {order.customer.email}</div>}
            </div>

            <div>
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
                Order & Shipping Specs:
              </div>
              <div className="text-slate-700">Priority: <strong className="uppercase">{order.priority}</strong></div>
              <div className="text-slate-700">Payment Status: <strong className="uppercase">{order.paymentStatus || 'UNPAID'}</strong></div>
              <div className="text-slate-700">Total Volume: <strong>{order.totalQuantity} Pieces</strong></div>
              {order.notes && (
                <div className="text-slate-600 mt-1 italic">
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Product & Size Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <th className="p-2 border-r border-slate-200">#</th>
                  <th className="p-2 border-r border-slate-200">Garment Description</th>
                  <th className="p-2 border-r border-slate-200">HSN</th>
                  <th className="p-2 border-r border-slate-200 text-center">Size-Wise Breakdown</th>
                  <th className="p-2 border-r border-slate-200 text-center">Qty (Pcs)</th>
                  <th className="p-2 border-r border-slate-200 text-right">Rate (₹)</th>
                  <th className="p-2 border-r border-slate-200 text-right">Taxable (₹)</th>
                  <th className="p-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {Object.values(groupedItemsMap).map((group, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{group.productName}</div>
                      <div className="text-[10px] text-slate-500">
                        Set: {group.setName} | Color: {group.color}
                      </div>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">6204</td>
                    <td className="p-2 border-r border-slate-200">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {group.sizes.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]"
                          >
                            <strong>{s.sizeName}</strong>: {s.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-900">
                      {group.totalQuantity}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      ₹{group.unitRate.toLocaleString()}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      ₹{group.taxableAmount.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-bold font-mono text-slate-900">
                      ₹{group.lineTotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations & Bank Info Footer */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="text-[10px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-bold uppercase text-slate-800 text-[10px] mb-1">Bank Account & Terms:</div>
              <div>Bank: <strong>HDFC Bank Ltd, Industrial Branch</strong></div>
              <div>A/C No: <strong>50200012345678</strong> | IFSC: <strong>HDFC0001234</strong></div>
              <div className="pt-1 text-[9px] text-slate-500">
                • Goods once sold will only be returned within 7 days under factory QC agreement.<br />
                • Interest @ 18% p.a. will be charged on delayed payments beyond due date.
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Taxable Value):</span>
                <strong className="text-slate-800 font-mono">₹{order.subtotal.toLocaleString()}</strong>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <strong className="font-mono">-₹{order.discountAmount.toLocaleString()}</strong>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (5% SGST + CGST / IGST):</span>
                <strong className="text-slate-800 font-mono">₹{order.taxAmount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="font-mono">₹{grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700 font-mono">₹{paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600 pt-0.5 border-t border-slate-200">
                <span>Balance Due:</span>
                <span className="font-mono">₹{balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signature Sign-off */}
          <div className="pt-8 flex justify-between items-end text-[10px] text-slate-600">
            <div>
              <div>Receiver / Transporter Sign</div>
              <div className="mt-8 border-t border-slate-300 w-40"></div>
            </div>

            <div className="text-right">
              <div className="font-bold text-slate-800 uppercase">For Shree Raas Krishnam Creation</div>
              <div className="mt-8 border-t border-slate-300 w-48 text-center text-[9px] text-slate-500">
                Authorized Signatory & Seal
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
            >
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
