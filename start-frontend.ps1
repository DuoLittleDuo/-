$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root "frontend")

if (-not (Test-Path "node_modules")) {
    Write-Host "首次运行，正在安装前端依赖 ..." -ForegroundColor Cyan
    npm install
}

Write-Host "启动前端：http://localhost:5173" -ForegroundColor Green
npm run dev
