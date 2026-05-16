@echo off
title ADPYS - Akilli Ders Programi
echo.
echo  ========================================
echo   ADPYS - Akilli Ders Programi
echo  ========================================
echo.

:: Docker yuklu mu kontrol et
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker bulunamadi. Indiriliyor...
    echo  Bu islem birkaç dakika surebilir, lutfen bekleyin.
    echo.
    curl -L -o "%TEMP%\DockerInstaller.exe" "https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe"
    echo.
    echo  Docker yukleniyor... Kurulum tamamlaninca bilgisayari yeniden baslatin.
    echo  Sonra bu dosyaya tekrar cift tiklin.
    echo.
    start /wait "" "%TEMP%\DockerInstaller.exe" install --quiet
    echo.
    echo  Kurulum tamamlandi! Lutfen bilgisayari yeniden baslatin.
    pause
    exit
)

:: Docker Desktop calisiyor mu kontrol et
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker Desktop aciliyor, lutfen bekleyin...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Docker baslamasi icin 25 saniye bekleniyor...
    timeout /t 25 /nobreak >nul
)

:: Tekrar kontrol et
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker hala hazir degil, 15 saniye daha bekleniyor...
    timeout /t 15 /nobreak >nul
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
