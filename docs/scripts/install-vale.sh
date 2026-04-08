#!/usr/bin/env bash
set -euo pipefail

# Resolve docs/ root regardless of where the script is invoked from
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALE_VERSION_FILE="$DOCS_ROOT/.vale-version"

if [[ ! -f "$VALE_VERSION_FILE" ]]; then
  echo "Vale version file not found: $VALE_VERSION_FILE" >&2
  exit 1
fi

VALE_VERSION="$(tr -d '[:space:]' < "$VALE_VERSION_FILE")"

if [[ -z "$VALE_VERSION" ]]; then
  echo "Vale version file is empty: $VALE_VERSION_FILE" >&2
  exit 1
fi

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

TARBALL="vale_${VALE_VERSION}_${PLATFORM}.tar.gz"
URL="https://github.com/vale-cli/vale/releases/download/v${VALE_VERSION}/${TARBALL}"
CHECKSUM_URL="https://github.com/vale-cli/vale/releases/download/v${VALE_VERSION}/vale_${VALE_VERSION}_checksums.txt"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading Vale ${VALE_VERSION} for ${PLATFORM}..."
curl -fsSL "$URL" -o "$TMPDIR/$TARBALL"
curl -fsSL "$CHECKSUM_URL" -o "$TMPDIR/checksums.txt"

# Verify sha256 checksum before extracting
echo "Verifying checksum..."
cd "$TMPDIR"
if ! grep "$TARBALL" checksums.txt | shasum -a 256 --check --status; then
  echo "Checksum verification failed for $TARBALL" >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR"
tar -xzf "$TMPDIR/$TARBALL" -C "$INSTALL_DIR" vale
chmod +x "$VALE_BIN"
echo "Vale ${VALE_VERSION} installed to ${VALE_BIN}"
