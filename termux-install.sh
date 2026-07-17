#!/data/data/com.termux/files/usr/bin/bash
set -e
pkg update -y > /dev/null 2>&1 || true
pkg install -y nodejs git curl > /dev/null 2>&1 || true
mkdir -p ~/remote-location/public
cd ~/remote-location
for f in server.js package.json public/index.html public/manifest.json public/sw.js start-termux.sh; do
  curl -fsSL "https://raw.githubusercontent.com/tafasad/remote-location/master/$f" -o "$f"
done
npm install --silent
chmod +x start-termux.sh
echo.
echo ===========================================
echo    NEXUS TERMUX PRONTO
echo    Rode: bash start-termux.sh
echo    Acesse: http://localhost:3001
echo ===========================================
