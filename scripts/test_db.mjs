import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split(/\r?\n/);
const env = {};
for (const line of lines) {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function run() {
  const tables = [
    'products', 'sets', 'sizes', 'set_sizes', 'product_sets',
    'customers', 'suppliers', 'orders', 'order_items',
    'production_stages', 'production_orders', 'production_entries',
    'inventory_items', 'inventory_transactions',
    'dispatches', 'payments', 'expenses', 'factory_settings',
    'finished_goods_stock', 'stock_reservations', 'production_requirements',
    'cartons', 'packing_records', 'stock_returns'
  ];

  console.log('--- SUPABASE LIVE TABLE STATUS ---');
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('id').limit(1);
      if (error) {
        console.log(`[TABLE] ${t}: MISSING / ERROR -> ${error.message} (code: ${error.code})`);
      } else {
        console.log(`[TABLE] ${t}: AVAILABLE (sample rows: ${data.length})`);
      }
    } catch (e) {
      console.log(`[TABLE] ${t}: EXCEPTION -> ${e.message}`);
    }
  }
}

run();
