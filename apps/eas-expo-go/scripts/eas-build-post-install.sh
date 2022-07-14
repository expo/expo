#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"

mkdir -p ~/.config/direnv
cat << EOF > ~/.config/direnv/direnv.toml
[whitelist]
prefix = [ "/" ]
EOF

ensure_prebuilt_heremes() {
  ANDROID_DIR="$ROOT_DIR/android"
  CURRENT_VERSION=$(test -f $ANDROID_DIR/ReactAndroid/prebuiltHermes/.hermesversion && cat $ANDROID_DIR/ReactAndroid/prebuiltHermes/.hermesversion) || true
  TARGET_VERSION=$(test -f $ANDROID_DIR/sdks/.hermesversion && cat $ANDROID_DIR/sdks/.hermesversion) || true
  if [[ $CURRENT_VERSION != $TARGET_VERSION ]]; then 
    pushd $ANDROID_DIR
    rm -rf $ANDROID_DIR/ReactAndroid/prebuiltHermes
    mkdir -p $ANDROID_DIR/ReactAndroid/prebuiltHermes
    cp -f $ANDROID_DIR/sdks/.hermesversion $ANDROID_DIR/ReactAndroid/prebuiltHermes/
    ./gradlew :ReactAndroid:hermes-engine:assembleRelease
    ./gradlew :ReactAndroid:hermes-engine:assembleDebug
    cp -f $ANDROID_DIR/ReactAndroid/hermes-engine/build/outputs/aar/hermes-engine-release.aar $ANDROID_DIR/ReactAndroid/prebuiltHermes/
    cp -f $ANDROID_DIR/ReactAndroid/hermes-engine/build/outputs/aar/hermes-engine-debug.aar $ANDROID_DIR/ReactAndroid/prebuiltHermes/
    popd
  fi
}

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  direnv exec . et ios-generate-dynamic-macros
elif [ "$EAS_BUILD_PLATFORM" = "android" ]; then
  ensure_prebuilt_heremes
fi

if [ "$EAS_BUILD_PROFILE" = "versioned-client-add-sdk" ]; then
  direnv exec . et add-sdk --platform android --sdkVersion 46.0.0
fi
