# ============================================================================
#  fix-docker.ps1 — чинит Docker Desktop, который после сна падает на старте
#  с "initializing Inference manager / Secrets Engine ... The file cannot be
#  accessed by the system". Поднимает Docker и инфру artshop одной командой.
#
#  Запуск:  powershell -ExecutionPolicy Bypass -File scripts\fix-docker.ps1
#
#  Что делает (см. также память artshop-docker-inference-crash):
#   1. гасит все процессы Docker;
#   2. принудительно выключает Inference manager через features-overrides.json
#      (EnableDockerAI=false его НЕ выключает; переименование папок НЕ держит);
#   3. отодвигает залипшие сокет-папки run / docker-secrets-engine;
#   4. запускает Docker Desktop и ждёт демон;
#   5. поднимает postgres/redis/minio (docker compose up -d).
# ============================================================================

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot   # корень репозитория
$dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"

function Log($m) { Write-Host "[fix-docker] $m" -ForegroundColor Cyan }

# 1) убить процессы Docker ---------------------------------------------------
Log "Гашу процессы Docker..."
Get-Process | Where-Object { $_.Name -match 'Docker Desktop|com\.docker|dockerd|vpnkit|docker$' } |
  Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 2) выключить Inference manager через оверрайд фичефлага ---------------------
Log "Выключаю Inference manager (features-overrides.json)..."
$foPath = "$env:APPDATA\Docker\features-overrides.json"
$fo = @{}
if (Test-Path $foPath) {
  try { $fo = Get-Content $foPath -Raw | ConvertFrom-Json -AsHashtable } catch { $fo = @{} }
  if ($null -eq $fo) { $fo = @{} }
}
$fo['InferenceAvailable'] = @{
  name    = 'InferenceAvailable'
  enabled = $false
  variant = @{ name = 'disabled'; payload = @{} }
}
$fo | ConvertTo-Json -Depth 6 | Set-Content $foPath -Encoding utf8

# 3) отодвинуть залипшие сокет-папки -----------------------------------------
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($p in @("$env:LOCALAPPDATA\Docker\run", "$env:LOCALAPPDATA\docker-secrets-engine")) {
  if (Test-Path $p) {
    try { Move-Item $p "$p.broken-$stamp" -Force; Log "отодвинул $p" }
    catch { Log "не смог отодвинуть $p — пропускаю ($($_.Exception.Message))" }
  }
}

# 4) запустить Docker и дождаться демона -------------------------------------
Log "Запускаю Docker Desktop..."
Start-Process $dockerExe
$up = $false
for ($i = 1; $i -le 40; $i++) {
  docker info *> $null
  if ($LASTEXITCODE -eq 0) { $up = $true; Log "демон поднялся (~$($i*5)s)"; break }
  Start-Sleep -Seconds 5
}
if (-not $up) {
  Write-Host "[fix-docker] Демон не поднялся за ~200s. Если снова краш-диалог — жми Quit и перезапусти скрипт." -ForegroundColor Red
  exit 1
}

# 5) поднять инфру artshop ---------------------------------------------------
Log "Поднимаю инфру (postgres/redis/minio)..."
Push-Location $repo
try {
  docker compose up -d
  docker compose ps --format "table {{.Service}}`t{{.Status}}"
} finally { Pop-Location }

Write-Host "[fix-docker] Готово. Дальше: pnpm dev в apps/api, apps/web, apps/admin (или scripts\start.ps1)." -ForegroundColor Green
