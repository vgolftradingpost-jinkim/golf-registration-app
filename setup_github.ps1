
$TOKEN  = "YOUR_GITHUB_TOKEN_HERE"  # GitHub Settings > Developer settings > Personal access tokens
$USER   = "vgolftradingpost-jinkim"
$REPO   = "golf-registration-app"
$EMAIL  = "vgolftradingpost@gmail.com"

$PROJECT = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PROJECT
Write-Host "Project path: $PROJECT" -ForegroundColor Cyan

# 1. Create GitHub repository
Write-Host "[1/4] Creating GitHub repository..." -ForegroundColor Yellow
$body = @{
    name        = $REPO
    description = "Used golf club registration PWA - Claude AI Vision + eBay price lookup"
    private     = $true
    auto_init   = $false
} | ConvertTo-Json
$headers = @{
    Authorization = "token $TOKEN"
    Accept        = "application/vnd.github.v3+json"
}
try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" `
        -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Repository created: $($response.html_url)" -ForegroundColor Green
} catch {
    Write-Host "Repository may already exist. Continuing..." -ForegroundColor Yellow
}

# 2. Remove old .git and reinitialize
Write-Host "[2/4] Initializing git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Remove-Item -Recurse -Force ".git"
    Write-Host "Old .git removed." -ForegroundColor Yellow
}
git init
git config user.name $USER
git config user.email $EMAIL
git branch -m main
Write-Host "Git initialized (branch: main)" -ForegroundColor Green

# 3. First commit
Write-Host "[3/4] Staging and committing files..." -ForegroundColor Yellow
git add -A
git status --short
git commit -m "feat: initial commit - golf club registration PWA"
Write-Host "First commit done." -ForegroundColor Green

# 4. Push to GitHub
Write-Host "[4/4] Pushing to GitHub..." -ForegroundColor Yellow
$remoteUrl = "https://${TOKEN}@github.com/${USER}/${REPO}.git"
git remote add origin $remoteUrl
git push -u origin main

Write-Host ""
Write-Host "Done! Repository: https://github.com/$USER/$REPO" -ForegroundColor Green
Read-Host "Press Enter to close"
