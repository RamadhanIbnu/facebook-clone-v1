import WebSocket from 'ws';
import fetch from 'node-fetch';

const WS_URL = 'ws://127.0.0.1:6789';
const API_BASE = 'http://127.0.0.1:3000';

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function run(){
  console.log('E2E: connecting clients');
  const a = new WebSocket(WS_URL);
  const b = new WebSocket(WS_URL);

  a.on('open', ()=> a.send(JSON.stringify({ type: 'presence', userId: 'userA', online: true })));
  b.on('open', ()=> b.send(JSON.stringify({ type: 'presence', userId: 'userB', online: true })));

  a.on('message', (m) => console.log('[A ws] ', m.toString()));
  b.on('message', (m) => console.log('[B ws] ', m.toString()));

  // wait for connections
  await sleep(500);

  console.log('E2E: A posts a message to B');
  const postRes = await fetch(API_BASE + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hello from A', recipientId: 'userB' }) });
  console.log('POST status', postRes.status); const postBody = await postRes.text(); console.log('POST body', postBody);

  await sleep(1000);

  console.log('E2E: B reacts to message (if message id present)');
  try{
    const j = JSON.parse(postBody || '{}');
    const msgId = j.message && j.message.id ? j.message.id : null;
    if (msgId){
      const react = await fetch(API_BASE + `/api/messages/${msgId}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'like' }) });
      console.log('reaction status', react.status, await react.text());
    }
  }catch(e){ console.error(e); }

  await sleep(1000);
  console.log('E2E done');
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
