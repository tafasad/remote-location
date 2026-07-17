@echo off
title GeoPin Installer - Windows
color 1F
cls
echo.
echo ===========================================
echo    GEOPIN - INSTALADOR AUTOMATICO
echo ===========================================
echo.

set INSTALL_DIR=%USERPROFILE%\geopin

echo [1/4] Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js nao encontrado.
  echo Baixe e instale em: https://nodejs.org
  echo Depois execute este script novamente.
  pause
  exit /b 1
)

echo [2/4] Baixando GeoPin...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/server.js -o server.js
curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/package.json -o package.json
mkdir -p public
curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/public/index.html -o public/index.html
curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/public/manifest.json -o public/manifest.json
curl -fsSL https://raw.githubusercontent.com/tafasad/remote-location/master/public/sw.js -o public/sw.js

echo [3/4] Instalando dependencias...
call npm install --silent

echo [4/4] Pronto!
echo.
echo ===========================================
echo    GEOPIN INSTALADO EM: %INSTALL_DIR%
echo ===========================================
echo.
echo Como usar:
echo   1. Compartilhar: abra http://localhost:3001 no browser, digite um PIN e clique em Compartilhar
echo   2. Ver localizacao: no outro dispositivo, abra o mesmo endereco, digite o mesmo PIN e clique em Ver
echo.
echo Para hospedar publicamente, execute host-geopin.bat
echo.
pause
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:3001" 2>nul || start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:3001" 2>nul || start msedge "http://localhost:3001" 2>nul || start "" "http://localhost:3001"
