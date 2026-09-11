import { LocalStorageManager } from '../storage/localDb';
import { supabase, isSupabaseConfigured } from '../supabase/client';

export class SyncManager {
  private static isSyncing = false;

  static init() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet connection restored. Processing offline sync queue...');
      this.flushQueue();
    });
  }

  static async flushQueue() {
    if (this.isSyncing || !navigator.onLine || !isSupabaseConfigured) return;
    this.isSyncing = true;

    try {
      const pendingItems = await LocalStorageManager.getPendingSyncQueue();
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`Flushing ${pendingItems.length} pending offline mutations to Supabase...`);

      for (const item of pendingItems) {
        try {
          if (item.action === 'INSERT') {
            const { error } = await supabase.from(item.table).insert(item.data);
            if (!error) {
              await LocalStorageManager.markQueueItemSynced(item.id);
            }
          } else if (item.action === 'UPDATE') {
            const { error } = await supabase
              .from(item.table)
              .update(item.data)
              .eq('id', item.data.id);
            if (!error) {
              await LocalStorageManager.markQueueItemSynced(item.id);
            }
          } else if (item.action === 'DELETE') {
            const { error } = await supabase
              .from(item.table)
              .delete()
              .eq('id', item.data.id);
            if (!error) {
              await LocalStorageManager.markQueueItemSynced(item.id);
            }
          }
        } catch (err) {
          console.error(`Sync error on table ${item.table}:`, err);
        }
      }

      window.dispatchEvent(new Event('sync:completed'));
    } catch (e) {
      console.error('Sync queue flush error:', e);
    } finally {
      this.isSyncing = false;
    }
  }
}
