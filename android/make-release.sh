#!/usr/bin/env bash
set -euo pipefail

echo $ANDROID_KEYSTORE_B64 | base64 -d > app/release-key.jks

./build.sh Release
