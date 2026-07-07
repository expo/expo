#!/bin/bash

# Removes the package's local build caches and artifacts
# (everything gitignored under apple/).

set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BLUE=""; RESET=""
if [ -t 1 ]; then
  BLUE="\033[34m"
  RESET="\033[0m"
fi
echo -e "${BLUE}[Expo]${RESET} Clearing ExpoModulesJSI caches and build artifacts"

# Capital X on purpose: remove ignored files only, keep untracked files.
git -C "${PACKAGE_DIR}" clean -fdX .
