import http from 'http';
import WebSocket from 'ws';

const PORT = process.env.WS_PORT || 6789;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/publish') {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const data = JSON.stringify(payload);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(data);
        });
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

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('ws client connected');
  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed && parsed.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch {
      // ignore
    }
  });
  ws.on('close', () => console.log('ws client disconnected'));
});

server.listen(PORT, () => {
  console.log(`WS+HTTP server listening on port ${PORT}`);
});
