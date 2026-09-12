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

async function testIndependentBatch() {
  console.log('Testing independent batch insertion...');
  const { data: prods } = await supabase.from('products').select('id, name').limit(1);
  const { data: sets } = await supabase.from('sets').select('id, name').limit(1);
  const { data: stages } = await supabase.from('production_stages').select('id, name').limit(1);

  console.log('Prod:', prods?.[0]?.name, 'Set:', sets?.[0]?.name, 'Stage:', stages?.[0]?.name);

  if (prods?.[0] && sets?.[0] && stages?.[0]) {
    const batch = {
      production_number: 'TEST-PRD-' + Date.now(),
      order_id: null,
      product_id: prods[0].id,
      set_id: sets[0].id,
      current_stage_id: stages[0].id,
      total_planned_qty: 100,
      target_completion_date: new Date(Date.now() + 86400000).toISOString(),
      status: 'IN_PROGRESS'
    };
    const { data, error } = await supabase.from('production_orders').insert(batch).select().single();
    if (error) {
      console.error('ERROR inserting batch without order_id:', error.message);
    } else {
      console.log('SUCCESS: Batch created without order_id! ID:', data.id);
      await supabase.from('production_orders').delete().eq('id', data.id);
      console.log('Cleaned up test batch.');
    }
  }
}

testIndependentBatch();
