@echo off
title Golf Club App Server
cd /d "C:\Users\redru\Desktop\01 Work_ai\03 registration_app"

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
