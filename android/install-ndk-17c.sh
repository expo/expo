#!/usr/bin/env bash
set -euo pipefail

scriptdir="$(dirname ${BASH_SOURCE[0]})"
shellnix="$scriptdir/shell.nix"

ndkPkg=${1:-$(nix-build "$shellnix" -A ndk --no-out-link)}
ndkRoot=${2:-$(nix eval --file "$shellnix" --raw ndkRoot)}

mkdir -p "$(dirname $ANDROID_NDK_ROOT)" # Create full path if necessary

# Replace any existing link or directory with link
rm -rf "$ANDROID_NDK_ROOT"
ln -sn "$ndkRoot" "$ANDROID_NDK_ROOT"
