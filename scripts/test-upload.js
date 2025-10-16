 
import fs from 'fs';
import  { createClient } from '@supabase/supabase-js';

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
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
(async () => {
  try {
    const bucket = 'avatars';
    const path = 'test-user/test-' + Date.now() + '.png';
    const content = Buffer.from('test-content');
    console.log('Uploading to', bucket, path);
    const { data: uploadData, error: uploadErr } = await supabase.storage.from(bucket).upload(path, content, { contentType: 'image/png' });
    console.log('upload result', { uploadData, uploadErr });
    const publicRes = supabase.storage.from(bucket).getPublicUrl(path);
    console.log('public url', publicRes);
    // cleanup
    const { error: delErr } = await supabase.storage.from(bucket).remove([path]);
    console.log('delete result err', delErr);
  } catch (e) {
    console.error('test-upload error', e);
  }
})();
