@echo off
setlocal enabledelayedexpansion
title Golf Club App - GitHub Push
cd /d "C:\Users\redru\Desktop\01 Work_ai\03 registration_app"

echo.
echo  ================================================
echo   Golf Club App - GitHub Push
echo  ================================================
echo.

REM ---- Step 1: sw.js CACHE_VERSION 자동 갱신 (오늘 날짜) ----
REM    YYYYMMDD 포맷으로 치환 (예: 20260530)
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set TODAY=%%i
echo   [Cache] sw.js CACHE_VERSION -^> !TODAY!
powershell -NoProfile -Command "(Get-Content app\sw.js) -replace \"const CACHE_VERSION = '.*?';\", \"const CACHE_VERSION = '!TODAY!';\" | Set-Content app\sw.js"
echo.

REM ---- Step 2: 변경 사항 확인 ----
echo   [Git Status]
git status --short
echo.

REM ---- Step 3: 변경 사항이 있으면 커밋 ----
git status --porcelain > "%TEMP%\gitstatus.txt" 2>nul
set SIZE=0
for %%A in ("%TEMP%\gitstatus.txt") do set SIZE=%%~zA

if not %SIZE%==0 (
    set /p MSG="  Commit message (Enter for auto): "
    if "!MSG!"=="" (
        set MSG=update
    )
    echo.
    echo   Committing: !MSG!
    git add -A
    git commit -m "!MSG!"
    echo.
)

REM ---- Step 4: 일반 push (안전 — --force 미사용) ----
echo   Pushing to GitHub (safe push, no force)...
git push origin main

if errorlevel 1 (
    echo.
    echo  ================================================
    echo   Push 실패 - 원격에 다른 커밋이 있을 수 있습니다.
    echo     - 정상 충돌 해결:    git pull --rebase origin main
    echo     - 히스토리 재작성 시: reset_and_push.bat 사용
    echo  ================================================
    echo.
    pause
    exit /b 1
)

echo.
echo  ================================================
echo   Done!
echo   https://github.com/vgolftradingpost-jinkim/golf-registration-app
echo  ================================================
echo.
pause
