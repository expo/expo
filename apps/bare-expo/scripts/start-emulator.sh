#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

$DIR/setup-project.sh

if ! $ANDROID_HOME/tools/android list avd | grep -q bare-expo; then
    echo " ⚠️  No emulator for bare expo found, creating one..."
    $DIR/create-emulator.sh 22
fi

if $ANDROID_HOME/platform-tools/adb devices -l | grep -q emulator; then
    echo " ✅ Emulator is already running"
else
    echo " ⚠️  Starting emulator..."
    echo "no" | $ANDROID_HOME/emulator/emulator "-avd" "bare-expo" "-skin" "480x800" "-no-audio" "-no-boot-anim" "-port" "5554" "-no-snapshot" "-partition-size" "1024" &

    $DIR/wait_for_emulator.sh
    sleep 30

    $ANDROID_HOME/platform-tools/adb wait-for-device
    $ANDROID_HOME/platform-tools/adb shell settings put global window_animation_scale 0
    $ANDROID_HOME/platform-tools/adb shell settings put global transition_animation_scale 0
    $ANDROID_HOME/platform-tools/adb shell settings put global animator_duration_scale 0
    $ANDROID_HOME/platform-tools/adb shell am broadcast -a android.intent.action.BOOT_COMPLETED &

    sleep 5
    echo " ✅ Emulator is running"
fi


$DIR/start-metro.sh $port

echo " ☛  Running the Android project..."
# Build and run the Android project using `react-native run-android`
node "node_modules/react-native/cli.js" run-android --no-packager --port ${port}
