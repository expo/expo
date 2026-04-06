#!/usr/bin/env bash
set -euo pipefail

VALE_VERSION="3.14.1"

# Resolve docs/ root regardless of where the script is invoked from
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INSTALL_DIR="$DOCS_ROOT/.vale/bin"
VALE_BIN="$INSTALL_DIR/vale"

# Skip download if correct version is already installed
if [[ -x "$VALE_BIN" ]] && "$VALE_BIN" --version 2>/dev/null | grep -q "$VALE_VERSION"; then
  echo "Vale $VALE_VERSION is already installed."
  exit 0
fi

OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}_${ARCH}" in
  Darwin_arm64)  PLATFORM="macOS_arm64"   ;;
  Darwin_x86_64) PLATFORM="macOS_64-bit"  ;;
  Linux_x86_64)  PLATFORM="Linux_64-bit"  ;;
  Linux_aarch64) PLATFORM="Linux_arm64"   ;;
  *)
    echo "Unsupported platform: ${OS} ${ARCH}" >&2
    exit 1
    ;;
esac

URL="https://github.com/vale-cli/vale/releases/download/v${VALE_VERSION}/vale_${VALE_VERSION}_${PLATFORM}.tar.gz"

echo "Downloading Vale ${VALE_VERSION} for ${PLATFORM}..."
mkdir -p "$INSTALL_DIR"
curl -fsSL "$URL" | tar -xz -C "$INSTALL_DIR" vale
chmod +x "$VALE_BIN"
echo "Vale ${VALE_VERSION} installed to ${VALE_BIN}"
