#!/usr/bin/env bash

ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$ANDROID_HOME}
PACKAGE_NAME="host.exp.exponent.brownfieldtest.android"

PROJECT_DIR=$1
cd $PROJECT_DIR/android

./gradlew clean
./gradlew installRelease --refresh-dependencies 

$ANDROID_SDK_ROOT/platform-tools/adb shell monkey -p $PACKAGE_NAME 1

echo " ✅ App installed and started"
