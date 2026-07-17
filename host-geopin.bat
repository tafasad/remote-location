@echo off
title GeoPin - Host + Tunel
color 1F
cls
echo.
echo ===========================================
echo    GEOPIN - HOST PUBLICO
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

echo [3/3] Iniciando servidor + tunel publico...
echo.
echo ===========================================
echo    AGUARDE O LINK PUBLICO ABAIXO
echo ===========================================
echo.
echo Esse link e o que voce manda para o amigo.
echo Quando atualizar, copie o novo link.
echo.
echo Pressione CTRL+C para parar.
echo.

timeout /t 3 /nobreak >nul

for /f "delims=" %%i in ('lt --port 3001 ^| findstr /i "your url is"') do set line=%%i
for /f "tokens=3 delims= " %%a in ("%line%") do set url=%%a

if defined url (
  echo Link publico: %url%
  echo.
)

:loop
for /f "delims=" %%i in ('lt --port 3001 ^| findstr /i "your url is"') do set line=%%i
set url=
for /f "tokens=3 delims= " %%a in ("%line%") do set url=%%a
if defined url (
  curl -s -X POST http://localhost:3001/api/tunnel-url -H "Content-Type: application/json" -d "{\"url\":\"%url%\"}" >nul
  echo Novo link: %url%
)
timeout /t 30 /nobreak >nul
goto loop
