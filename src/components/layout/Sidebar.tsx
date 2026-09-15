import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Boxes,
  Truck,
  Package,
  Layers,
  Users,
  Building2,
  CreditCard,
  Receipt,
  BarChart3,
  Bot,
  Bell,
  Settings,
  ShoppingBag,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  module: string;
  badge?: string;
  isAi?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, module: 'DASHBOARD' },
  { label: 'Orders', path: '/orders', icon: <ShoppingCart className="w-4 h-4" />, module: 'ORDERS' },
  { label: 'Production', path: '/production', icon: <Factory className="w-4 h-4" />, module: 'PRODUCTION' },
  { label: 'Inventory', path: '/inventory', icon: <Boxes className="w-4 h-4" />, module: 'INVENTORY' },
  { label: 'Purchases', path: '/purchases', icon: <ShoppingBag className="w-4 h-4" />, module: 'PURCHASES' },
  { label: 'Dispatch', path: '/dispatch', icon: <Truck className="w-4 h-4" />, module: 'DISPATCH' },
  { label: 'Products', path: '/products', icon: <Package className="w-4 h-4" />, module: 'PRODUCTS' },
  { label: 'Sets & Sizes', path: '/sets-sizes', icon: <Layers className="w-4 h-4" />, module: 'SETS_SIZES' },
  { label: 'Customers', path: '/customers', icon: <Users className="w-4 h-4" />, module: 'CUSTOMERS' },
  { label: 'Suppliers', path: '/suppliers', icon: <Building2 className="w-4 h-4" />, module: 'SUPPLIERS' },
  { label: 'Payments', path: '/payments', icon: <CreditCard className="w-4 h-4" />, module: 'PAYMENTS' },
  { label: 'Expenses', path: '/expenses', icon: <Receipt className="w-4 h-4" />, module: 'EXPENSES' },
  { label: 'Reports', path: '/reports', icon: <BarChart3 className="w-4 h-4" />, module: 'REPORTS' },
  { label: 'AI Manager', path: '/ai-manager', icon: <Bot className="w-4 h-4" />, module: 'AI_MANAGER', isAi: true },
  { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" />, module: 'DASHBOARD', badge: '3' },
  { label: 'User Guide & SOP', path: '/guide', icon: <BookOpen className="w-4 h-4 text-amber-400" />, module: 'DASHBOARD' },
  { label: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" />, module: 'SETTINGS' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuthStore();

  const sidebarContent = (
    <aside className="w-64 bg-factory-900 border-r border-slate-800 flex flex-col shrink-0 select-none h-full overflow-hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-factory-950/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-primary-600 to-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              FACTORY AI <span className="text-emerald-400 text-[10px] px-1.5 py-0.2 bg-emerald-500/10 rounded border border-emerald-500/30">PRO</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Garment Operations</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isAllowed = hasPermission(item.module, 'canView');
          if (!isAllowed) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? item.isAi
                      ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-primary-600/20 text-primary-300 border border-primary-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-factory-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={item.isAi ? 'text-emerald-400 shrink-0' : 'text-slate-400 shrink-0'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 shrink-0">
                  {item.badge}
                </span>
              )}

              {item.isAi && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-factory-950/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-slate-300 font-medium truncate">Factory Online</span>
        </div>
        <span className="text-slate-500 shrink-0">v1.0.0</span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex h-screen shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 flex h-full max-w-[80vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
