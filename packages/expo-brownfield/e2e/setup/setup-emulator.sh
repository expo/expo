#!/usr/bin/env bash

ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$ANDROID_HOME}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if ! $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager list | grep -q isolated-brownfield; then
    echo " ⚠️  No emulator for isolated brownfield found, creating one..."
    $DIR/create-emulator.sh 34
fi

if $ANDROID_SDK_ROOT/platform-tools/adb devices -l | grep -q emulator; then
    echo " ✅ Emulator is already running"
else
    echo " ⚠️  Starting emulator..."
    echo "no" | $ANDROID_SDK_ROOT/emulator/emulator "-avd" "isolated-brownfield" "-no-audio" "-no-boot-anim" "-port" "5554" "-no-snapshot" "-partition-size" "1024" &

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

# TODO(pmleczek): Build and install native app consuming the brownfield
