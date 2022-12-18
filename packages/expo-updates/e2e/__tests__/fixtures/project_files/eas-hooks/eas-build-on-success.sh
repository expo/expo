#!/usr/bin/env bash

set -eox pipefail

ANDROID_EMULATOR=pixel_4

#export UPDATES_HOST=$(ifconfig -l | xargs -n1 ipconfig getifaddr)
export UPDATES_HOST=localhost
export UPDATES_PORT=4747
export PROJECT_ROOT=$PWD

mkdir ./logs

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  # Start emulator
  $ANDROID_SDK_ROOT/emulator/emulator @$ANDROID_EMULATOR -no-audio -no-boot-anim -no-window -use-system-libs 2>&1 >/dev/null &

  # Wait for emulator
  max_retry=10
  counter=0
  until adb shell getprop sys.boot_completed; do
    sleep 10
    [[ counter -eq $max_retry ]] && echo "Failed to start the emulator!" && exit 1
    counter=$((counter + 1))
  done

  # Ensure emulator can reach the local updates server
  adb reverse tcp:4747 tcp:4747

  if [[ "$EAS_BUILD_PROFILE" == "updates_testing" ]]; then
    detox test --configuration android.release --headless 2>&1 | tee ./logs/detox-tests.log
  fi

  # Kill emulator
  adb emu kill
else
  if [[  "$EAS_BUILD_PROFILE" == "updates_testing" ]]; then
    detox test --configuration ios.release --headless 2>&1 | tee ./logs/detox-tests.log
  fi
fi
