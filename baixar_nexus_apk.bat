@echo off
chcp 65001 >nul
color 0a
title Nexus APK Downloader
echo ========================================
echo        NEXUS APK - DOWNLOADER
echo ========================================
echo.
echo Baixando APK Nexus...
echo.
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/tafasad/remote-location/releases/download/v0.1-beta/app-debug.apk' -OutFile '%USERPROFILE%\Downloads\nexus.apk'"
if exist "%USERPROFILE%\Downloads\nexus.apk" (
    echo.
    echo ========================================
    echo   DOWNLOAD CONCLUIDO!
    echo   Arquivo: Downloads\nexus.apk
    echo ========================================
    echo.
    echo Transfira o APK para o celular e instale.
    echo Permita "Fontes desconhecidas" nas configurações.
) else (
    echo.
    echo ERRO no download!
)
pause
