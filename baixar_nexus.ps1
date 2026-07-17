$url = "https://github.com/tafasad/remote-location/releases/download/v0.1-beta/app-debug.apk"
$out = "$env:USERPROFILE\Downloads\nexus.apk"
Write-Host "Baixando Nexus APK..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $out
Write-Host "Salvo em: $out" -ForegroundColor Green
Start-Process $out
