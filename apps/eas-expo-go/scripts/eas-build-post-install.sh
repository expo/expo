#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"
export PATH="$ROOT_DIR/bin:$PATH"

maybe_prebuild_hermes() {
  ANDROID_DIR="$ROOT_DIR/android"
  CURRENT_VERSION=$(test -f $ANDROID_DIR/prebuiltHermes/.hermesversion && cat $ANDROID_DIR/prebuiltHermes/.hermesversion) || true
  TARGET_VERSION=$(test -f $ROOT_DIR/react-native-lab/react-native/sdks/.hermesversion && cat $ROOT_DIR/react-native-lab/react-native/sdks/.hermesversion) || true
  if [[ $CURRENT_VERSION != $TARGET_VERSION ]]; then
    pushd $ANDROID_DIR
    rm -rf $ANDROID_DIR/prebuiltHermes
    mkdir -p $ANDROID_DIR/prebuiltHermes
    cp -f $ROOT_DIR/react-native-lab/react-native/sdks/.hermesversion $ANDROID_DIR/prebuiltHermes/
    ./gradlew :ReactAndroid:hermes-engine:assembleRelease
    ./gradlew :ReactAndroid:hermes-engine:assembleDebug
    cp -f $ROOT_DIR/react-native-lab/react-native/ReactAndroid/hermes-engine/build/outputs/aar/hermes-engine-release.aar $ANDROID_DIR/prebuiltHermes/
    cp -f $ROOT_DIR/react-native-lab/react-native/ReactAndroid/hermes-engine/build/outputs/aar/hermes-engine-debug.aar $ANDROID_DIR/prebuiltHermes/
    popd
  fi
}

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  et ios-generate-dynamic-macros
elif [ "$EAS_BUILD_PLATFORM" = "android" ]; then
  if [ "$EAS_BUILD_PROFILE" != "versioned-client-add-sdk" ]; then
    maybe_prebuild_hermes
  fi
fi

if [ "$EAS_BUILD_PROFILE" = "versioned-client-add-sdk" ]; then
  if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
    pushd ios
    bundle install
    popd
  fi
  et add-sdk --platform $EAS_BUILD_PLATFORM
fi
