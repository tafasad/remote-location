#!/data/data/com.termux/files/usr/bin/bash
set -e
cd ~/remote-location
if [ ! -d node_modules ]; then npm install --silent; fi
node server.js
