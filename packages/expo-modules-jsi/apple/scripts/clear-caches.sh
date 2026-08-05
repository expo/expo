#!/bin/bash

# Removes the package's local build caches and artifacts.

set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "${PACKAGE_DIR}/scripts/xcframework-helpers.sh"

BLUE=""; RESET=""
if [ -t 1 ]; then
  BLUE="\033[34m"
  RESET="\033[0m"
fi
echo -e "${BLUE}[Expo]${RESET} Clearing ExpoModulesJSI caches and build artifacts"

clean_xcframework_state "$PACKAGE_DIR"
safe_remove_dirs \
  "${PACKAGE_DIR}/.generated" \
  "${PACKAGE_DIR}/.xcframework-slices" \
  "${PACKAGE_DIR}/.test-frameworks"
