#!/usr/bin/env bash

function cleanup()
{
  echo 'Cleaning up...'
  if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
    # Kill emulator
    adb emu kill &
  fi
}

# Fail if anything errors
set -eox pipefail
# If this script exits, trap it first and clean up the emulator
trap cleanup EXIT

if [[ "$EAS_BUILD_PROFILE" != "updates_testing_debug" && "$EAS_BUILD_PROFILE" != "updates_testing_release" ]]; then
  exit 0
fi

if [[ "$TEST_TV_BUILD" == "1" ]]; then
  mkdir ./logs
  echo "TV built successfully" > ./logs/detox-tests.log
  exit 0
fi

ANDROID_EMULATOR=pixel_4

#export UPDATES_HOST=$(ifconfig -l | xargs -n1 ipconfig getifaddr)
export UPDATES_HOST=localhost
export UPDATES_PORT=4747
export PROJECT_ROOT=$PWD

export EX_UPDATES_NATIVE_DEBUG=1
export NO_FLIPPER=1

mkdir ./logs

# Unpack keys
if [ -f "keys.tar" ]; then
  tar xf keys.tar
fi

# Generate test bundles
yarn generate-test-update-bundles $EAS_BUILD_PLATFORM

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  # Start emulator
  if [[ "$LOCAL_TESTING" == "1" ]]; then
    $ANDROID_SDK_ROOT/emulator/emulator @$ANDROID_EMULATOR -no-audio -no-boot-anim 2>&1 >/dev/null &
  else
    $ANDROID_SDK_ROOT/emulator/emulator @$ANDROID_EMULATOR -no-audio -no-boot-anim -no-window -use-system-libs 2>&1 >/dev/null &
  fi

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

  # Execute Android tests
  if [[ "$EAS_BUILD_PROFILE" == "updates_testing_debug" ]]; then
    detox test --configuration android.debug 2>&1 | tee ./logs/detox-tests.log
  else
    detox test --configuration android.release 2>&1 | tee ./logs/detox-tests.log
  fi
else
  # Execute iOS tests
  if [[ "$EAS_BUILD_PROFILE" == "updates_testing_debug" ]]; then
    detox test --configuration ios.debug 2>&1 | tee ./logs/detox-tests.log
  else
    detox test --configuration ios.release 2>&1 | tee ./logs/detox-tests.log
  fi
fi


