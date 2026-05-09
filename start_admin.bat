@echo off
:: ============================================================
::  DefenXion Admin Launcher
::  Double-click this file — it will auto-elevate to Admin.
::  This enables real Windows Firewall IP blocking via netsh.
:: ============================================================

:: Check if already running as Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :ALREADY_ADMIN
)

:: Not admin — re-launch this script elevated via PowerShell
echo Requesting Administrator privileges...
PowerShell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:ALREADY_ADMIN
echo =======================================================
echo      DefenXion Services  [ADMINISTRATOR MODE]
echo      Real Windows Firewall Enforcement: ENABLED
echo =======================================================
echo.

:: Go back to the project root (in case we ended up somewhere else)
cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend (Admin)...
start cmd /k "title DefenXion Backend [ADMIN] && uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [2/2] Starting Vite Frontend Dashboard...
cd ui\dashboard
start cmd /k "title DefenXion Frontend && npm run dev"

echo.
echo =======================================================
echo  Services started:
echo  Backend:   http://localhost:8000  [Admin - Firewall ON]
echo  Frontend:  http://localhost:3000
echo =======================================================
pause
