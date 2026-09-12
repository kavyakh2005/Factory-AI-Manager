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
  const { data: stages, error } = await supabase.from('production_stages').select('*').order('sequence', { ascending: true });
  console.log('Stages count:', stages?.length, error ? error.message : '');
  stages?.forEach(s => console.log(`[${s.sequence}] ${s.name} (id: ${s.id}, is_system: ${s.is_system})`));
}

run();
