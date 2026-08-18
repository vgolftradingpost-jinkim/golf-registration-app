@echo off
setlocal
REM ============================================================
REM  sync_pull.bat - Sync local repo with GitHub (origin/main)
REM
REM  1) Removes the stale git lock the sandbox mount can leave behind
REM  2) Discards LINE-ENDING-ONLY noise (CRLF vs LF).
REM     If real content changes exist, it stops and warns instead of
REM     throwing your work away.
REM  3) Fast-forwards to origin/main
REM
REM  Note: git diff --ignore-cr-at-eol --quiet returns 0 when the only
REM  difference is the line terminator, 1 when content really differs.
REM  (--name-only does NOT honour the ignore flag, so do not use it.)
REM ============================================================
cd /d "%~dp0"

echo [1/5] Removing stale git lock files...
if exist ".git\index.lock"     del /f /q ".git\index.lock"
if exist ".git\index.lock.del" del /f /q ".git\index.lock.del"

echo [2/5] Checking whether local changes are real edits...
git diff --ignore-cr-at-eol --quiet
if errorlevel 1 goto REAL_EDITS
git diff --cached --ignore-cr-at-eol --quiet
if errorlevel 1 goto REAL_EDITS

echo [3/5] Line-ending noise only - discarding it...
git checkout -- .
goto FETCH

:REAL_EDITS
echo.
echo   [!] Real content changes found - NOTHING was discarded.
echo   [!] Review them first, then commit or stash:
echo.
git diff --ignore-cr-at-eol --stat
git diff --cached --ignore-cr-at-eol --stat
echo.
echo   Skipping the discard step.
echo   The fast-forward below may fail while the tree is dirty.
echo.

:FETCH
echo [4/5] Fetching + fast-forwarding to origin/main...
git fetch origin
git merge --ff-only origin/main

echo [5/5] Result:
git log --oneline -3
git status -s

echo.
echo Done. Press any key to close.
pause >nul
endlocal
