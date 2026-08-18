@echo off
title Golf Club App Server
cd /d "%~dp0"

REM 스크립트가 놓인 폴더 = 프로젝트 루트 (경로 하드코딩 금지 — v19)
if not exist "app\index.html" (
    echo.
    echo   [!] app\index.html not found in "%CD%" - aborting.
    echo.
    pause
    exit /b 1
)

echo.
echo  ================================================
echo   Golf Club App - Local Server
echo  ================================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set IP=%%a
)
set IP=%IP: =%

echo   Server starting on port 8080...
echo.
echo   PC:    http://localhost:8080/app/
echo   Phone: http://%IP%:8080/app/
echo.
echo   (Same WiFi required for phone access)
echo   Press Ctrl+C to stop the server.
echo  ================================================
echo.

python -m http.server 8080
pause
