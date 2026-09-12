import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
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
  const { data: inv, error: invErr } = await supabase.from('inventory_items').select('*').limit(5);
  console.log('Inventory Items count:', inv?.length, invErr ? invErr.message : '');

  const { data: tx, error: txErr } = await supabase.from('inventory_transactions').select('*').limit(5);
  console.log('Inventory Tx count:', tx?.length, txErr ? txErr.message : '');
}

run();
