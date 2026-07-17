@echo off
chcp 65001 >nul
echo===== NEXUS CLOUDFLARE =====
echo.

set "PORT=3001"
set "CLOUDFLARED=Nexus_Host_Cloudflare\cloudflared.exe"
set "TUNNEL_DIR=Nexus_Host_Cloudflare"

if not exist "%TUNNEL_DIR%" mkdir "%TUNNEL_DIR%"

if not exist "%CLOUDFLARED%" (
  echo Baixando cloudflared...
  powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CLOUDFLARED%'"
  echo Download concluido.
)

echo Verificando servidor Node.js na porta %PORT%...
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if errorlevel 1 (
  echo Servidor nao encontrado. Iniciando...
  start "Nexus Server" cmd /c "node server.js"
  timeout /t 3 /nobreak >nul
) else (
  echo Servidor ja esta rodando.
)

echo.
echo Criando tunnel publico...
echo.
"%CLOUDFLARED%" tunnel --url "http://localhost:%PORT%"
