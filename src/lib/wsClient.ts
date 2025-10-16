/* client-side WebSocket helper for browser apps */

type Handler<T = unknown> = (data: T) => void;

class WSClient {
  private url: string;
  private ws: WebSocket | null = null;
  private handlers: Set<Handler> = new Set();
  private reconnectMs = 2000;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws) return;
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('open', () => console.log('ws connected'));
    this.ws.addEventListener('message', (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        this.handlers.forEach((h) => h(parsed));
      } catch {
        console.error('ws parse error');
      }
    });
    this.ws.addEventListener('close', () => {
      console.log('ws closed, reconnecting in', this.reconnectMs);
      this.ws = null;
      setTimeout(() => this.connect(), this.reconnectMs);
    });
  }

  // gracefully close the underlying socket
  close() {
    try {
      this.ws?.close();
    } catch {}
    this.ws = null;
  }

  subscribe(h: Handler<unknown>): () => void {
    this.handlers.add(h as Handler);
    if (!this.ws) this.connect();
    return () => { this.handlers.delete(h as Handler); };
  }

  send<T>(obj: T) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try { this.ws.send(JSON.stringify(obj)); return true; } catch { return false; }
  }
}

let client: WSClient | null = null;
export function getWsClient() {
  if (!client) {
    const port = process.env.NEXT_PUBLIC_WS_PORT || '6789';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
    const base = `${protocol}://${window.location.hostname}:${port}`;

    client = new WSClient(base);

    (async () => {
      try {
        const res = await fetch('/api/ws/token');
        if (res.ok) {
          const body = await res.json();
          if (body?.token) {
            const tok = encodeURIComponent(body.token);
            try { client?.close(); } catch {}
            client = new WSClient(`${base}/?token=${tok}`);
          }
        } else {
          // fallback to cookie token if the endpoint rejects
          try {
            const cookie = typeof document !== 'undefined' ? document.cookie : '';
            const m = cookie.match(/__session=([^;]+)/);
            if (m) {
              const token = decodeURIComponent(m[1]);
              client = new WSClient(`${base}/?token=${encodeURIComponent(token)}`);
            }
          } catch {}
        }
      } catch {
        // network or other error: try cookie fallback
        try {
          const cookie = typeof document !== 'undefined' ? document.cookie : '';
          const m = cookie.match(/__session=([^;]+)/);
          if (m) {
            const token = decodeURIComponent(m[1]);
            client = new WSClient(`${base}/?token=${encodeURIComponent(token)}`);
          }
        } catch {}
      }
    })();
  }
  return client;
}
