@echo off
setlocal enabledelayedexpansion
title Golf Club App - GitHub Push
cd /d "%~dp0"

REM 스크립트가 놓인 폴더 = 프로젝트 루트. 경로 하드코딩 금지(v19 사고: 옛 경로가
REM 남아 있어 cd 가 조용히 실패하고 엉뚱한 폴더에서 git 이 돌 뻔했음).
if not exist ".git" (
    echo.
    echo   [!] .git not found in "%CD%"
    echo   [!] Put this script in the project root. Aborting.
    echo.
    pause
    exit /b 1
)

echo.
echo  ================================================
echo   Golf Club App - GitHub Push
echo  ================================================
echo.

REM ---- Step 0: 스테일 git 잠금 제거 (v19 사고 대응) ----
REM 샌드박스(마운트)에서 git 이 돌면 index.lock 을 스스로 지우지 못해 남는다.
REM 남아 있으면 add/commit 이 전부 실패하는데 push 는 "up-to-date" 로 성공해
REM 아무것도 안 올라간 채 Done 이 찍혔다. 그래서 여기서 먼저 치운다.
if exist ".git\index.lock" (
    echo   [Lock] Removing stale .git\index.lock
    del /f /q ".git\index.lock"
)
if exist ".git\index.lock.del" del /f /q ".git\index.lock.del"

REM ---- Step 1: sw.js CACHE_VERSION 자동 갱신 (날짜+시각) ----
REM    YYYYMMDD-HHMM 포맷 (예: 20260817-1435).
REM    날짜만 쓰면 같은 날 두 번째 푸시에서 버전 문자열이 같아져 폰이 새 코드를
REM    안 받는다(과거 20260604b/c 처럼 손으로 접미를 붙이던 원인). 분 단위까지
REM    넣어 매 푸시마다 반드시 새 버전이 되게 한다.
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm"') do set STAMP=%%i
if "!STAMP!"=="" (
    echo.
    echo   [!] Failed to read date from PowerShell - aborting.
    echo.
    pause
    exit /b 1
)
echo   [Cache] sw.js CACHE_VERSION -^> !STAMP!
powershell -NoProfile -Command "(Get-Content app\sw.js) -replace \"const CACHE_VERSION = '.*?';\", \"const CACHE_VERSION = '!STAMP!';\" | Set-Content app\sw.js"

REM 치환이 실제로 먹었는지 확인 — 실패한 채 커밋되면 폰이 옛 캐시를 계속 쓴다.
findstr /c:"const CACHE_VERSION = '!STAMP!';" app\sw.js >nul
if errorlevel 1 (
    echo.
    echo   [!] sw.js CACHE_VERSION update FAILED - aborting before commit.
    echo   [!] Check app\sw.js by hand.
    echo.
    pause
    exit /b 1
)
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
    if errorlevel 1 goto COMMIT_FAIL
    git commit -m "!MSG!"
    if errorlevel 1 goto COMMIT_FAIL
    echo.
)

REM ---- Step 4: 일반 push (안전 — --force 미사용) ----
echo   Pushing to GitHub (safe push, no force)...
git push origin main
if errorlevel 1 goto PUSH_FAIL

echo.
echo  ================================================
echo   Done!
echo   https://github.com/vgolftradingpost-jinkim/golf-registration-app
echo  ================================================
echo.
echo   [Result]
git log --oneline -1
echo.
echo   Remaining changes (empty = all pushed):
git status -s
echo.
pause
exit /b 0

:COMMIT_FAIL
echo.
echo  ================================================
echo   [!] Commit FAILED - nothing was pushed.
echo       Read the git error above.
echo       Most common cause: leftover .git\index.lock
echo       (Step 0 clears it - if it came back, another
echo        git process is still running.)
echo  ================================================
echo.
pause
exit /b 1

:PUSH_FAIL
echo.
echo  ================================================
echo   Push 실패 - 원격에 다른 커밋이 있을 수 있습니다.
echo     - 정상 충돌 해결:    git pull --rebase origin main
echo     - 히스토리 재작성 시: reset_and_push.bat 사용
echo  ================================================
echo.
pause
exit /b 1
