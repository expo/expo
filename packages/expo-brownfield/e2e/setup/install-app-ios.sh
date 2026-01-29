#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR=$1
DEVICE_ID=$2

cd $PROJECT_DIR/uikit
xcodebuild -workspace $PROJECT_DIR/uikit/uikit.xcodeproj/project.xcworkspace -scheme uikit -configuration Release -sdk iphonesimulator -arch arm64 -derivedDataPath $PROJECT_DIR/uikit/build

APP_BINARY_PATH=$PROJECT_DIR/uikit/build/Build/Products/Release-iphonesimulator/uikit.app
echo " 🔌 Installing UIKit App - deviceId[${DEVICE_ID}] appBinaryPath[${APP_BINARY_PATH}]"
xcrun simctl install $DEVICE_ID $APP_BINARY_PATH
xcrun simctl launch $DEVICE_ID host.exp.exponent.brownfieldtest.uikit

if [[ $? -ne 0 ]]; then
    echo " ❌ Failed to launch UIKit app on device $DEVICE_ID"
    exit 1
fi

echo " ✅ UIKit app installed and launched on device $DEVICE_ID"

# TODO(pmleczek): Build and install SwiftUI app