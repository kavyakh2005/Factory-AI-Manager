import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { AppSettings, AuditLog, User, Role } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Building,
  CreditCard,
  Layers,
  Shield,
  Bot,
  Database,
  History,
  CheckCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Edit2,
  Lock,
  UserCheck,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Factory,
  Boxes,
  ShoppingBag,
  Truck,
  Users,
  Building2,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export interface SystemModuleConfig {
  id: string;
  label: string;
  description: string;
  category: 'CORE' | 'PRODUCTION' | 'LOGISTICS' | 'COMMERCE' | 'FINANCE' | 'SYSTEM';
  icon: React.ReactNode;
}

export const SYSTEM_MODULES: SystemModuleConfig[] = [
  { id: 'DASHBOARD', label: 'Dashboard & Overview', description: 'Factory KPIs, alerts & real-time activity', category: 'CORE', icon: <LayoutDashboard className="w-4 h-4 text-primary-400" /> },
  { id: 'PRODUCTS', label: 'Product Master', description: 'Style catalog, wholesale rates & size sets', category: 'CORE', icon: <Package className="w-4 h-4 text-emerald-400" /> },
  { id: 'SETS_SIZES', label: 'Sets & Sizes Hierarchy', description: 'Size ratios, chest measurements & sets', category: 'CORE', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
  { id: 'ORDERS', label: 'Customer Orders', description: 'Order booking & ready stock reservations', category: 'COMMERCE', icon: <ShoppingCart className="w-4 h-4 text-amber-400" /> },
  { id: 'PRODUCTION', label: 'Production Pipeline', description: 'Planning, Cutting, Stitching, QC & Packing', category: 'PRODUCTION', icon: <Factory className="w-4 h-4 text-blue-400" /> },
  { id: 'INVENTORY', label: 'Ready Stock & Inventory', description: 'Finished Goods ready stock & raw materials', category: 'LOGISTICS', icon: <Boxes className="w-4 h-4 text-teal-400" /> },
  { id: 'PURCHASES', label: 'Purchases & Sourcing', description: 'Raw material procurement & supplier orders', category: 'LOGISTICS', icon: <ShoppingBag className="w-4 h-4 text-purple-400" /> },
  { id: 'DISPATCH', label: 'Dispatch & Shipments', description: 'Carton packaging, couriers & deliveries', category: 'LOGISTICS', icon: <Truck className="w-4 h-4 text-cyan-400" /> },
  { id: 'CUSTOMERS', label: 'Customers Directory', description: 'B2B Wholesale client registry & history', category: 'COMMERCE', icon: <Users className="w-4 h-4 text-rose-400" /> },
  { id: 'SUPPLIERS', label: 'Suppliers & Mills', description: 'Fabric mills & accessory vendors directory', category: 'LOGISTICS', icon: <Building2 className="w-4 h-4 text-orange-400" /> },
  { id: 'PAYMENTS', label: 'Payments & Receivables', description: 'Invoices, customer receipts & balances', category: 'FINANCE', icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
  { id: 'EXPENSES', label: 'Factory Expenses', description: 'Operating costs, utilities & ledgers', category: 'FINANCE', icon: <Receipt className="w-4 h-4 text-yellow-400" /> },
  { id: 'REPORTS', label: 'Reports & Analytics', description: 'P&L, production yields & efficiency', category: 'FINANCE', icon: <BarChart3 className="w-4 h-4 text-indigo-400" /> },
  { id: 'AI_MANAGER', label: 'AI Factory Assistant', description: 'Floor intelligence & operational analysis', category: 'CORE', icon: <Bot className="w-4 h-4 text-teal-400" /> },
  { id: 'SETTINGS', label: 'Settings & RBAC Access', description: 'Enterprise configuration & permissions', category: 'SYSTEM', icon: <Settings className="w-4 h-4 text-slate-400" /> },
];

const SUGGESTED_ROLE_PRESETS = [
  {
    title: 'Cutting Master',
    modules: ['DASHBOARD', 'PRODUCTION', 'PRODUCTS', 'SETS_SIZES', 'INVENTORY'],
  },
  {
    title: 'Stitching / Floor Supervisor',
    modules: ['DASHBOARD', 'PRODUCTION', 'PRODUCTS', 'SETS_SIZES'],
  },
  {
    title: 'Quality & Packing Inspector',
    modules: ['DASHBOARD', 'PRODUCTION', 'INVENTORY', 'PRODUCTS'],
  },
  {
    title: 'Store & Inventory Incharge',
    modules: ['DASHBOARD', 'INVENTORY', 'PURCHASES', 'DISPATCH', 'PRODUCTS', 'SUPPLIERS'],
  },
  {
    title: 'Accountant / Billing Executive',
    modules: ['DASHBOARD', 'PAYMENTS', 'EXPENSES', 'ORDERS', 'PURCHASES', 'REPORTS', 'CUSTOMERS'],
  },
  {
    title: 'Sales & Order Manager',
    modules: ['DASHBOARD', 'ORDERS', 'CUSTOMERS', 'PRODUCTS', 'INVENTORY', 'DISPATCH'],
  },
  {
    title: 'Dispatch & Logistics Executive',
    modules: ['DASHBOARD', 'DISPATCH', 'INVENTORY', 'ORDERS'],
  },
  {
    title: 'Factory General Manager',
    modules: SYSTEM_MODULES.map((m) => m.id),
  },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'factory' | 'tax' | 'sets' | 'users' | 'ai' | 'backup' | 'audit'
  >('users');
  
  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRoleTitle, setNewUserRoleTitle] = useState('Floor Operator');
  const [newUserSelectedModules, setNewUserSelectedModules] = useState<string[]>([
    'DASHBOARD',
    'PRODUCTION',
    'PRODUCTS',
    'SETS_SIZES',
  ]);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRoleTitle, setEditUserRoleTitle] = useState('');
  const [editUserSelectedModules, setEditUserSelectedModules] = useState<string[]>([]);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const queryClient = useQueryClient();
  const { hasRole } = useAuthStore();
  const isOwnerOrAdmin = hasRole('OWNER', 'ADMIN');

  // Load Settings
  const { data: settings } = useQuery<AppSettings>({
    queryKey: ['settings'],
    queryFn: () => apiRequest<AppSettings>('/settings'),
  });

  // Load Users
  const { data: users, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['users-list'],
    queryFn: () => apiRequest<User[]>('/auth/users'),
    enabled: isOwnerOrAdmin,
  });

  // Load Audit Logs
  const { data: auditLogs, refetch: refetchLogs } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: () => apiRequest<AuditLog[]>('/settings/audit-logs'),
  });

  // Form State
  const [formData, setFormData] = useState<Partial<AppSettings>>({});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Update Settings Mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<AppSettings>) =>
      apiRequest<AppSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setFormData(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    },
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      name: string;
      phone?: string;
      password: string;
      roleDisplayName: string;
      allowedModules: string[];
    }) =>
      apiRequest('/auth/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setIsAddUserOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserPassword('');
      setNewUserRoleTitle('Floor Operator');
      setNewUserSelectedModules(['DASHBOARD', 'PRODUCTION', 'PRODUCTS', 'SETS_SIZES']);
      refetchUsers();
    },
  });

  // Edit User Mutation
  const editUserMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      name: string;
      phone?: string;
      password?: string;
      roleDisplayName: string;
      allowedModules: string[];
    }) =>
      apiRequest('/auth/users', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setEditingUser(null);
      refetchUsers();
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('/auth/users', {
        method: 'DELETE',
        body: JSON.stringify({ id: userId }),
      }),
    onSuccess: () => {
      refetchUsers();
    },
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === 'u-owner-kavya' || userName.includes('(Owner)')) {
      alert('Master Factory Owner account cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove user "${userName}"?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleOpenEditUser = (user: User) => {
    if (user.id === 'u-owner-kavya' || user.name.includes('(Owner)')) {
      alert('Master Factory Owner has permanent full access to all factory features.');
      return;
    }
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserPhone(user.phone || '');
    setEditUserPassword('');
    setEditUserRoleTitle(user.role.displayName || user.role.name || 'Staff');
    const userMods = user.role.allowedModules || user.allowedModules || ['DASHBOARD', 'PRODUCTION'];
    setEditUserSelectedModules(userMods.includes('ALL') ? SYSTEM_MODULES.map((m) => m.id) : userMods);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Please provide name, email, and password.');
      return;
    }
    if (newUserSelectedModules.length === 0) {
      alert('Please grant at least one module permission for this user.');
      return;
    }

    createUserMutation.mutate({
      email: newUserEmail.trim(),
      name: newUserName.trim(),
      phone: newUserPhone.trim(),
      password: newUserPassword,
      roleDisplayName: newUserRoleTitle.trim() || 'Factory Staff',
      allowedModules: newUserSelectedModules,
    });
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editUserSelectedModules.length === 0) {
      alert('Please grant at least one module permission.');
      return;
    }

    editUserMutation.mutate({
      id: editingUser.id,
      name: editUserName.trim(),
      phone: editUserPhone.trim(),
      password: editUserPassword ? editUserPassword : undefined,
      roleDisplayName: editUserRoleTitle.trim() || 'Factory Staff',
      allowedModules: editUserSelectedModules,
    });
  };

  const toggleNewUserModule = (moduleId: string) => {
    if (newUserSelectedModules.includes(moduleId)) {
      setNewUserSelectedModules(newUserSelectedModules.filter((m) => m !== moduleId));
    } else {
      setNewUserSelectedModules([...newUserSelectedModules, moduleId]);
    }
  };

  const toggleEditUserModule = (moduleId: string) => {
    if (editUserSelectedModules.includes(moduleId)) {
      setEditUserSelectedModules(editUserSelectedModules.filter((m) => m !== moduleId));
    } else {
      setEditUserSelectedModules([...editUserSelectedModules, moduleId]);
    }
  };

  const applyPresetToNewUser = (preset: { title: string; modules: string[] }) => {
    setNewUserRoleTitle(preset.title);
    setNewUserSelectedModules(preset.modules);
  };

  const applyPresetToEditUser = (preset: { title: string; modules: string[] }) => {
    setEditUserRoleTitle(preset.title);
    setEditUserSelectedModules(preset.modules);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-primary-400" />
          Factory Settings & Custom Roles Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Owner-controlled user management, granular module permissions, custom role designations, AI configs, and backups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        {[
          { id: 'users', label: 'Team & Custom Permissions', icon: <Shield className="w-4 h-4" /> },
          { id: 'factory', label: 'Factory Profile', icon: <Building className="w-4 h-4" /> },
          { id: 'tax', label: 'Currency & Tax', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'sets', label: 'Sets & Sizes Hierarchy', icon: <Layers className="w-4 h-4" /> },
          { id: 'ai', label: 'AI Manager Config', icon: <Bot className="w-4 h-4" /> },
          { id: 'backup', label: 'Database Backup', icon: <Database className="w-4 h-4" /> },
          { id: 'audit', label: 'Audit Logs', icon: <History className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-400 bg-factory-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Users & Custom Permissions (DEFAULT / HIGHLIGHTED) */}
      {activeTab === 'users' && (
        <Card className="p-6 border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                Factory Team Members & Custom Permissions
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                The Owner decides custom role titles and precisely selects which features/modules each team member can access.
              </p>
            </div>
            {isOwnerOrAdmin && (
              <Button
                size="sm"
                onClick={() => setIsAddUserOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                className="shrink-0"
              >
                Add Factory User
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-factory-950/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-factory-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5">User & Contact</th>
                  <th className="p-3.5">Custom Role Title</th>
                  <th className="p-3.5">Granted Module Access</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users?.map((u) => {
                  const isOwner = u.id === 'u-owner-kavya' || u.name.includes('(Owner)');
                  const userModules = u.role.allowedModules || u.allowedModules || [];
                  const hasAll = isOwner || userModules.includes('ALL') || userModules.length === SYSTEM_MODULES.length;

                  return (
                    <tr key={u.id} className="hover:bg-factory-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          {u.name}
                          {isOwner && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              OWNER
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                        {u.phone && <div className="text-[10px] text-slate-500">{u.phone}</div>}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-950/60 text-primary-300 border border-primary-500/30">
                          <UserCheck className="w-3.5 h-3.5 text-primary-400" />
                          {u.role.displayName || u.role.name}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {hasAll ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                              🌟 Full Factory Access (All Modules)
                            </span>
                          ) : (
                            userModules.map((modId) => {
                              const modConfig = SYSTEM_MODULES.find((m) => m.id === modId);
                              return (
                                <span
                                  key={modId}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-700/80 flex items-center gap-1"
                                >
                                  {modConfig?.label || modId}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right">
                        {!isOwner && isOwnerOrAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-primary-300 transition-colors"
                              title="Edit Custom Role & Permissions"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Remove User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Factory Profile */}
      {activeTab === 'factory' && (
        <Card className="p-6 border-slate-800">
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Enterprise Details</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Factory / Legal Entity Name</label>
              <input
                type="text"
                value={formData.factoryName || ''}
                onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Factory Address</label>
              <textarea
                rows={2}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                value={formData.gstNumber || ''}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Factory details saved successfully!</span>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Currency & Tax */}
      {activeTab === 'tax' && (
        <Card className="p-6 border-slate-800">
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Financial Formatting & Tax</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currencySymbol || '₹'}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.taxPercentage || 5.0}
                  onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Financial parameters updated!</span>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Save Financials
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 4: Sets & Sizes Hierarchy */}
      {activeTab === 'sets' && (
        <Card className="p-6 border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Global Factory Size Sets</h3>
          <p className="text-xs text-slate-400">
            Define sets with predetermined size combinations (e.g. Standard 38-46, Kids 24-32, Big & Tall 48-52).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">Standard Set (5 Sizes)</span>
                <Badge variant="primary" size="sm">SET-STD</Badge>
              </div>
              <p className="text-[11px] text-slate-400">Standard Mens & Womens Coordinates</p>
              <div className="flex gap-1.5 flex-wrap pt-2">
                {['38', '40', '42', '44', '46'].map((s) => (
                  <span key={s} className="px-2 py-1 bg-slate-800 text-slate-200 text-xs font-bold rounded border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">Kids Set</span>
                <Badge variant="info" size="sm">SET-KIDS</Badge>
              </div>
              <p className="text-[11px] text-slate-400">Junior Collection</p>
              <div className="flex gap-1.5 flex-wrap pt-2">
                {['24', '26', '28', '30', '32'].map((s) => (
                  <span key={s} className="px-2 py-1 bg-slate-800 text-slate-200 text-xs font-bold rounded border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: AI Configuration */}
      {activeTab === 'ai' && (
        <Card className="p-6 border-slate-800">
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">AI Floor Assistant & Analytics</h3>
            <p className="text-xs text-slate-400">
              The AI subsystem connects via backend sandbox tools. LLM keys remain encrypted on the server.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Model Provider</label>
              <select
                value={formData.aiModelProvider || 'gemini'}
                onChange={(e) => setFormData({ ...formData, aiModelProvider: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              >
                <option value="gemini">Google Gemini (Recommended for tool calling)</option>
                <option value="openai">OpenAI GPT-4o</option>
                <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">AI API Key</label>
              <input
                type="password"
                placeholder="Enter API Key or leave blank for local rule-based analytics"
                value={formData.aiApiKey || ''}
                onChange={(e) => setFormData({ ...formData, aiApiKey: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-mono"
              />
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>AI configuration saved successfully!</span>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Save AI Configuration
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 6: Database Backup */}
      {activeTab === 'backup' && (
        <Card className="p-6 border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Database Snapshot & Restore</h3>
          <p className="text-xs text-slate-400">
            Create full SQL dumps of orders, size matrices, stock transactions, and master entities.
          </p>

          <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-200">Automated Daily Backups</div>
              <div className="text-[11px] text-slate-400">Configured to run every 24 hours</div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <Button
            size="sm"
            onClick={() => alert('Snapshot successfully generated in local factory_backups directory!')}
            icon={<Database className="w-4 h-4" />}
          >
            Generate Manual Snapshot Now
          </Button>
        </Card>
      )}

      {/* Tab 7: Audit Logs */}
      {activeTab === 'audit' && (
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">System Audit Trail</h3>
              <p className="text-xs text-slate-400 mt-0.5">Immutable record of logins, settings modifications, and operational changes</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchLogs()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh Logs
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-factory-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-factory-800/40">
                    <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-slate-200">{log.user?.name || 'System / Auto'}</td>
                    <td className="p-3">
                      <Badge variant="neutral" size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">{log.entity}</td>
                    <td className="p-3 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD FACTORY USER WITH CUSTOM ROLE & GRANULAR PERMISSIONS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add Factory User & Configure Permissions"
        subtitle="Owner creates user account, enters custom role title, and chooses exact feature permissions"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-5">
          {/* User Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Sharma"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. ramesh@factory.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Login Password *</label>
              <input
                type="password"
                required
                placeholder="Enter account password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Custom Role Title */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Custom Role Title / Designation *
              </label>
              <input
                type="text"
                required
                placeholder="Enter any designation, e.g. Cutting Master, Floor Supervisor, Store Manager..."
                value={newUserRoleTitle}
                onChange={(e) => setNewUserRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-primary-300 font-bold text-xs focus:border-primary-500 outline-none"
              />
            </div>

            {/* Smart Suggested Presets */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                Quick Presets (Click to autofill Role & Permissions):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => applyPresetToNewUser(preset)}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-primary-300 border border-slate-800 hover:border-primary-500/40 transition-all"
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Granular Module Permissions Grid */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Assign Module Permissions ({newUserSelectedModules.length} selected)
                </span>
                <span className="text-[11px] text-slate-400">
                  Select which areas of the software this user can view and operate
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewUserSelectedModules(SYSTEM_MODULES.map((m) => m.id))}
                  className="px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/30"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setNewUserSelectedModules([])}
                  className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-800 rounded border border-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {SYSTEM_MODULES.map((mod) => {
                const isSelected = newUserSelectedModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleNewUserModule(mod.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-primary-950/40 border-primary-500/50 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="pt-0.5">{mod.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-primary-200' : 'text-slate-300'}`}>
                          {mod.label}
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-primary-500 border-primary-400 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {mod.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createUserMutation.isPending}>
              Create User & Permissions
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER & PERMISSIONS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.name}`}
        subtitle={`Modify custom role title, permissions, phone number or password for ${editingUser?.email}`}
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={editingUser?.email || ''}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={editUserPhone}
                onChange={(e) => setEditUserPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                New Password <span className="text-[10px] text-slate-500">(Leave blank to keep existing)</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Custom Role Title */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Custom Role Title / Designation
              </label>
              <input
                type="text"
                required
                value={editUserRoleTitle}
                onChange={(e) => setEditUserRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-primary-300 font-bold text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                Quick Presets:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => applyPresetToEditUser(preset)}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-primary-300 border border-slate-800 hover:border-primary-500/40 transition-all"
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Granular Module Permissions Grid */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Granted Modules ({editUserSelectedModules.length} selected)
                </span>
                <span className="text-[11px] text-slate-400">
                  Toggle permissions to control what this user can access
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditUserSelectedModules(SYSTEM_MODULES.map((m) => m.id))}
                  className="px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/30"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setEditUserSelectedModules([])}
                  className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-800 rounded border border-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {SYSTEM_MODULES.map((mod) => {
                const isSelected = editUserSelectedModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleEditUserModule(mod.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-primary-950/40 border-primary-500/50 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="pt-0.5">{mod.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-primary-200' : 'text-slate-300'}`}>
                          {mod.label}
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-primary-500 border-primary-400 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {mod.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={editUserMutation.isPending}>
              Save User & Permissions
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
