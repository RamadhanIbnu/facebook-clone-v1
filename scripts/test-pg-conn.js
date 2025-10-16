 
import  fs from 'fs';
import { Client } from 'pg';

function readEnv() {
  const env = fs.readFileSync('.env', 'utf8');
  const get = (k) => {
    const line = env.split(/\r?\n/).find(l => l.startsWith(k + '='));
    if (!line) return null;
    return line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
  };
  return { pool: get('DATABASE_URL'), direct: get('DIRECT_URL') };
}

(async () => {
  const { pool, direct } = readEnv();
  console.log('POOL URL (masked):', pool ? pool.replace(/:[^:@]+@/, ':...@') : '(none)');
  console.log('DIRECT URL (masked):', direct ? direct.replace(/:[^:@]+@/, ':...@') : '(none)');

  for (const [name, url] of [['pool', pool], ['direct', direct]]) {
    if (!url) {
      console.log(`${name}: missing`);
      continue;
    }
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log(`OK: ${name} connected`);
      await client.end();
    } catch (e) {
      console.error(`ERR: ${name} -`, e && e.message ? e.message : e);
      if (e && e.stack) console.error(e.stack);
    }
  }
})();
