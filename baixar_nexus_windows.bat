@echo off
chcp 65001 >nul
color 0a
title Nexus - Instalador Windows
echo ========================================
echo         INSTALADOR NEXUS - WINDOWS
echo ========================================
echo.
echo [1/3] Verificando Python...
where python3 >nul 2>&1
if errorlevel 1 (
    echo Python nao encontrado!
    echo Baixe em: https://www.python.org/downloads/
    pause
    exit /b 1
)
python3 --version
echo.
echo [2/3] Clonando repositorio...
if not exist nexus-app git clone https://github.com/tafasad/nexus-desktop.git nexus-app
cd nexus-app
echo.
echo [3/3] Instalando dependencias...
python3 -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt 2>nul || pip install customtkinter cryptography pillow paho-mqtt requests aiortc geocoder sounddevice numpy scipy
echo.
echo ========================================
echo   INSTALACAO COMPLETA!
echo   Execute: run.bat
echo ========================================
pause
