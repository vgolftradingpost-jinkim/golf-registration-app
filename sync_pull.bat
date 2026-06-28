@echo off
REM ── Sync local repo with GitHub (origin/main) ──────────────────────
REM Cleans up a stale git lock left by the sandbox mount, discards the
REM superseded local sw.js change, then fast-forwards to origin/main.
cd /d "%~dp0"

echo [1/4] Removing stale git lock files...
if exist ".git\index.lock"     del /f /q ".git\index.lock"
if exist ".git\index.lock.del" del /f /q ".git\index.lock.del"

echo [2/4] Discarding superseded local change (app/sw.js)...
git checkout -- app/sw.js

echo [3/4] Fetching + fast-forwarding to origin/main...
git fetch origin
git merge --ff-only origin/main

echo [4/4] Result:
git log --oneline -3
git status -s

echo.
echo Done. Press any key to close.
pause >nul
