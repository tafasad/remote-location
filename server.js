const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;
const rooms = new Map();

app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { etag: false, lastModified: false }));

app.use(express.json({ limit: '1kb' }));

app.post('/api/create', (req, res) => {
  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN invalido' });
  if (rooms.has(pin)) return res.status(409).json({ error: 'Sala ja existe' });
  rooms.set(pin, new Set());
  res.json({ ok: true });
});

app.post('/api/join', (req, res) => {
  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN invalido' });
  if (!rooms.has(pin)) return res.status(404).json({ error: 'Sala nao encontrada' });
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const pin = params.get('room');
  const role = params.get('role');

  if (!pin || !role || !rooms.has(pin)) {
    ws.send(JSON.stringify({ type: 'error', data: 'Sala invalida' }));
    ws.close();
    return;
  }

  ws.pin = pin;
  ws.role = role;
  ws.isAlive = true;

  rooms.get(pin).add(ws);
  ws.send(JSON.stringify({ type: 'joined' }));

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.type === 'location' && msg.lat != null && msg.lng != null) {
      rooms.get(pin).forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'location', lat: msg.lat, lng: msg.lng, ts: msg.ts }));
        }
      });
    }
  });

  ws.on('close', () => {
    const set = rooms.get(pin);
    if (set) {
      set.delete(ws);
      if (set.size === 0) rooms.delete(pin);
    }
  });

  ws.on('pong', () => { ws.isAlive = true; });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GeoPin rodando em http://0.0.0.0:${PORT}`);
});
