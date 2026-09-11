import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'payments'
  | 'expenses'
  | 'dispatches'
  | 'purchase_orders';

const DB_NAME = 'factory_ai_manager_local_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

export async function getLocalDb(): Promise<IDBPDatabase<any>> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const stores = [
          'orders',
          'products',
          'sets',
          'sizes',
          'production_entries',
          'inventory',
          'customers',
          'suppliers',
          'payments',
          'expenses',
          'dispatches',
          'purchase_orders',
        ];
        stores.forEach((s) => {
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

export class LocalStorageManager {
  static async cacheItems<T extends { id: string }>(storeName: string, items: T[]) {
    try {
      const db = await getLocalDb();
      if (!db.objectStoreNames.contains(storeName)) return;
      const tx = db.transaction(storeName, 'readwrite');
      for (const item of items) {
        await tx.store.put(item as unknown as Record<string, unknown>);
      }
      await tx.done;
    } catch (e) {
      console.warn(`Local cache write failed for ${storeName}:`, e);
    }
  }

  static async getCachedItems(storeName: string) {
    try {
      const db = await getLocalDb();
      if (!db.objectStoreNames.contains(storeName)) return [];
      return await db.getAll(storeName);
    } catch (e) {
      console.warn(`Local cache read failed for ${storeName}:`, e);
      return [];
    }
  }

  static async enqueueOfflineMutation(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: Record<string, unknown>) {
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
