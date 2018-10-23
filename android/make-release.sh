#!/usr/bin/env bash
set -euo pipefail

../tools-public/generate-dynamic-macros-android.sh

./gradlew --stacktrace :app:preBuild

./gradlew --stacktrace :app:assembleProdMinSdkProdKernelRelease

zipalign -f -v -p 4 app/build/outputs/apk/prodMinSdkProdKernel/release/app-prodMinSdk-prodKernel-release-unsigned.apk app-prod-release-unsigned-aligned.apk

apksigner sign \
  --ks <(echo $ANDROID_KEYSTORE_B64 | base64 -d) \
  --ks-key-alias $ANDROID_KEY_ALIAS --ks-pass env:ANDROID_KEYSTORE_PASSWORD \
  --key-pass env:ANDROID_KEY_PASSWORD \
  --out exponent-release.apk app-prod-release-unsigned-aligned.apk
