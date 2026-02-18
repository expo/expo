#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ARCH="arm64"
BUNDLE_ID="dev.expo.BrownfieldIntegratedTester"
CONFIGURATION="Release"
DERIVED_DATA_PATH="build"
DEVICE_ID=$1
PROJECT="BrownfieldIntegratedTester.xcodeproj"
SCHEME="BrownfieldIntegratedTester"
SDK="iphonesimulator"

cd $GITHUB_WORKSPACE/apps/brownfield-tester/ios-integrated
xcodebuild build \
  -project $PROJECT \
  -scheme $SCHEME \
  -configuration $CONFIGURATION \
  -sdk $SDK \
  -arch $ARCH \
  -derivedDataPath $DERIVED_DATA_PATH

APP_BINARY_PATH=build/Build/Products/Release-iphonesimulator/BrownfieldIntegratedTester.app
echo " 🔌 Installing UIKit App - deviceId[${DEVICE_ID}] appBinaryPath[${APP_BINARY_PATH}]"
xcrun simctl install $DEVICE_ID $APP_BINARY_PATH
xcrun simctl launch $DEVICE_ID $BUNDLE_ID

if [[ $? -ne 0 ]]; then
    echo " ❌ Failed to launch app on device $DEVICE_ID"
    exit 1
fi

echo " ✅ app installed and launched on device $DEVICE_ID"
