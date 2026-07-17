@echo off
title GeoPin Installer
color 1F
cls
echo.
echo ===========================================
echo    GEOPIN - INICIALIZANDO
echo ===========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)

echo [2/3] Instalando dependencias...
call npm install

echo [3/3] Iniciando servidor...
echo.
echo Acesse: http://localhost:3001
echo.
echo Instale como app: clique no icone de instalacao na barra do Chrome
echo.

timeout /t 2 /nobreak >nul

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:3001" 2>nul || start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:3001" 2>nul || start msedge "http://localhost:3001" 2>nul || start "" "http://localhost:3001"

node server.js

pause
