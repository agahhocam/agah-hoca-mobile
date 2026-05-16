@echo off
title ADPYS - Akilli Ders Programi
echo.
echo  ========================================
echo   ADPYS - Akilli Ders Programi Basliyor
echo  ========================================
echo.

:: Docker Desktop'in acik olup olmadigini kontrol et
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker Desktop aciliyor, lutfen bekleyin...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Docker baslamasi icin 20 saniye bekleniyor...
    timeout /t 20 /nobreak >nul
)

echo  Sistem baslatiliyor...
echo.
docker compose up -d

echo.
echo  Sistem hazir! Tarayici aciliyor...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo  Sistemi durdurmak icin "durdur.bat" dosyasini calistirin.
echo.
pause
