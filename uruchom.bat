@echo off
setlocal
title Przewodnik Ciezkowice - uruchamianie

cd /d "%~dp0"

echo ==========================================
echo  Przewodnik Ciezkowice - start projektu
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo BLAD: Nie znaleziono Node.js.
  echo Zainstaluj Node.js 22 lub nowszy: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo BLAD: Nie znaleziono npm.
  echo Zainstaluj Node.js razem z npm: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalowanie zaleznosci npm...
  call npm install
  if errorlevel 1 goto error
  echo.
)

if not exist "apps\server\data\ciezkowice.sqlite" (
  echo Przygotowanie bazy danych SQLite...
  call npm run seed
  if errorlevel 1 goto error
  echo.
)

echo Uruchamiam aplikacje...
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000/api/health
echo.
echo Dane administratora:
echo email: admin@ciezkowice.local
echo haslo: admin123
echo.
echo Aby zatrzymac aplikacje, nacisnij CTRL+C w tym oknie.
echo.

start "" "http://localhost:5173"
call npm run dev
goto end

:error
echo.
echo Wystapil blad podczas uruchamiania projektu.
echo Sprawdz komunikaty powyzej.
pause
exit /b 1

:end
pause
