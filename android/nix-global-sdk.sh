#!/usr/bin/env bash
set -euo pipefail

nix build -f shell.nix sdk ndk --no-link

libraryPath=~/Library/Android/sdk-nix
mkdir -p $libraryPath

ln -sf $(nix path-info -f shell.nix sdk)/libexec/* $libraryPath

ndkVersion=$(nix eval -f shell.nix ndk.name | sed -e 's/^"//' -e 's/"$//')
ln -snf $(nix path-info -f shell.nix ndk)/libexec/${ndkVersion} $libraryPath/ndk-bundle

echo "Change your sdk path in android studio to $libraryPath"
