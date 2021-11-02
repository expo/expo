#!/bin/bash

# TODO: remove once we're confident about dropping SDK 42 support
REACT_NATIVE_VERSION=$(node --print "require('react-native/package.json').version")
if ! [[ "$REACT_NATIVE_VERSION" =~ ^0\.63\.[0-9]+$ ]]; then
  echo -e "\033[1;33mWarning: bundles made with this version of React Native ($REACT_NATIVE_VERSION) will not work in SDK 42.\033[0m"
fi

# iOS

npx react-native bundle \
    --platform ios \
    --dev false \
    --entry-file index.js \
    --bundle-output ios/main.jsbundle \
    --assets-dest ios

# Android

npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/src/debug/assets/expo_dev_launcher_android.bundle \
    --assets-dest android/src/debug/res



