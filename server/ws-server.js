import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

const PORT = process.env.WS_PORT || 6789;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/publish') {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        // if payload contains a recipientId or 'to' field, only send to participant sockets
        const recipientId = payload && (payload.recipientId ?? payload.to);
        const senderId = payload && (payload.message?.userId ?? payload.userId ?? null);
        if (recipientId) {
          try { sendToUser(String(recipientId), payload); } catch {}
          if (senderId) try { sendToUser(String(senderId), payload); } catch {}
        } else {
          // public broadcast
          broadcastPublic(payload);
        }
        res.writeHead(204);
        res.end();
      } catch {
        res.writeHead(400);
        res.end('invalid json');
      }
    });
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ws server');
});

const wss = new WebSocketServer({ server });

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// Map userId -> Set of WebSocket connections for that user
const userSockets = new Map();

function addSocketForUser(userId, ws) {
  if (!userId) return;
  let s = userSockets.get(userId);
  if (!s) { s = new Set(); userSockets.set(userId, s); }
  s.add(ws);
}

function removeSocketForUser(userId, ws) {
  if (!userId) return;
  const s = userSockets.get(userId);
  if (!s) return;
  s.delete(ws);
  if (s.size === 0) userSockets.delete(userId);
}

function sendToUser(userId, data) {
  if (!userId) return;
  const s = userSockets.get(userId);
  if (!s) return;
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  for (const ws of s) {
    if (ws.readyState === WebSocket.OPEN) ws.send(str);
  }
}

function broadcastPublic(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(str);
  });
}

wss.on('connection', (ws, req) => {
  // On connection, require token query param and verify
  try {
    const reqUrl = req.url || '';
    const full = new URL(reqUrl, `http://${req.headers.host}`);
    const token = full.searchParams.get('token');
    const payload = token ? verifyToken(token) : null;
    if (!payload || !payload.userId || payload.purpose !== 'ws') {
      // close immediately if unauthorized
      try { ws.close(4001, 'Unauthorized'); } catch {}
      return;
    }
    ws._userId = String(payload.userId);
    addSocketForUser(ws._userId, ws);
  } catch {
    try { ws.close(1011, 'Server error'); } catch {}
    return;
  }
  console.log('ws client connected', ws._userId);

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      // respond to ping
      if (parsed && parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      // presence registration still allowed but trust ws._userId
      if (parsed && parsed.type === 'presence') {
        const out = { type: 'presence', userId: ws._userId, online: Boolean(parsed.online) };
        broadcastPublic(out);
        return;
      }

      // If parsed contains a recipientId or 'to' then forward only to participants
      const recipientId = parsed && (parsed.recipientId ?? parsed.to);
      const senderId = ws._userId;
      if (recipientId) {
        // send to recipient and sender if connected
        try { sendToUser(String(recipientId), parsed); } catch {}
        if (senderId) try { sendToUser(String(senderId), parsed); } catch {}
        return;
      }

      // otherwise broadcast (public messages, presence without recipient, etc.)
      if (parsed && typeof parsed === 'object' && parsed.type) {
        broadcastPublic(parsed);
      }
    } catch (e) {
      // ignore parse errors
      console.error('ws message parse error', e);
    }
  });

  ws.on('close', () => {
    // cleanup mapping
    if (ws._userId) removeSocketForUser(ws._userId, ws);
    console.log('ws client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`WS+HTTP server listening on port ${PORT}`);
});
