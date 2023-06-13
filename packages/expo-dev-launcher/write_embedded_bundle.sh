#!/bin/bash

# iOS

export NODE_ENV=production

EXPO_BUNDLE_APP=1 npx react-native bundle \
    --platform ios \
    --dev false \
    --entry-file index.js \
    --bundle-output ios/main.jsbundle \
    --assets-dest ios \
    --reset-cache

rm ios/assets/__react-native-lab/react-native/package.json
rm ios/assets/__node_modules/css-tree/package.json

# Android

EXPO_BUNDLE_APP=1 npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/src/debug/assets/expo_dev_launcher_android.bundle \
    --assets-dest android/src/debug/res \
    --reset-cache
