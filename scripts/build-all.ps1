<#
.SYNOPSIS
    Build MauriMesh 5.2 with full verification
#>

param(
    [ValidateSet("debug", "release")]
    [string]$Mode = "release",
    [switch]$SkipAudit
)

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$RustDir = Join-Path $ProjectRoot "rust"

Write-Host "🛠️  MauriMesh 5.2 Build" -ForegroundColor Cyan
Write-Host "Mode: $Mode`n"

# Rust Build
Write-Host "[1/3] Compiling Rust Core..." -NoNewline
Set-Location $RustDir
$features = if ($Mode -eq "release") { "--release" } else { "" }
cargo build $features --lib --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌" -ForegroundColor Red
    exit 1
}
Write-Host " ✅" -ForegroundColor Green

# UniFFI Bindings
Write-Host "[2/3] Generating TypeScript Bindings..." -NoNewline
uniffi-bindgen generate src/lib.rs --language typescript --out-dir "../src/lib/" --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  (Using stub)" -ForegroundColor Yellow
} else {
    Write-Host " ✅" -ForegroundColor Green
}

# Cultural Audit
if (!$SkipAudit) {
    Write-Host "[3/3] Auditing Cultural Boundary..."
    & "$PSScriptRoot\audit-isolation.ps1"
    if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
    Write-Host "[3/3] Skipping audit (--SkipAudit)" -ForegroundColor Yellow
}

Write-Host "`n✅ Build Complete!" -ForegroundColor Green
Write-Host "📱 Run: npx expo start" -ForegroundColor Cyan
