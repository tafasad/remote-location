#!/data/data/com.termux/files/usr/bin/bash
set -e
cd ~
echo [*] Atualizando pacotes...
pkg update -y > /dev/null 2>&1 || true
echo [*] Instalando nodejs git curl...
pkg install -y nodejs git curl > /dev/null 2>&1 || true
echo [*] Criando diretorio ~/remote-location...
mkdir -p ~/remote-location/public
cd ~/remote-location
echo [*] Baixando arquivos do GitHub...
for f in server.js package.json public/index.html public/manifest.json public/sw.js start-termux.sh; do
  mkdir -p "$(dirname "$f")"
  echo "    -> $f"
  curl -fsSL "https://raw.githubusercontent.com/tafasad/remote-location/master/$f" -o "$f"
done
echo [*] Instalando dependencias...
npm install --silent
chmod +x start-termux.sh
echo.
echo ===========================================
echo    NEXUS TERMUX PRONTO
echo    Proximo: bash start-termux.sh
echo ===========================================
