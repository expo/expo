#!/bin/bash


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



