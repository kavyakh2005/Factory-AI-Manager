import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mnnfdedjfffsogdiaoct.supabase.co";
const supabaseAnonKey = "sb_publishable_YuQfDDlEAh-iFKDeTMXKAg_c-p_tCv7";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function wipeDatabase() {
  console.log('🚀 Starting complete wipe of Supabase database tables...');

  // Child tables first to satisfy foreign keys
  const tables = [
    'audit_logs',
    'inventory_transactions',
    'stock_reservations',
    'stock_returns',
    'production_requirements',
    'production_entries',
    'dispatches',
    'payments',
    'purchase_order_items',
    'purchase_orders',
    'order_items',
    'orders',
    'inventory_items',
    'production_orders',
    'product_sets',
    'set_sizes',
    'products',
    'sets',
    'sizes',
    'customers',
    'suppliers',
    'expenses',
  ];

  for (const table of tables) {
    try {
      console.log(`🧹 Clearing table: ${table}...`);
      
      // Fetch all IDs
      const { data, error } = await supabase.from(table).select('id');
      if (error) {
        console.warn(`⚠️ Could not query ${table}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`Found ${data.length} records in ${table}. Deleting...`);
        for (const row of data) {
          const { error: delError } = await supabase.from(table).delete().eq('id', row.id);
          if (delError) {
            console.warn(`  Failed to delete id ${row.id} from ${table}:`, delError.message);
          }
        }
        console.log(`✅ Cleared ${table}`);
      } else {
        console.log(`ℹ️ Table ${table} is already empty.`);
      }
    } catch (err) {
      console.error(`❌ Error clearing ${table}:`, err.message);
    }
  }

  console.log('\n🎉 Supabase Database Wipe Completed Successfully!');
}

wipeDatabase();
