@echo off
title ADPYS - Guncelleme
echo.
echo  ========================================
echo   ADPYS Guncelleniyor...
echo  ========================================
echo.

:: Git yuklu mu kontrol et
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo  Git bulunamadi. Indiriliyor...
    curl -L -o "%TEMP%\GitInstaller.exe" "https://github.com/git-for-windows/git/releases/download/v2.45.2.windows.1/Git-2.45.2-64-bit.exe"
    echo  Git yukleniyor...
    start /wait "" "%TEMP%\GitInstaller.exe" /VERYSILENT /NORESTART
    echo  Git kuruldu! Lutfen bu dosyaya tekrar cift tiklin.
    pause
    exit
)

:: Bu klasorde git repo var mi?
git rev-parse --git-dir >nul 2>&1
if %errorlevel% neq 0 (
    echo  Bu klasor henuz bagli degil. Baglaniyor...
    git init
    git remote add origin https://github.com/agahhocam/agah-hoca-mobile.git
    git fetch origin claude/school-timetable-saas-LLh3F
    git checkout -b claude/school-timetable-saas-LLh3F origin/claude/school-timetable-saas-LLh3F
) else (
    echo  Son guncellemeler indiriliyor...
    git pull origin claude/school-timetable-saas-LLh3F
)

echo.
echo  Sistem yeniden baslatiliyor...
echo.

:: Docker calisiyor mu?
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker Desktop aciliyor...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Bekleniyor...
    timeout /t 25 /nobreak >nul
)

docker compose down
docker compose up --build -d

echo.
echo  Guncelleme tamamlandi! Tarayici aciliyor...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
pause
