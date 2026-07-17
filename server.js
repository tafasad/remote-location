const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let PORT = process.env.PORT || (() => {
  const base = 3001;
  const max = 3600;
  return Math.floor(Math.random() * (max - base)) + base;
})();
const HTTP_PORT_FILE = path.join(__dirname, '.port');
function ensurePort(p) {
  return new Promise((resolve) => {
    const srv = http.createServer();
    srv.listen(p, '0.0.0.0', () => { srv.close(); resolve(p); });
    srv.on('error', () => resolve(null));
  });
}
const DB_PATH = path.join(__dirname, 'db.json');
const stores = new Map();

function loadStore() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const data = JSON.parse(raw);
      for (const [pin, room] of Object.entries(data)) {
        stores.set(pin, {
          wordHash: room.wordHash,
          clients: new Set(),
          messages: room.messages || [],
          locations: room.locations || [],
          photos: room.photos || []
        });
      }
    }
  } catch (e) { console.error('Erro ao carregar db:', e); }
}

function saveStore() {
  try {
    const obj = {};
    for (const [pin, room] of stores.entries()) {
      obj[pin] = {
        wordHash: room.wordHash,
        messages: room.messages,
        locations: room.locations,
        photos: room.photos
      };
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(obj));
  } catch (e) { console.error('Erro ao salvar db:', e); }
}

loadStore();
setInterval(saveStore, 30000);

function hashWord(word) {
  return crypto.createHash('sha256').update(word).digest('hex');
}

function deriveKey(word, pin) {
  return crypto.pbkdf2Sync(word, pin, 100000, 32, 'sha256').toString('hex');
}

function encrypt(keyHex, plaintext) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('base64'), data: Buffer.concat([encrypted, tag]).toString('base64') };
}

function decrypt(keyHex, ivB64, dataB64) {
  try {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivB64, 'base64');
    const buffer = Buffer.from(dataB64, 'base64');
    const tag = buffer.slice(buffer.length - 16);
    const encrypted = buffer.slice(0, buffer.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  } catch (e) { return null; }
}

app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: false, lastModified: false }));

app.post('/api/create', (req, res) => {
  const { pin, word } = req.body;
  if (!pin || pin.length < 3) return res.status(400).json({ error: 'PIN invalido' });
  if (!word || word.length < 1) return res.status(400).json({ error: 'Palavra obrigatoria' });
  if (stores.has(pin)) return res.status(409).json({ error: 'Sala ja existe' });
  stores.set(pin, { wordHash: hashWord(word), clients: new Set(), messages: [], locations: [], photos: [] });
  saveStore();
  res.json({ ok: true });
});

app.post('/api/join', (req, res) => {
  const { pin, word } = req.body;
  if (!pin || pin.length < 3) return res.status(400).json({ error: 'PIN invalido' });
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  if (word) {
    if (stores.get(pin).wordHash !== hashWord(word)) return res.status(401).json({ error: 'Palavra incorreta' });
  }
  res.json({ ok: true, hasWord: !!word });
});

app.get('/api/room/:pin', (req, res) => {
  const pin = req.params.pin;
  const word = req.query.word;
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  const room = stores.get(pin);
  const hasAccess = !word || room.wordHash === hashWord(word);
  res.json({
    exists: true,
    hasAccess,
    createdAt: room.createdAt || Date.now(),
    messageCount: room.messages.length,
    locationCount: room.locations.length,
    photoCount: room.photos.length
  });
});

app.get('/api/rooms/:pin/messages', (req, res) => {
  const pin = req.params.pin;
  const word = req.query.word;
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  const room = stores.get(pin);
  if (word && room.wordHash === hashWord(word)) {
    const keyHex = deriveKey(word, pin);
    const decrypted = room.messages.map(m => ({ ...m, text: decrypt(keyHex, m.iv, m.data) }));
    res.json({ messages: decrypted, encrypted: false });
  } else {
    res.json({ messages: room.messages, encrypted: true });
  }
});

app.post('/api/rooms/:pin/messages', (req, res) => {
  const pin = req.params.pin;
  const { word, text } = req.body;
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  const room = stores.get(pin);
  let keyHex = null;
  if (word) {
    if (room.wordHash !== hashWord(word)) return res.status(401).json({ error: 'Palavra incorreta' });
    keyHex = deriveKey(word, pin);
  }
  let iv = '', data = '';
  if (word && keyHex) {
    const enc = encrypt(keyHex, text);
    iv = enc.iv; data = enc.data;
  } else {
    iv = ''; data = Buffer.from(text, 'utf8').toString('base64');
  }
  const msg = { text, iv, data, ts: Date.now() };
  room.messages.push(msg);
  saveStore();
  room.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'message', msg })); });
  res.json({ ok: true });
});

