#!/usr/bin/env bash
set -euo pipefail

nix build --file shell.nix ndk --no-link

mkdir -p "$ANDROID_NDK_ROOT" # Create full path if necessary

# Replace any existing link or directory with link
rm -r "$ANDROID_NDK_ROOT"
ln -sn "$(nix eval --file shell.nix --raw ndk_root)" "$ANDROID_NDK_ROOT"
