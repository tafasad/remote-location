@echo off
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%
echo Installing Android SDK components...
call sdkmanager.bat --licenses < NUL > NUL 2>&1
echo y | call sdkmanager.bat "platform-tools" "platforms;android-30" "build-tools;30.0.3" 2>&1
echo Done.
pause
