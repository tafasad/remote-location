@echo off
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%
echo.
echo Installer SDK Android...
echo.
sdkmanager.bat --licenses
sdkmanager.bat "platform-tools" "platforms;android-30" "build-tools;30.0.3"
pause
