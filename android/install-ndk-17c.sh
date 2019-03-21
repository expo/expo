#!/usr/bin/env bash
set -euo pipefail

scriptdir="$(dirname ${BASH_SOURCE[0]})"
shellnix="$scriptdir/shell.nix"

ndk=${1:-$(nix eval --file "$shellnix" --raw ndk)}

mkdir -p "$(dirname $ANDROID_NDK_ROOT)" # Create full path if necessary

# Replace any existing link or directory with link
rm -rf "$ANDROID_NDK_ROOT"
ln -sn "$ndk" "$ANDROID_NDK_ROOT"
