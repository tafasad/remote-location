const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let win = null;

function portFile() {
  return path.join(__dirname, '..', '.port');
}

function discoverPort() {
  const file = portFile();
  let p = 3001;
  try {
    if (fs.existsSync(file)) {
      const raw = Number(fs.readFileSync(file, 'utf8').trim());
      if (Number.isFinite(raw) && raw > 0 && raw < 65536) p = raw;
    }
  } catch {}
  return p;
}

function waitForPort(url, timeoutMs, cb) {
  const start = Date.now();
  const timer = setInterval(() => {
    http.get(url, (res) => {
      clearInterval(timer);
      cb(true);
    }).on('error', () => {
      if (Date.now() - start > timeoutMs) { clearInterval(timer); cb(false); }
    });
  }, 150);
}

function createWindow(port) {
  const base = `http://localhost:${port}`;
  win = new BrowserWindow({
    width: 420, height: 780,
    icon: path.join(__dirname, '..', 'public', 'icon-nexus.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  win.loadURL(`${base}/?port=${port}`);

  win.webContents.on('did-fail-load', () => {
    win.loadURL(`${base}/?port=${port}`);
  });

  win.on('closed', () => {
    app.quit();
  });
}

app.on('ready', () => {
  const serverPath = path.join(__dirname, '..', 'server.js');
  try {
    require(serverPath);
  } catch (e) {
    console.error('Falha ao carregar servidor:', e);
  }

  const port = discoverPort();
  const url = `http://localhost:${port}`;
  waitForPort(url, 7000, (ready) => {
    if (ready) createWindow(port);
    else {
      if (win) win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<h3 style="color:#e5e5e5;background:#050505;height:100vh;display:flex;align-items:center;justify-content:center">Nexus nao respondeu em ' + url + '</h3>'));
    }
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
