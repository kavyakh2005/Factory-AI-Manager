import React, { useState, useEffect } from 'react';
import { NotificationItem } from '../types';
import { NotificationService } from '../services/notifications/notificationService';
import { Button } from '../components/common/Button';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Info, Check, Filter, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getLiveAlerts();
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await NotificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter((n) => {
    if (severityFilter !== 'ALL' && n.severity !== severityFilter) return false;
    if (moduleFilter !== 'ALL' && n.module !== moduleFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Factory Alert Center</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                {unreadCount} Active Alerts
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time automated warnings: low inventory, production delays, uncollected receivables & overdue orders
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={handleMarkAllRead}
          >
            <Check className="w-4 h-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Severity Levels</option>
          <option value="CRITICAL">Critical (Immediate Action)</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low / Info</option>
        </select>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Modules</option>
          <option value="INVENTORY">Inventory & Stock</option>
          <option value="PRODUCTION">Production Line</option>
          <option value="ORDERS">Orders & Delivery</option>
          <option value="PAYMENTS">Payments & Collections</option>
        </select>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Scanning factory system for alerts...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-base text-white font-medium">All Factory Systems Operational</p>
          <p className="text-sm text-slate-500 mt-1">No critical bottlenecks or delays detected at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const isCrit = n.severity === 'CRITICAL' || n.severity === 'HIGH';
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  !n.isRead
                    ? isCrit
                      ? 'bg-red-950/20 border-red-500/40'
                      : 'bg-indigo-950/20 border-indigo-500/40'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      n.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400'
                        : n.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {n.severity === 'CRITICAL' || n.severity === 'HIGH' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {n.module}
                      </span>
                      <h3 className="font-semibold text-white text-sm">{n.title}</h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.linkUrl && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => navigate(n.linkUrl!)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Take Action
                    </Button>
                  )}
                  {!n.isRead && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
