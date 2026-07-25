# Запуск всего artshop одной командой.
#   правый клик по start.ps1 -> "Выполнить с помощью PowerShell"
#   или в терминале: powershell -ExecutionPolicy Bypass -File scripts\start.ps1
#
# Скрипт сам: чистит залипшие сокеты Docker, поднимает движок, стартует
# контейнеры (postgres/redis/minio), api, worker и web, ждёт готовности
# и открывает сайт в браузере.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# --- 1. Docker ---
Step "Проверяю Docker"
$engineUp = $false
try { if (& $docker version --format "{{.Server.Version}}" 2>$null) { $engineUp = $true } } catch {}

if (-not $engineUp) {
  Step "Docker не отвечает — чищу залипшие сокеты и запускаю"
  Get-Process | Where-Object { $_.ProcessName -like '*docker*' } | Stop-Process -Force -EA SilentlyContinue
  Start-Sleep 2
  foreach ($dir in @("$env:LOCALAPPDATA\Docker\run", "$env:LOCALAPPDATA\docker-secrets-engine")) {
    if (Test-Path $dir) { try { Rename-Item $dir "$dir.old-$(Get-Random)" -Force -EA Stop } catch {} }
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

  Write-Host "Жду движок" -NoNewline
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep 5
    Write-Host "." -NoNewline
    try { if (& $docker version --format "{{.Server.Version}}" 2>$null) { $engineUp = $true; break } } catch {}
  }
  Write-Host ""
  if (-not $engineUp) { throw "Docker не поднялся за 3 минуты. Открой Docker Desktop вручную и запусти скрипт снова." }
}
Write-Host "Docker работает" -ForegroundColor Green

# --- 2. Контейнеры ---
Step "Поднимаю контейнеры (postgres, redis, minio)"
Push-Location $root
& $docker compose up -d | Out-Null
# ждём здоровья postgres
for ($i = 0; $i -lt 20; $i++) {
  $st = & $docker inspect --format "{{.State.Health.Status}}" artshop-postgres 2>$null
  if ($st -eq 'healthy') { break }
  Start-Sleep 2
}
Write-Host "Контейнеры готовы" -ForegroundColor Green

# --- 3. Миграции (на случай свежей БД) ---
Step "Применяю миграции"
Push-Location "$root\packages\db"
$env:DATABASE_URL = "postgres://artshop:artshop@localhost:5433/artshop"
npx tsx src/migrate.ts
Pop-Location

# --- 4. Сервисы ---
Step "Собираю и запускаю api / worker / web"
Push-Location $root
pnpm --filter @artshop/shared build | Out-Null
pnpm --filter @artshop/db build | Out-Null

$envVars = @{
  DATABASE_URL   = "postgres://artshop:artshop@localhost:5433/artshop"
  REDIS_URL      = "redis://localhost:6380"
  S3_ENDPOINT    = "http://localhost:9000"
  S3_PUBLIC_URL  = "http://localhost:9000/artshop-media"
  JWT_SECRET     = "local-dev-secret-not-for-production-use"
  WEB_ORIGIN     = "http://localhost:3000"
}
foreach ($k in $envVars.Keys) { Set-Item "env:$k" $envVars[$k] }

# каждый сервис — в своём окне, чтобы видеть логи и легко закрыть
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\apps\api'; `$env:API_PORT=3011; pnpm dev"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\apps\worker'; `$env:WORKER_PORT=3013; pnpm dev"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\apps\web'; pnpm dev"
Pop-Location

# --- 5. Ждём и открываем ---
Step "Жду, пока сайт ответит"
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep 3
  try {
    $r = Invoke-WebRequest "http://localhost:3000/works" -UseBasicParsing -TimeoutSec 5 -EA Stop
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
}

if ($ready) {
  Write-Host "`nГотово! Открываю сайт" -ForegroundColor Green
  Start-Process "http://localhost:3000"
  Write-Host @"

  Сайт:    http://localhost:3000
  Админка: http://localhost:3002/login
           admin@artshop.local / SuperSecret123

  Сервисы работают в отдельных окнах PowerShell.
  Чтобы остановить всё — закрой эти окна.
"@ -ForegroundColor Yellow
} else {
  Write-Host "`nСайт пока не ответил. Проверь окна сервисов на ошибки." -ForegroundColor Red
}
