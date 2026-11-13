@echo off
setlocal
title Reset hasla administratora - Przewodnik Ciezkowice
cd /d "%~dp0"

echo ==========================================
echo  Reset hasla administratora
echo ==========================================
echo.
set /p ADMIN_EMAIL=Podaj e-mail administratora [admin@ciezkowice.local]: 
if "%ADMIN_EMAIL%"=="" set ADMIN_EMAIL=admin@ciezkowice.local

set /p ADMIN_PASSWORD=Podaj nowe haslo [admin123]: 
if "%ADMIN_PASSWORD%"=="" set ADMIN_PASSWORD=admin123

node "scripts/reset-admin-password.mjs" "%ADMIN_EMAIL%" "%ADMIN_PASSWORD%"
echo.
pause
