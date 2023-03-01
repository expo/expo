#!/usr/bin/env bash

set -eox pipefail

if [[ "$EAS_BUILD_PROFILE" != "updates_testing" ]]; then
  exit
fi

ANDROID_EMULATOR=pixel_4

#export UPDATES_HOST=$(ifconfig -l | xargs -n1 ipconfig getifaddr)
export UPDATES_HOST=localhost
export UPDATES_PORT=4747
export PROJECT_ROOT=$PWD

export EX_UPDATES_NATIVE_DEBUG=1
export NO_FLIPPER=1

mkdir ./logs

yarn generate-test-update-bundles

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

  sleep 10

  # Ensure emulator can reach the local updates server
  adb reverse tcp:4747 tcp:4747
fi

# Execute tests
detox test --configuration $EAS_BUILD_PLATFORM.debug 2>&1 | tee ./logs/detox-tests.log

export DETOX_EXIT_CODE=$?

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  # Kill emulator
  adb emu kill &
fi

# Attempt to handle exit codes correctly (handle Android emulator occasional crashes gracefully)
if [ $DETOX_EXIT_CODE -eq 0 ]
then
  echo "Tests were successful"
  exit 0
else
  echo "Tests failed" >&2
  exit 1
fi

