#!/usr/bin/env bash

port=${2:-8081}

CURRENT_ENV=${NODE_ENV:-"development"}
ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$ANDROID_HOME}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo " ☛  Bootstrapping Expo in ${CURRENT_ENV} mode"

"$DIR/setup-android-project.sh"

if ! $ANDROID_SDK_ROOT/tools/android list avd | grep -q bare-expo; then
    echo " ⚠️  No emulator for bare Expo found, creating one..."
    $DIR/create-emulator.sh 34
fi

if $ANDROID_SDK_ROOT/platform-tools/adb devices -l | grep -q emulator; then
    echo " ✅ Emulator is already running"
else
    echo " ⚠️  Starting emulator..."
    echo "no" | $ANDROID_SDK_ROOT/emulator/emulator "-avd" "bare-expo" "-no-audio" "-no-boot-anim" "-port" "5554" "-no-snapshot" "-partition-size" "1024" &

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

if [ "${CURRENT_ENV}" = "test" ]; then

    if [ -f "android/app/build/outputs/apk/release/app-release.apk" && -f "android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk" ]; then
        echo " ✅ Project is built for Android"
    else
        echo " ⚠️  Building the project..."
        pushd android
        ./gradlew -DtestBuildType=release :app:assembleRelease :app:assembleAndroidTest
        popd
    fi

    echo " ☛  Starting E2E tests"
    # Run our default E2E tests
    "${DIR}/start-android-e2e-test.sh"
else
    echo " ☛  Running the Android project..."
    npx expo run:android --port "${port}"
fi
