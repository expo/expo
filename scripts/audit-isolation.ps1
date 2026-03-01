<#
.SYNOPSIS
    Audit MauriMesh cultural boundary enforcement
.DESCRIPTION
    Verifies Māori terms ONLY appear in allowed Rust core files.
#>

param([switch]$Quiet)

$allowedFile = "$PSScriptRoot\..\.maurimesh\allowed-maori-terms.txt"
$allowed = Get-Content $allowedFile | Where-Object { $_ -and $_.Trim() -notmatch '^\s*#' } | ForEach-Object { $_.Trim() }

$pattern = '\b(' + ($allowed | ForEach-Object { [regex]::Escape($_) }) -join '|' + ')\b'
$forbiddenZones = @('src/', 'web/', 'scripts/', 'tests/')

$violations = @()

foreach ($zone in $forbiddenZones) {
    $fullPath = Join-Path $PSScriptRoot ".." $zone
    if (Test-Path $fullPath) {
        $files = Get-ChildItem -Path $fullPath -Recurse -Include *.ts,*.tsx,*.js,*.jsx -File
        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw
            if ($content | Select-String -Pattern $pattern -Quiet) {
                $violations += "❌ LEAK: $($file.FullName)"
            }
        }
    }
}

if ($violations.Count -gt 0) {
    if (!$Quiet) {
        Write-Host "`n🚨 CULTURAL BOUNDARY VIOLATIONS:" -ForegroundColor Red
        $violations | ForEach-Object { Write-Host "  $_" }
    }
    exit 1
}

if (!$Quiet) {
    Write-Host "✅ Cultural isolation verified" -ForegroundColor Green
}
exit 0
