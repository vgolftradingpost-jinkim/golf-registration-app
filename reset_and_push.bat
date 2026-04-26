@echo off
setlocal enabledelayedexpansion
title Golf Club App - History Reset and Push
cd /d "C:\Users\redru\Desktop\01 Work_ai\03 registration_app"

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
