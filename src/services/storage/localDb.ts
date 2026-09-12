import { openDB, IDBPDatabase } from 'idb';
import { isLocalhost } from '../supabase/client';

export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

export type ValidStoreName =
  | 'orders'
  | 'products'
  | 'sets'
  | 'sizes'
  | 'production_entries'
  | 'production_orders'
  | 'inventory'
  | 'finished_goods_stock'
  | 'stock_reservations'
  | 'production_requirements'
  | 'stock_returns'
  | 'cartons'
  | 'customers'
  | 'suppliers'
  | 'payments'
  | 'expenses'
  | 'dispatches'
  | 'purchase_orders';

export const ALL_STORES: ValidStoreName[] = [
  'orders',
  'products',
  'sets',
  'sizes',
  'production_entries',
  'production_orders',
  'inventory',
  'finished_goods_stock',
  'stock_reservations',
  'production_requirements',
  'stock_returns',
  'cartons',
  'customers',
  'suppliers',
  'payments',
  'expenses',
  'dispatches',
  'purchase_orders',
];

// Retention period: 7 Days (in milliseconds)
export const LOCAL_RETENTION_DAYS = 7;
export const LOCAL_RETENTION_MS = LOCAL_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const DB_NAME = 'factory_ai_manager_local_db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

export async function getLocalDb(): Promise<IDBPDatabase<any>> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        ALL_STORES.forEach((s) => {
          if (!db.objectStoreNames.contains(s)) {
            db.createObjectStore(s, { keyPath: 'id' });
          }
        });
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-synced', 'synced');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Check if a record has exceeded the 7-day retention period
 */
export function isRecordExpired(item: any, maxAgeMs = LOCAL_RETENTION_MS): boolean {
  if (!item) return false;
  const now = Date.now();
  const cutoff = now - maxAgeMs;

  const timestamp =
    item._storedAt ||
    (item.updatedAt ? new Date(item.updatedAt).getTime() : null) ||
    (item.createdAt ? new Date(item.createdAt).getTime() : null) ||
    (item.created_at ? new Date(item.created_at).getTime() : null) ||
    (item.orderDate ? new Date(item.orderDate).getTime() : null) ||
    (item.expenseDate ? new Date(item.expenseDate).getTime() : null) ||
    (item.paymentDate ? new Date(item.paymentDate).getTime() : null) ||
    (item.date ? new Date(item.date).getTime() : null);

  if (timestamp && typeof timestamp === 'number' && !isNaN(timestamp)) {
    return timestamp < cutoff;
  }
  return false;
}

/**
 * Purge any local data older than 7 days from IndexedDB and localStorage
 */
export async function purgeExpiredLocalData(maxAgeMs = LOCAL_RETENTION_MS): Promise<void> {
  try {
    const cutoff = Date.now() - maxAgeMs;

    // 1. Purge from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('factory_cache_') || key.startsWith('factory_data_') || key.startsWith('factory_'))) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const fresh = parsed.filter((item) => !isRecordExpired(item, maxAgeMs));
              if (fresh.length !== parsed.length) {
                localStorage.setItem(key, JSON.stringify(fresh));
              }
            } else if (typeof parsed === 'object' && parsed !== null) {
              if (isRecordExpired(parsed, maxAgeMs)) {
                localStorage.removeItem(key);
              }
            }
          }
        } catch {
          // ignore unparseable keys
        }
      }
    }

    // 2. Purge from IndexedDB
    const db = await getLocalDb();
    for (const storeName of db.objectStoreNames) {
      const tx = db.transaction(storeName, 'readwrite');
      const all = await tx.store.getAll();
      for (const item of all) {
        if (storeName === 'sync_queue') {
          const itemTime = item.createdAt ? new Date(item.createdAt).getTime() : 0;
          if (itemTime && itemTime < cutoff) {
            await tx.store.delete(item.id);
          }
        } else if (isRecordExpired(item, maxAgeMs)) {
          await tx.store.delete(item.id);
        }
      }
      await tx.done;
    }
  } catch (err) {
    console.warn('[LocalStorageManager] Expired data purge warning:', err);
  }
}

