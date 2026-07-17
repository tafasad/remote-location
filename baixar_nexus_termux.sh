#!/data/data/com.termux/files/usr/bin/bash
set -e
clear
echo "Baixando Nexus APK..."
curl -L -o ~/nexus.apk "https://github.com/tafasad/remote-location/releases/download/v0.1-beta/app-debug.apk"
echo ""
echo "Salvo em: ~/nexus.apk"
ls -lh ~/nexus.apk
