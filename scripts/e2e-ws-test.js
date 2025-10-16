import WebSocket from 'ws';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const WS_HOST = '127.0.0.1';
const WS_PORT = process.env.WS_PORT || '6789';
const WS_URL = `ws://${WS_HOST}:${WS_PORT}`;
const API_BASE = 'http://127.0.0.1:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function run(){
  console.log('E2E: connecting clients');
  // create short-lived purpose='ws' tokens for both simulated users
  const tokenA = jwt.sign({ userId: 'userA', purpose: 'ws' }, JWT_SECRET, { expiresIn: '60s' });
  const tokenB = jwt.sign({ userId: 'userB', purpose: 'ws' }, JWT_SECRET, { expiresIn: '60s' });

  const a = new WebSocket(`${WS_URL}/?token=${encodeURIComponent(tokenA)}`);
  const b = new WebSocket(`${WS_URL}/?token=${encodeURIComponent(tokenB)}`);

  a.on('open', ()=> a.send(JSON.stringify({ type: 'presence', online: true })));
  b.on('open', ()=> b.send(JSON.stringify({ type: 'presence', online: true })));

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
