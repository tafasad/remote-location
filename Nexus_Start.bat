@echo off
setlocal
title Nexus Network Cleaner + Start
echo.
echo ========================================================
echo  NEXUS - Limpando rede e iniciando servidor
echo ========================================================
echo.

echo [1/3] Flush DNS...
ipconfig /flushdns >nul 2>&1
echo      DNS limpo.

echo [2/3] Reset Winsock...
netsh winsock reset >nul 2>&1
echo      Winsock resetado.

echo [3/3] Liberando porta 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul
echo      Porta liberada.

echo.
echo ========================================================
echo  Iniciando Nexus...
echo ========================================================
cd /d %~dp0
start "Nexus" cmd /c "node server.js"

timeout /t 3 >nul
start http://localhost:3001

echo.
echo Servidor iniciado. Acesse http://localhost:3001
echo.
endlocal
