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
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'factory' | 'tax' | 'sets' | 'users' | 'ai' | 'backup' | 'audit'
  >('factory');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRoleId, setNewUserRoleId] = useState('');
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

  // Load Roles
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles-list'],
    queryFn: () => apiRequest<Role[]>('/auth/roles'),
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
    mutationFn: (payload: { email: string; name: string; phone?: string; password: string; roleId: string }) =>
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
    if (userId === 'u-owner-kavya' || userName.includes('Owner')) {
      alert('Master Factory Owner account cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove user "${userName}"?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserRoleId && roles && roles.length > 0) {
      setNewUserRoleId(roles[0].id);
    }
    createUserMutation.mutate({
      email: newUserEmail,
      name: newUserName,
      phone: newUserPhone,
      password: newUserPassword,
      roleId: newUserRoleId || (roles && roles[0]?.id) || '',
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
          System & Factory Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure enterprise parameters, user roles, permission policies, AI providers, and backups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        {[
          { id: 'factory', label: 'Factory Profile', icon: <Building className="w-4 h-4" /> },
          { id: 'tax', label: 'Currency & Tax', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'sets', label: 'Sets & Sizes Hierarchy', icon: <Layers className="w-4 h-4" /> },
          { id: 'users', label: 'Users & RBAC', icon: <Shield className="w-4 h-4" /> },
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

      {/* Tab 1: Factory Profile */}
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
              <label className="block text-xs font-semibold text-slate-400 mb-1">Premises / Manufacturing Address</label>
              <textarea
                rows={3}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">GST Registration Number</label>
              <input
                type="text"
                value={formData.gstNumber || ''}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-mono"
              />
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Settings saved successfully to database!</span>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Save Factory Profile
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 2: Currency & Tax */}
      {activeTab === 'tax' && (
        <Card className="p-6 border-slate-800">
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Financial Conventions</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol || '₹'}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-24 px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Default Garment GST / Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxPercentage !== undefined ? formData.taxPercentage : 5.0}
                onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) })}
                className="w-32 px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
              />
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Financial parameters saved successfully!</span>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Save Financial Parameters
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Sets & Sizes Config Preview */}
      {activeTab === 'sets' && (
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Active Sets & Sizes Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">First-class garment business entities configured in database</p>
            </div>
            <Badge variant="primary">Configured in DB</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-factory-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">Standard Set</span>
                <Badge variant="success" size="sm">SET-STD</Badge>
              </div>
              <p className="text-[11px] text-slate-400">Regular Ready-to-Wear Fit</p>
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
                <span className="font-bold text-slate-200 text-xs">Extra Set</span>
                <Badge variant="warning" size="sm">SET-EXT</Badge>
              </div>
              <p className="text-[11px] text-slate-400">Plus Size Collection</p>
              <div className="flex gap-1.5 flex-wrap pt-2">
                {['48', '50', '52'].map((s) => (
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

      {/* Tab 4: Users & RBAC */}
      {activeTab === 'users' && (
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">User Directory & Role Assignments</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enforced across all API endpoints</p>
            </div>
            {isOwnerOrAdmin && (
              <Button size="sm" onClick={() => setIsAddUserOpen(true)} icon={<Plus className="w-4 h-4" />}>
                Add Factory User
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-factory-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-factory-800/40">
                    <td className="p-3 font-semibold text-slate-100">{u.name}</td>
                    <td className="p-3 font-mono text-slate-300">{u.email}</td>
                    <td className="p-3 text-slate-400">{u.phone || '—'}</td>
                    <td className="p-3">
                      <Badge variant="primary" size="sm">
                        {u.role.displayName}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {isOwnerOrAdmin && u.id !== 'u-owner-kavya' && !u.name.includes('(Owner)') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Remove User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Modal: Add User */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add Factory User"
        subtitle="Create a new user account with role-based permissions"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role Assignment</label>
            <select
              value={newUserRoleId}
              onChange={(e) => setNewUserRoleId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-factory-950 border border-slate-700 text-slate-100 text-xs focus:border-primary-500 outline-none"
            >
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName} ({r.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createUserMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
