#!/bin/bash
# ./gradlew :app:connectedDevMinSdkDevKernelDebugAndroidTest runs test differently than Android Studio.
# This script runs the same commands as Android Studio and seems to behave more predictably.

adb uninstall host.exp.exponent.test
# Clear logs
adb logcat -c

./gradlew :app:assembleDevMinSdkDevKernelDebugAndroidTest

adb push app/build/outputs/apk/androidTest/devMinSdkDevKernel/debug/app-devMinSdk-devKernel-debug-androidTest.apk /data/local/tmp/host.exp.exponent.test
adb shell pm install -r "/data/local/tmp/host.exp.exponent.test"

adb shell pm revoke "host.exp.exponent" android.permission.READ_CONTACTS
adb shell pm revoke "host.exp.exponent" android.permission.READ_EXTERNAL_STORAGE
adb shell pm revoke "host.exp.exponent" android.permission.WRITE_EXTERNAL_STORAGE
adb shell pm revoke "host.exp.exponent" android.permission.CAMERA
adb shell pm revoke "host.exp.exponent" android.permission.ACCESS_COARSE_LOCATION
adb shell pm revoke "host.exp.exponent" android.permission.ACCESS_FINE_LOCATION

# Run the tests and grab the logs even if it fails
adb shell am instrument -w -r -e debug false host.exp.exponent.test/android.support.test.runner.AndroidJUnitRunner
ANDROID_TEST_RESULT=$?
adb logcat -d > logcat.txt && adb logcat -c

exit $ANDROID_TEST_RESULT
