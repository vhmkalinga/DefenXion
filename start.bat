@echo off
echo =======================================================
echo          Starting DefenXion Services
echo =======================================================

echo.
echo [1/2] Starting FastAPI Backend...
start cmd /k "title DefenXion Backend && uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [2/2] Starting Vite Frontend Dashboard...
cd ui\dashboard
start cmd /k "title DefenXion Frontend && npm run dev"

echo.
echo =======================================================
echo Services started in new windows:
echo Backend:   http://localhost:8000
echo Frontend:  http://localhost:5173
echo =======================================================
pause
