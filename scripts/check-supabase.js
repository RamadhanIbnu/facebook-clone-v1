import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const get = (k) => {
  const m = env.split(/\r?\n/).find(l => l.trim().startsWith(k + '='));
  if (!m) return null;
  let v = m.split('=').slice(1).join('=').trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
};

const SUPABASE_URL = get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
console.log('SUPABASE_URL present?', !!SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY present?', !!SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

 
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async () => {
  try {
  const res = await supabase.storage.from('avatars').list('', { limit: 1 });
    console.log('list result:', res);
  } catch (e) {
    console.error('error listing avatars:', e);
  }
})();