// Automatically trigger purge check on boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    purgeExpiredLocalData();
  }, 1000);
}

export class LocalStorageManager {
  /**
   * Save items to IndexedDB and sync to localStorage with _storedAt timestamp
   */
  static async cacheItems<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    try {
      const now = Date.now();
      const stampedItems = items.map((item) => ({
        ...item,
        _storedAt: (item as any)._storedAt || now,
      }));

      // 1. Sync to localStorage for fast synchronous recovery
      try {
        localStorage.setItem(`factory_cache_${storeName}`, JSON.stringify(stampedItems));
      } catch (lsErr) {
        console.warn(`[LocalStorage] Failed to sync ${storeName} to localStorage:`, lsErr);
      }

      // 2. Persist to IndexedDB
      const db = await getLocalDb();
      if (!db.objectStoreNames.contains(storeName)) return;
      const tx = db.transaction(storeName, 'readwrite');
      for (const item of stampedItems) {
        await tx.store.put(item as unknown as Record<string, unknown>);
      }
      await tx.done;
    } catch (e) {
      console.warn(`Local cache write failed for ${storeName}:`, e);
    }
  }

  /**
   * Retrieve cached items from IndexedDB, filtering out any records older than 7 days
   */
  static async getCachedItems<T = any>(storeName: string, defaultItems: T[] = []): Promise<T[]> {
    try {
      const db = await getLocalDb();
      if (db.objectStoreNames.contains(storeName)) {
        const items = await db.getAll(storeName);
        if (items && items.length > 0) {
          const fresh = items.filter((item) => !isRecordExpired(item));
          if (fresh.length > 0) {
            return fresh as T[];
          }
        }
      }

      // Fallback: Synchronous localStorage
      const ls = localStorage.getItem(`factory_cache_${storeName}`);
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fresh = parsed.filter((item) => !isRecordExpired(item));
          if (fresh.length > 0) {
            return fresh as T[];
          }
        }
      }

      return defaultItems;
    } catch (e) {
      console.warn(`Local cache read failed for ${storeName}:`, e);
      return defaultItems;
    }
  }

  /**
   * Synchronous helper to get cached items from localStorage
   */
  static getSyncItems<T = any>(storeName: string, defaultItems: T[] = []): T[] {
    try {
      const ls = localStorage.getItem(`factory_cache_${storeName}`);
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fresh = parsed.filter((item) => !isRecordExpired(item));
          if (fresh.length > 0) {
            return fresh as T[];
          }
        }
      }
    } catch (e) {
      console.warn(`Sync cache read failed for ${storeName}:`, e);
    }
    return defaultItems;
  }

  /**
   * Enqueue mutation for background sync (Strictly bypassed when on localhost)
   */
  static async enqueueOfflineMutation(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: Record<string, unknown>) {
    // If on localhost, user requests NO data sync to Supabase!
    if (isLocalhost) {
      return null;
    }

    try {
      const db = await getLocalDb();
      const item: SyncQueueItem = {
        id: crypto.randomUUID(),
        table,
        action,
        data,
        createdAt: new Date().toISOString(),
        synced: false,
      };
      await db.put('sync_queue', item);
      window.dispatchEvent(new CustomEvent('sync:queued', { detail: item }));
      return item;
    } catch (e) {
      console.error('Failed to enqueue offline mutation:', e);
      throw e;
    }
  }

  static async getPendingSyncQueue() {
    try {
      const db = await getLocalDb();
      const allQueue = await db.getAll('sync_queue');
      return allQueue.filter((q: SyncQueueItem) => !q.synced);
    } catch (e) {
      console.warn('Failed to read sync queue:', e);
      return [];
    }
  }

  static async markQueueItemSynced(id: string) {
    try {
      const db = await getLocalDb();
      const item = await db.get('sync_queue', id);
      if (item) {
        item.synced = true;
        await db.put('sync_queue', item);
      }
    } catch (e) {
      console.warn('Failed to mark item synced:', e);
    }
  }
}

