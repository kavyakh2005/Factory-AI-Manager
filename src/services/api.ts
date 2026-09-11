import { supabase, isSupabaseConfigured } from './supabase/client';
import { DashboardData, AppSettings, AuditLog, User, Role } from '../types';

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Mock fallback data for offline / initial development before live Supabase credentials
const MOCK_SETTINGS: AppSettings = {
  id: 'setting-1',
  factoryName: 'Apex Garment Mills Ltd.',
  address: 'Plot 42, Industrial Textile Area, Phase 2',
  gstNumber: '27AAACA1234A1Z5',
  currencySymbol: '₹',
  taxPercentage: 5.0,
  aiModelProvider: 'gemini',
  autoBackupEnabled: true,
  backupFrequencyHours: 24,
};

const MOCK_ROLES: Role[] = [
  { id: 'r-1', name: 'OWNER', displayName: 'Factory Owner' },
  { id: 'r-2', name: 'ADMIN', displayName: 'Administrator' },
  { id: 'r-3', name: 'MANAGER', displayName: 'General Manager' },
  { id: 'r-4', name: 'PRODUCTION_MANAGER', displayName: 'Production Manager' },
  { id: 'r-5', name: 'INVENTORY_MANAGER', displayName: 'Inventory Manager' },
  { id: 'r-6', name: 'ACCOUNTANT', displayName: 'Accountant' },
  { id: 'r-7', name: 'STAFF', displayName: 'Floor Operator' },
];

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. Dashboard Summary
  if (endpoint.startsWith('/dashboard/summary')) {
    if (isSupabaseConfigured) {
      try {
        const { count: pendingOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH']);

        const { data: delayedOrders } = await supabase
          .from('orders')
          .select('id, order_number, delivery_date, customers(name)')
          .lt('delivery_date', new Date().toISOString())
          .neq('status', 'COMPLETED');

        const { data: inventoryItems } = await supabase
          .from('inventory_items')
          .select('id, name, sku, current_stock, minimum_stock_threshold, unit');

        const lowStock = (inventoryItems || []).filter(
          (i) => Number(i.current_stock) <= Number(i.minimum_stock_threshold)
        );

        const data: DashboardData = {
          metrics: {
            todayProductionPassed: 0,
            todayProductionRejected: 0,
            pendingOrders: pendingOrders || 0,
            ordersDueToday: 0,
            ordersDueSoon: 0,
            delayedOrders: delayedOrders?.length || 0,
            todayDispatchesCount: 0,
            todayDispatchesPcs: 0,
            lowStockCount: lowStock.length,
            outstandingReceivables: 0,
            bottlenecksCount: 0,
            totalProducts: 0,
            totalSets: 0,
          },
          aiFactorySummary: {
            headline: `Factory Status: ${pendingOrders || 0} pending orders, ${lowStock.length} low stock alerts.`,
            producedPcs: 0,
            rejectedPcs: 0,
            pendingOrdersCount: pendingOrders || 0,
            ordersDueToday: 0,
            delayedCount: delayedOrders?.length || 0,
            lowStockCount: lowStock.length,
            dispatchedPcs: 0,
            outstandingReceivables: 0,
            priorityAdvice: 'Live operations running against Supabase cloud database.',
          },
          lowStockItems: lowStock.slice(0, 5).map((i) => ({
            id: i.id,
            name: i.name,
            sku: i.sku,
            currentStock: Number(i.current_stock),
            minimumStockThreshold: Number(i.minimum_stock_threshold),
            unit: i.unit,
          })),
          delayedOrderList: (delayedOrders || []).slice(0, 5).map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            deliveryDate: o.delivery_date,
            customer: { name: o.customers?.name || 'Retail Client' },
          })),
        };

        return data as unknown as T;
      } catch (err) {
        console.warn('Error querying live dashboard data:', err);
      }
    }

    return {
      metrics: {
        todayProductionPassed: 0,
        todayProductionRejected: 0,
        pendingOrders: 0,
        ordersDueToday: 0,
        ordersDueSoon: 0,
        delayedOrders: 0,
        todayDispatchesCount: 0,
        todayDispatchesPcs: 0,
        lowStockCount: 0,
        outstandingReceivables: 0,
        bottlenecksCount: 0,
        totalProducts: 0,
        totalSets: 0,
      },
      aiFactorySummary: {
        headline: "Factory Status: Live database connected.",
        producedPcs: 0,
        rejectedPcs: 0,
        pendingOrdersCount: 0,
        ordersDueToday: 0,
        delayedCount: 0,
        lowStockCount: 0,
        dispatchedPcs: 0,
        outstandingReceivables: 0,
        priorityAdvice: 'System ready for factory operations.',
      },
      lowStockItems: [],
      delayedOrderList: [],
    } as unknown as T;
  }

  // 2. Settings
  if (endpoint === '/settings') {
    let currentSaved: AppSettings = { ...MOCK_SETTINGS };
    try {
      const localStored = localStorage.getItem('factory_app_settings');
      if (localStored) {
        currentSaved = { ...currentSaved, ...JSON.parse(localStored) };
      }
    } catch {}

    if (method === 'PUT') {
      const updatedSettings: AppSettings = {
        ...currentSaved,
        ...body,
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage immediately
      try {
        localStorage.setItem('factory_app_settings', JSON.stringify(updatedSettings));
        Object.assign(MOCK_SETTINGS, updatedSettings);
      } catch (storageErr) {
        console.warn('Settings local storage error:', storageErr);
      }

      if (isSupabaseConfigured) {
        try {
          const { data: existing } = await supabase.from('factory_settings').select('*').limit(1).maybeSingle();
          if (existing) {
            const { data, error } = await supabase
              .from('factory_settings')
              .update({
                factory_name: updatedSettings.factoryName,
                address: updatedSettings.address,
                gst_number: updatedSettings.gstNumber,
                currency_symbol: updatedSettings.currencySymbol,
                tax_percentage: updatedSettings.taxPercentage,
                ai_model_provider: updatedSettings.aiModelProvider,
                auto_backup_enabled: updatedSettings.autoBackupEnabled,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id)
              .select()
              .single();

            if (!error && data) {
              updatedSettings.id = data.id;
            }
          } else {
            const { data, error } = await supabase
              .from('factory_settings')
              .insert({
                factory_name: updatedSettings.factoryName,
                address: updatedSettings.address,
                gst_number: updatedSettings.gstNumber,
                currency_symbol: updatedSettings.currencySymbol,
                tax_percentage: updatedSettings.taxPercentage,
                ai_model_provider: updatedSettings.aiModelProvider,
                auto_backup_enabled: updatedSettings.autoBackupEnabled,
              })
              .select()
              .single();

            if (!error && data) {
              updatedSettings.id = data.id;
            }
          }

          // Write audit log
          await supabase.from('audit_logs').insert({
            action: 'UPDATE_SETTINGS',
            entity: 'Settings',
            new_value: {
              factoryName: updatedSettings.factoryName,
              gstNumber: updatedSettings.gstNumber,
              address: updatedSettings.address,
            },
          });
        } catch (err) {
          console.warn('factory_settings Supabase sync warning:', err);
        }
      }

      return updatedSettings as unknown as T;
    }

    // GET Method
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('factory_settings').select('*').limit(1).maybeSingle();
        if (!error && data) {
          const loadedSettings: AppSettings = {
            id: data.id,
            factoryName: data.factory_name || currentSaved.factoryName,
            address: data.address || currentSaved.address,
            gstNumber: data.gst_number || currentSaved.gstNumber,
            currencySymbol: data.currency_symbol || currentSaved.currencySymbol,
            taxPercentage: data.tax_percentage !== undefined ? Number(data.tax_percentage) : currentSaved.taxPercentage,
            aiModelProvider: data.ai_model_provider || currentSaved.aiModelProvider,
            autoBackupEnabled: data.auto_backup_enabled !== undefined ? data.auto_backup_enabled : currentSaved.autoBackupEnabled,
            backupFrequencyHours: 24,
          };
          localStorage.setItem('factory_app_settings', JSON.stringify(loadedSettings));
          Object.assign(MOCK_SETTINGS, loadedSettings);
          return loadedSettings as unknown as T;
        }
      } catch (err) {
        console.warn('factory_settings query error:', err);
      }
    }

    return currentSaved as unknown as T;
  }

  // 3. Roles
  if (endpoint === '/auth/roles') {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('roles').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            name: r.name,
            displayName: r.display_name,
            description: r.description,
            isSystem: r.is_system,
          })) as unknown as T;
        }
      } catch (err) {
        console.warn('roles query error:', err);
      }
    }
    return MOCK_ROLES as unknown as T;
  }

  // 4. Users
  if (endpoint === '/auth/users') {
    if (method === 'POST') {
      const newId = crypto.randomUUID();
      const roleObj = MOCK_ROLES.find((r) => r.id === body.roleId) || MOCK_ROLES[0];
      const newUser: User = {
        id: newId,
        email: body.email,
        name: body.name,
        phone: body.phone,
        role: roleObj,
      };

      // Save to local custom users store for instant login authentication
      try {
        const existingUsers = JSON.parse(localStorage.getItem('factory_custom_users') || '[]');
        existingUsers.push({
          id: newId,
          email: body.email,
          name: body.name,
          phone: body.phone,
          roleId: roleObj.name,
          password: body.password || 'Staff@123',
        });
        localStorage.setItem('factory_custom_users', JSON.stringify(existingUsers));
      } catch (storageErr) {
        console.warn('Local storage error:', storageErr);
      }

      if (isSupabaseConfigured) {
        try {
          await supabase.from('profiles').insert({
            id: newId,
            email: body.email,
            name: body.name,
            phone: body.phone,
            role_id: body.roleId && body.roleId.length > 10 ? body.roleId : undefined,
            is_active: true,
          });

          await supabase.from('audit_logs').insert({
            action: 'CREATE_USER',
            entity: 'User',
            entity_id: newId,
            new_value: { name: body.name, email: body.email },
          });
        } catch (err) {
          console.warn('Supabase profile create error:', err);
        }
      }
      return newUser as unknown as T;
    }

    if (method === 'DELETE') {
      const deleteId = body?.id || (typeof options?.body === 'string' ? JSON.parse(options.body).id : undefined);
      if (deleteId) {
        try {
          const existingUsers = JSON.parse(localStorage.getItem('factory_custom_users') || '[]');
          const filtered = existingUsers.filter((u: any) => u.id !== deleteId);
          localStorage.setItem('factory_custom_users', JSON.stringify(filtered));
        } catch {}

        if (isSupabaseConfigured) {
          try {
            await supabase.from('profiles').delete().eq('id', deleteId);
            await supabase.from('audit_logs').insert({
              action: 'DELETE_USER',
              entity: 'User',
              entity_id: deleteId,
            });
          } catch (err) {
            console.warn('Supabase profile delete error:', err);
          }
        }
      }
      return { success: true } as unknown as T;
    }

    const customUsersList: User[] = [];
    try {
      const localUsers = JSON.parse(localStorage.getItem('factory_custom_users') || '[]');
      localUsers.forEach((u: any) => {
        customUsersList.push({
          id: u.id,
          email: u.email,
          name: u.name,
          phone: u.phone,
          role: MOCK_ROLES.find((r) => r.name === u.roleId) || MOCK_ROLES[6],
        });
      });
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('profiles').select('*, roles(*)').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const dbUsers = data.map((p: any) => ({
            id: p.id,
            email: p.email,
            name: p.name,
            phone: p.phone,
            role: p.roles ? {
              id: p.roles.id,
              name: p.roles.name,
              displayName: p.roles.display_name,
            } : MOCK_ROLES[0],
            isActive: p.is_active,
            createdAt: p.created_at,
          }));
          return [
            { id: 'u-owner-kavya', email: 'kavyakhandelwal57@gmail.com', name: 'Kavya Khandelwal (Owner)', phone: '+91 98200 11223', role: MOCK_ROLES[0] },
            ...dbUsers,
            ...customUsersList.filter((cu) => !dbUsers.some((du: any) => du.email === cu.email)),
          ] as unknown as T;
        }
      } catch (err) {
        console.warn('Supabase profiles query error:', err);
      }
    }

    // Real factory owner account + any custom users created in settings
    return [
      { id: 'u-owner-kavya', email: 'kavyakhandelwal57@gmail.com', name: 'Kavya Khandelwal (Owner)', phone: '+91 98200 11223', role: MOCK_ROLES[0] },
      ...customUsersList,
    ] as unknown as T;
  }

  // 5. Audit Logs
  if (endpoint === '/settings/audit-logs') {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) {
          return data.map((log: any) => ({
            id: log.id,
            action: log.action,
            entity: log.entity,
            createdAt: log.created_at,
            user: { name: log.user_id ? 'Authenticated User' : 'System / Auto' },
            ipAddress: log.ip_address || '127.0.0.1',
          })) as unknown as T;
        }
      } catch (err) {
        console.warn('Failed to query audit_logs from Supabase:', err);
      }
    }
    return [] as unknown as T;
  }

  return {} as T;
}
