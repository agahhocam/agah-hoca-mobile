@echo off
title ADPYS - Akilli Ders Programi

:: Yonetici yetkisi kontrol et, yoksa iste
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Yonetici yetkisi gerekiyor, lutfen "Evet" e basin...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo.
echo  ========================================
echo   ADPYS - Akilli Ders Programi
echo  ========================================
echo.

:: Docker yuklu mu kontrol et
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker bulunamadi. Indiriliyor...
    echo  Lutfen bekleyin, bu 2-3 dakika surebilir...
    echo.
    powershell -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe' -OutFile '%TEMP%\DockerInstaller.exe'"
    if %errorlevel% neq 0 (
        echo  HATA: Indirme basarisiz. Internet baglantinizi kontrol edin.
        pause
        exit
    )
    echo  Docker yukleniyor... Lutfen acilan pencerede "Tamam" a basin.
    echo.
    "%TEMP%\DockerInstaller.exe"
    echo.
    echo  Kurulum tamamlandi!
    echo  Lutfen bilgisayari YENIDEN BASLATIN ve sonra başlat.bat e tekrar cift tiklin.
    echo.
    pause
    exit
)

:: Docker Desktop calisiyor mu kontrol et
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker Desktop aciliyor, lutfen bekleyin...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Docker baslamasi icin 30 saniye bekleniyor...
    timeout /t 30 /nobreak >nul

    :: Hala hazir degilse 15 saniye daha bekle
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo  Biraz daha bekleniyor...
        timeout /t 15 /nobreak >nul
    )
)

:: Son kontrol
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  HATA: Docker baslanamadi.
    echo  Docker Desktop uygulamasini elle acin ve tekrar deneyin.
    echo.
    pause
    exit
)

echo  Sistem baslatiliyor...
echo.
docker compose up -d

if %errorlevel% neq 0 (
    echo.
    echo  Sistem ilk kez baslatiliyor, derleniyor...
    docker compose up --build -d
)

echo.
echo  Sistem hazir! Tarayici aciliyor...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo  Sistemi durdurmak icin "durdur.bat" dosyasini calistirin.
echo.
pause
