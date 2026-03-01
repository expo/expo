# scripts/automation/setup.ps1
# Automates EAS build setup: installs eas-cli and triggers builds for Android and all platforms.

param(
    [ValidateSet("android", "ios", "all")]
    [string]$Platform = "all"
)

# Verify Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js from https://nodejs.org/ and try again."
    exit 1
}

# Verify npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH. Please install Node.js (which includes npm) from https://nodejs.org/ and try again."
    exit 1
}

Write-Host "Installing EAS CLI globally..." -ForegroundColor Cyan
npm install -g eas-cli
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install eas-cli. Check your npm configuration and try again."
    exit 1
}

Write-Host "EAS CLI installed successfully." -ForegroundColor Green

# Trigger EAS build
Write-Host "Starting EAS build for platform: $Platform" -ForegroundColor Cyan
eas build --platform $Platform
if ($LASTEXITCODE -ne 0) {
    Write-Error "EAS build failed for platform '$Platform'."
    exit 1
}

Write-Host "EAS build completed successfully for platform: $Platform" -ForegroundColor Green