app.get('/api/rooms/:pin/locations', (req, res) => {
  const pin = req.params.pin;
  const word = req.query.word;
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  const room = stores.get(pin);
  if (word && room.wordHash === hashWord(word)) {
    const keyHex = deriveKey(word, pin);
    const decrypted = room.locations.map(l => ({ ...l, ts: l.ts }));
    res.json({ locations: decrypted, encrypted: false });
  } else {
    res.json({ locations: room.locations.map(l => ({ lat: l.lat, lng: l.lng, ts: l.ts })), encrypted: true });
  }
});

app.post('/api/rooms/:pin/locations', (req, res) => {
  const pin = req.params.pin;
  const { lat, lng } = req.body;
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  const room = stores.get(pin);
  const loc = { lat, lng, ts: Date.now() };
  room.locations.push(loc);
  if (room.locations.length > 200) room.locations = room.locations.slice(-200);
  saveStore();
  room.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'location', loc })); });
  res.json({ ok: true });
});

app.get('/api/rooms/:pin/photos', (req, res) => {
  const pin = req.params.pin;
  const word = req.query.word;
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  const room = stores.get(pin);
  if (word && room.wordHash === hashWord(word)) {
    const keyHex = deriveKey(word, pin);
    const decrypted = room.photos.map(p => {
      const dec = decrypt(keyHex, p.iv, p.data);
      return { ...p, data: dec || p.data };
    });
    res.json({ photos: decrypted, encrypted: false });
  } else {
    res.json({ photos: room.photos.map(p => ({ iv: p.iv, data: p.data, ts: p.ts })), encrypted: true });
  }
});

app.post('/api/rooms/:pin/photos', (req, res) => {
  const pin = req.params.pin;
  const { word, data } = req.body;
  if (!stores.has(pin)) return res.status(404).json({ error: 'Nao encontrado' });
  const room = stores.get(pin);
  let keyHex = null;
  if (word) {
    if (room.wordHash !== hashWord(word)) return res.status(401).json({ error: 'Palavra incorreta' });
    keyHex = deriveKey(word, pin);
  }
  let iv = '', encryptedData = data;
  if (word && keyHex) {
    const enc = encrypt(keyHex, data);
    iv = enc.iv; encryptedData = enc.data;
  }
  const photo = { iv, data: encryptedData, ts: Date.now() };
  room.photos.push(photo);
  if (room.photos.length > 50) room.photos = room.photos.slice(-50);
  saveStore();
  room.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'photo', photo })); });
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const pin = params.get('room');
  const word = params.get('word');

  if (!pin || !stores.has(pin)) {
    ws.send(JSON.stringify({ type: 'error', data: 'Sala invalida' }));
    ws.close();
    return;
  }

  const room = stores.get(pin);
  if (word && room.wordHash !== hashWord(word)) {
    ws.send(JSON.stringify({ type: 'error', data: 'Palavra incorreta' }));
    ws.close();
    return;
  }

  ws.pin = pin;
  ws.word = word || '';
  ws.isAlive = true;
  room.clients.add(ws);
  ws.send(JSON.stringify({ type: 'joined', hasWord: !!word }));

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.type === 'message' && msg.text) {
      const existing = room.messages.find(m => m.ts === msg.ts && m.data === msg.data);
      if (!existing) {
        room.messages.push({ text: msg.text, iv: msg.iv || '', data: msg.data || '', ts: msg.ts || Date.now() });
        saveStore();
        room.clients.forEach(c => { if (c !== ws && c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'message', msg: { text: msg.text, iv: msg.iv || '', data: msg.data || '', ts: msg.ts || Date.now() } })); });
      }
    } else if (msg.type === 'location' && msg.lat != null) {
      const loc = { lat: msg.lat, lng: msg.lng, ts: Date.now() };
      room.locations.push(loc);
      if (room.locations.length > 200) room.locations = room.locations.slice(-200);
      saveStore();
      room.clients.forEach(c => { if (c !== ws && c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'location', loc })); });
    }
  });

  ws.on('close', () => {
    room.clients.delete(ws);
  });

  ws.on('pong', () => { ws.isAlive = true; });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

const startServer = async () => {
  let resolved = await ensurePort(PORT);
  let attempts = 0;
  while (!resolved && attempts < 200) {
    const candidate = Math.floor(Math.random() * (3600 - 3001)) + 3001;
    resolved = await ensurePort(candidate);
    attempts++;
  }
  if (!resolved) { console.error('Nenhuma porta livre em 3001-3599'); process.exit(1); }
  PORT = resolved;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`GeoPin Unificado rodando em http://0.0.0.0:${PORT}`);
    fs.writeFileSync(HTTP_PORT_FILE, String(PORT));
  });
};
startServer();
