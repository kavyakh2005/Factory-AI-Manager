import React, { useState } from 'react';
import { PurchaseOrder } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Truck, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReceivePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onReceive: (
    poId: string,
    receivedList: Array<{ itemId?: string; itemName: string; receivedQty: number; unit: string }>
  ) => Promise<void>;
}

export const ReceivePurchaseModal: React.FC<ReceivePurchaseModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onReceive,
}) => {
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (purchaseOrder?.items) {
      const initialMap: Record<string, number> = {};
      purchaseOrder.items.forEach((item) => {
        const itemKey = item.id || item.itemName;
        const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
        initialMap[itemKey] = remaining;
      });
      setReceivedQtyMap(initialMap);
    }
  }, [purchaseOrder, isOpen]);

  if (!purchaseOrder) return null;

  const handleQtyChange = (itemKey: string, val: number) => {
    setReceivedQtyMap((prev) => ({ ...prev, [itemKey]: val }));
  };

  const handleReceiveAll = () => {
    if (!purchaseOrder?.items) return;
    const fullMap: Record<string, number> = {};
    purchaseOrder.items.forEach((item) => {
      const itemKey = item.id || item.itemName;
      const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
      fullMap[itemKey] = remaining;
    });
    setReceivedQtyMap(fullMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrder.items) return;

    const listToReceive = purchaseOrder.items
      .map((item) => {
        const itemKey = item.id || item.itemName;
        return {
          itemId: item.itemId,
          itemName: item.itemName,
          receivedQty: Number(receivedQtyMap[itemKey] || 0),
          unit: item.unit,
        };
      })
      .filter((item) => item.receivedQty > 0);

    if (listToReceive.length === 0) {
      setError('Please enter receiving quantity greater than 0 for at least one item');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onReceive(purchaseOrder.id, listToReceive);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process inventory receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Consignment - ${purchaseOrder.poNumber}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400">Supplier:</span>{' '}
            <span className="font-bold text-white">{purchaseOrder.supplier?.name || 'Vendor'}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            className="text-xs py-1"
            onClick={handleReceiveAll}
          >
            Auto-fill Remaining
          </Button>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 uppercase font-medium text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-3">Material / Item</th>
                <th className="p-3 text-right">Ordered</th>
                <th className="p-3 text-right">Prev. Received</th>
                <th className="p-3 text-right w-32">Receiving Now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {purchaseOrder.items?.map((item, idx) => {
                const itemKey = item.id || item.itemName || `item-${idx}`;
                const prevRec = item.receivedQuantity || 0;
                const remaining = Math.max(0, item.quantity - prevRec);
                return (
                  <tr key={itemKey} className="hover:bg-slate-800/20">
                    <td className="p-3">
                      <p className="font-semibold text-white">{item.itemName}</p>
                      <span className="text-[11px] text-slate-400">{item.unit}</span>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-300">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3 text-right font-medium text-slate-400">
                      {prevRec} {item.unit}
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max={remaining * 2}
                        step="0.01"
                        className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs text-right font-bold focus:border-indigo-500"
                        value={receivedQtyMap[itemKey] ?? remaining}
                        onChange={(e) => handleQtyChange(itemKey, Number(e.target.value))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
          <span>
            Receiving items will automatically create positive stock transactions in the Inventory Ledger and update current warehouse balances.
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Confirm Goods Receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
};
