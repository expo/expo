#!/bin/bash
# ./gradlew :app:connectedDevMinSdkDevKernelDebugAndroidTest runs test differently than Android Studio.
# This script runs the same commands as Android Studio and seems to behave more predictably.

adb uninstall host.exp.exponent
adb uninstall host.exp.exponent.test
# Clear logs
adb logcat -c

./gradlew :app:assembleDevMinSdkDevKernelDebug :app:assembleDevMinSdkDevKernelDebugAndroidTest

adb push app/build/outputs/apk/devMinSdkDevKernel/debug/app-devMinSdk-devKernel-debug.apk /data/local/tmp/host.exp.exponent
adb shell pm install -r "/data/local/tmp/host.exp.exponent"

adb push app/build/outputs/apk/androidTest/devMinSdkDevKernel/debug/app-devMinSdk-devKernel-debug-androidTest.apk /data/local/tmp/host.exp.exponent.test
adb shell pm install -r "/data/local/tmp/host.exp.exponent.test"

# Run the tests and grab the logs even if it fails
adb shell am instrument -w -r -e debug false host.exp.exponent.test/android.support.test.runner.AndroidJUnitRunner
ANDROID_TEST_RESULT=$?
adb logcat -d > logcat.txt && adb logcat -c

exit $ANDROID_TEST_RESULT
