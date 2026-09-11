import React, { useState, useEffect } from 'react';
import { Search, Bell, LogOut, Shield, ChevronDown, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../common/Badge';
import { LocalStorageManager } from '../../services/storage/localDb';

interface TopBarProps {
  onOpenSearch?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSearch }) => {
  const { user, logout } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updatePendingCount = async () => {
      const items = await LocalStorageManager.getPendingSyncQueue();
      setPendingSyncCount(items.length);
    };

    updatePendingCount();
    window.addEventListener('sync:queued', updatePendingCount);
    window.addEventListener('sync:completed', updatePendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync:queued', updatePendingCount);
      window.removeEventListener('sync:completed', updatePendingCount);
    };
  }, []);

  const getRoleVariant = (roleName?: string) => {
    switch (roleName) {
      case 'OWNER':
        return 'danger';
      case 'ADMIN':
        return 'primary';
      case 'PRODUCTION_MANAGER':
        return 'warning';
      case 'INVENTORY_MANAGER':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <header className="h-16 bg-factory-900/90 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 backdrop-blur z-20">
      {/* Global Search Bar Trigger */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-factory-950/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 text-xs transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
            <span>Search orders, sets, sizes, products, customers...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-factory-800 text-slate-400 rounded border border-slate-700">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Network & Offline Resilience Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400 font-medium animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode (Local Cache)</span>
            </div>
          )}

          {pendingSyncCount > 0 && (
            <Badge variant="warning" size="sm">
              {pendingSyncCount} changes to sync
            </Badge>
          )}
        </div>

        {/* AI Quick Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">AI Floor Monitor: Active</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-factory-800 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-factory-900" />
        </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 p-1.5 pl-2.5 pr-2 rounded-lg hover:bg-factory-800/80 transition-colors border border-transparent hover:border-slate-800"
          >
            <div className="w-7 h-7 rounded-full bg-primary-600/30 text-primary-300 border border-primary-500/40 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">{user?.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                <Badge variant={getRoleVariant(user?.role.name)} size="sm">
                  {user?.role.displayName}
                </Badge>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-factory-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-100">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-300">
                  <Shield className="w-3 h-3 text-primary-400" />
                  <span>Role: {user?.role.displayName}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
