#!/usr/bin/env bash

# TODO(pmleczek): UNhardcode the script

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEVICE_ID=$1

cd $GITHUB_WORKSPACE/apps/brownfield-tester/ios-integrated
xcodebuild build \
  -project BrownfieldIntegratedTester.xcodeproj \
  -scheme BrownfieldIntegratedTester \
  -configuration Release \
  -sdk iphonesimulator \
  -arch arm64 \
  -derivedDataPath build

APP_BINARY_PATH=build/Build/Products/Release-iphonesimulator/BrownfieldIntegratedTester.app
echo " 🔌 Installing UIKit App - deviceId[${DEVICE_ID}] appBinaryPath[${APP_BINARY_PATH}]"
xcrun simctl install $DEVICE_ID $APP_BINARY_PATH
xcrun simctl launch $DEVICE_ID dev.expo.BrownfieldIntegratedTester

if [[ $? -ne 0 ]]; then
    echo " ❌ Failed to launch app on device $DEVICE_ID"
    exit 1
fi

echo " ✅ app installed and launched on device $DEVICE_ID"
