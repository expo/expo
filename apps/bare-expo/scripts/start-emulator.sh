#!/usr/bin/env bash

port=${2:-8081}

CURRENT_ENV=${NODE_ENV:-"development"}
ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$ANDROID_HOME}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo " ☛  Bootstrapping Expo in ${CURRENT_ENV} mode"

"$DIR/setup-android-project.sh"

if ! $ANDROID_SDK_ROOT/tools/android list avd | grep -q bare-expo; then
    echo " ⚠️  No emulator for bare Expo found, creating one..."
    $DIR/create-emulator.sh 22
fi

if $ANDROID_SDK_ROOT/platform-tools/adb devices -l | grep -q emulator; then
    echo " ✅ Emulator is already running"
else
    echo " ⚠️  Starting emulator..."
    echo "no" | $ANDROID_SDK_ROOT/emulator/emulator "-avd" "bare-expo" "-skin" "480x800" "-no-audio" "-no-boot-anim" "-port" "5554" "-no-snapshot" "-partition-size" "1024" &

    $DIR/wait-for-emulator.sh
    sleep 30

    $ANDROID_SDK_ROOT/platform-tools/adb wait-for-device
    $ANDROID_SDK_ROOT/platform-tools/adb shell settings put global window_animation_scale 0
    $ANDROID_SDK_ROOT/platform-tools/adb shell settings put global transition_animation_scale 0
    $ANDROID_SDK_ROOT/platform-tools/adb shell settings put global animator_duration_scale 0
    $ANDROID_SDK_ROOT/platform-tools/adb shell am broadcast -a android.intent.action.BOOT_COMPLETED &

    sleep 5
    echo " ✅ Emulator is running"
fi

$DIR/start-metro.sh $port

if [ "${CURRENT_ENV}" = "test" ]; then

    if [ -f "android/app/build/outputs/apk/debug/app-debug-androidTest.apk" ]; then
        echo " ✅ Debug Detox project is built for Android"
    else
        echo " ⚠️  Building the debug Detox project..."
        yarn run android:detox:build:debug
    fi

    echo " ☛  Starting Detox in watch mode"
    # Run our default E2E tests
    yarn run android:detox:test:debug --watch
else
    echo " ☛  Running the Android project..."
    # Build and run the Android project using `react-native run-android`
    node "node_modules/react-native/cli.js" run-android --no-packager --port ${port}
fi
