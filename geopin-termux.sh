#!/data/data/com.termux/files/usr/bin/bash
set -e
pkg update -y > /dev/null 2>&1 || true
pkg install -y nodejs git curl > /dev/null 2>&1 || true
cd ~
mkdir -p geopin
cd geopin
if [ ! -f server.js ]; then
  curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/server.js -o server.js
  curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/package.json -o package.json
  mkdir -p public
  curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/public/index.html -o public/index.html
  curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/public/manifest.json -o public/manifest.json || true
  curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/public/sw.js -o public/sw.js || true
fi
npm install --silent
echo.
echo ===========================================
echo    GEOPIN RODANDO
echo    Acesse: http://localhost:3001
echo ===========================================
echo.
termux-open http://localhost:3001 > /dev/null 2>&1 || true
node server.js
