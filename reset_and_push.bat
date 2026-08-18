@echo off
setlocal enabledelayedexpansion
title Golf Club App - History Reset and Push
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
echo   Git History Reset + Force Push
echo   (GitHub 토큰 노출 히스토리 제거)
echo  ================================================
echo.

REM Step 1: .git-rewrite 잔재 정리
echo   [1/6] Cleaning up leftover files...
if exist ".git-rewrite" (
    rmdir /s /q ".git-rewrite"
    echo   .git-rewrite removed.
) else (
    echo   Nothing to clean.
)
echo.

REM Step 2: orphan 브랜치 생성 (히스토리 없는 새 브랜치)
echo   [2/6] Creating fresh branch (no history)...
git checkout --orphan fresh-main
echo.

REM Step 3: 전체 파일 스테이징
echo   [3/6] Staging all files...
git add -A
echo.

REM Step 4: 새 커밋 (히스토리 1개만)
echo   [4/6] Creating new clean commit...
git commit -m "feat: golf club registration app v11 (clean history)"
echo.

REM Step 5: 기존 main 브랜치 삭제 후 fresh-main을 main으로 이름 변경
echo   [5/6] Replacing main branch...
git branch -D main
git branch -m fresh-main main
echo.

REM Step 6: Force push
echo   [6/6] Force pushing to GitHub...
git push origin main --force
echo.

echo  ================================================
echo   Done!
echo   https://github.com/vgolftradingpost-jinkim/golf-registration-app
echo  ================================================
echo.
pause
