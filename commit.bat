@echo off
REM ── Commit the v17 TITLE-flex fix (run on Windows; push separately) ──
cd /d "%~dp0"

echo [1/4] Removing stale git lock files...
if exist ".git\index.lock"     del /f /q ".git\index.lock"
if exist ".git\index.lock.del" del /f /q ".git\index.lock.del"

echo [2/4] Staging the 4 changed files...
git add CLAUDE.md app/index.html app/sw.js docs/data_analysis.md

echo [3/4] Staged changes:
git diff --cached --stat

echo [4/4] Committing...
git commit -m "v17: TITLE flex always last + docs sync + SW cache 20260628" -m "Move flex to end of titleParts in regenerateFields() so flex is always at the end of TITLE; update TITLE format string in CLAUDE.md and docs/data_analysis.md; bump SW CACHE_VERSION 20260609 -> 20260628."

echo.
echo === Result ===
git log --oneline -3
git status -s

echo.
echo Commit done. Run push.bat to deploy when ready. Press any key.
pause >nul
