import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '../services/products/productService';
import { Set as GarmentSet, Size } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SetModal } from '../components/products/SetModal';
import { SizeModal } from '../components/products/SizeModal';
import { useAuthStore } from '../store/authStore';
import {
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Tag,
  Hash,
  Ruler,
  Boxes,
  Sparkles,
  ArrowUpDown,
  Trash2,
} from 'lucide-react';

export const SetsAndSizesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuthStore();
  const canManage = hasRole('OWNER', 'ADMIN', 'MANAGER');

  const [activeTab, setActiveTab] = useState<'sets' | 'sizes'>('sets');

  // Modals state
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<GarmentSet | null>(null);

  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);

  // Queries
  const { data: sets = [], isLoading: setsLoading } = useQuery<GarmentSet[]>({
    queryKey: ['sets-with-sizes'],
    queryFn: () => ProductService.getSetsWithSizes(),
  });

  const { data: sizes = [], isLoading: sizesLoading } = useQuery<Size[]>({
    queryKey: ['sizes-list'],
    queryFn: () => ProductService.getSizes(),
  });

  const handleToggleSetStatus = async (set: GarmentSet) => {
    const nextStatus = set.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await ProductService.updateSet(set.id, { status: nextStatus });
    queryClient.invalidateQueries({ queryKey: ['sets-with-sizes'] });
  };

  const handleToggleSizeStatus = async (size: Size) => {
    const nextStatus = size.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await ProductService.updateSize(size.id, { status: nextStatus });
    queryClient.invalidateQueries({ queryKey: ['sizes-list'] });
  };

  const handleDeleteSet = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete set "${name}"?`)) {
      try {
        await ProductService.deleteSet(id);
        queryClient.invalidateQueries({ queryKey: ['sets-with-sizes'] });
      } catch (err: any) {
        alert(err?.message || 'Failed to delete set');
      }
    }
  };

  const handleDeleteSize = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete size "${name}"?`)) {
      try {
        await ProductService.deleteSize(id);
        queryClient.invalidateQueries({ queryKey: ['sizes-list'] });
      } catch (err: any) {
        alert(err?.message || 'Failed to delete size');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary-400" />
              Sets & Sizes Master Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
              {sets.length} Sets • {sizes.length} Sizes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure standard manufacturing size runs, ratio groupings (Sets), and technical garment measurements.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5">
            {activeTab === 'sets' ? (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingSet(null);
                  setIsSetModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                Create Garment Set
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingSize(null);
                  setIsSizeModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                Add Master Size
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('sets')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'sets'
              ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Sets Master ({sets.length})
        </button>

        <button
          onClick={() => setActiveTab('sizes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'sizes'
              ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Ruler className="w-4 h-4" />
          Sizes Master ({sizes.length})
        </button>
      </div>

      {/* SETS MASTER TAB */}
      {activeTab === 'sets' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-factory-900/60 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Garment Set Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Assigned Sizes Run</th>
                  <th className="py-3.5 px-4 text-center">Total Sizes</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {setsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      Loading Sets...
                    </td>
                  </tr>
                ) : sets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No Sets configured yet. Click "Create Garment Set" above.
                    </td>
                  </tr>
                ) : (
                  sets.map((set) => (
                    <tr key={set.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        <div>{set.name}</div>
                        {set.description && (
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                            {set.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                        {set.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="primary" size="sm">
                          {set.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {set.setSizes && set.setSizes.length > 0 ? (
                            set.setSizes.map((ss) => (
                              <span
                                key={ss.id}
                                className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold"
                              >
                                {ss.size?.name || ss.sizeId}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-xs italic">No sizes mapped</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                        {set.setSizes?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => canManage && handleToggleSetStatus(set)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            set.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Click to toggle status"
                        >
                          {set.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-500" />
                          )}
                          {set.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSet(set);
                                setIsSetModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSet(set.id, set.name)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete Set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIZES MASTER TAB */}
      {activeTab === 'sizes' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-factory-900/60 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Size Label</th>
                  <th className="py-3.5 px-4">Size Code</th>
                  <th className="py-3.5 px-4">Chest Measure</th>
                  <th className="py-3.5 px-4">Waist Measure</th>
                  <th className="py-3.5 px-4">Length Measure</th>
                  <th className="py-3.5 px-4 text-center">Sort Order</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {sizesLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                      Loading Sizes...
                    </td>
                  </tr>
                ) : sizes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                      No sizes configured. Click "Add Master Size" above.
                    </td>
                  </tr>
                ) : (
                  sizes.map((sz) => (
                    <tr key={sz.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-100 text-sm">
                        {sz.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-400">
                        {sz.code || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {sz.chestMeasure ? `${sz.chestMeasure}"` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {sz.waistMeasure ? `${sz.waistMeasure}"` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {sz.lengthMeasure ? `${sz.lengthMeasure}"` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {sz.sortOrder || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => canManage && handleToggleSizeStatus(sz)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            sz.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Click to toggle status"
                        >
                          {sz.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-500" />
                          )}
                          {sz.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSize(sz);
                                setIsSizeModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSize(sz.id, sz.name)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete Size"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Set Modal */}
      <SetModal
        isOpen={isSetModalOpen}
        onClose={() => setIsSetModalOpen(false)}
        set={editingSet}
        availableSizes={sizes}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sets-with-sizes'] });
        }}
      />

      {/* Size Modal */}
      <SizeModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        size={editingSize}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sizes-list'] });
        }}
      />
    </div>
  );
};
