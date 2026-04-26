@echo off
setlocal enabledelayedexpansion
title Golf Club App - GitHub Push
cd /d "C:\Users\redru\Desktop\01 Work_ai\03 registration_app"

echo.
echo  ================================================
echo   Golf Club App - GitHub Push
echo  ================================================
echo.

REM Show current status
echo   [Git Status]
git status --short
echo.

REM If there are uncommitted changes, commit them first
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

REM Push with force to override history (token cleanup)
echo   Pushing to GitHub...
git push origin main --force

echo.
echo  ================================================
echo   Done!
echo   https://github.com/vgolftradingpost-jinkim/golf-registration-app
echo  ================================================
echo.
pause
