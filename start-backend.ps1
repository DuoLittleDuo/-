$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$python = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "未找到虚拟环境，请先按 README 完成安装：" -ForegroundColor Yellow
    Write-Host "  python -m venv backend\.venv"
    Write-Host "  backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt"
    exit 1
}

$envFile = Join-Path $backend ".env"
if (-not (Test-Path $envFile)) {
    $secret = & $python -c "import secrets; print(secrets.token_urlsafe(48))"
    $example = Join-Path $backend ".env.example"
    $content = [System.IO.File]::ReadAllText($example, [System.Text.Encoding]::UTF8)
    $content = $content -replace 'SECRET_KEY=please-change-this-secret-key', "SECRET_KEY=$secret"
    [System.IO.File]::WriteAllText($envFile, $content, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "已生成 backend\.env（含随机 SECRET_KEY）。" -ForegroundColor Green
}

$env:HF_ENDPOINT = "https://hf-mirror.com"
Set-Location $backend

Write-Host "检查演示数据 ..." -ForegroundColor Cyan
& $python -m app.seed --if-empty

Write-Host "启动后端：http://127.0.0.1:8000/docs" -ForegroundColor Green
& $python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
