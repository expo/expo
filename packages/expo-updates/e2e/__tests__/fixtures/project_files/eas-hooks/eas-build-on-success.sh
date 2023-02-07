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
fi

# Basic tests
detox test --configuration $EAS_BUILD_PLATFORM.debug --headless 2>&1 | tee ./logs/detox-tests-basic.log

# -- Remove old files and directories
rm -rf .detoxrc.json .expo .git .gitignore App.js android app.json assets babel.config.js certs dependencies e2e eas-hooks eas.json index.js ios keys metro.config.js node_modules package.json updates

# -- Unpack files from assets test app
tar zxf ./updates-e2e-assets.tar.gz

# -- NPM install, pod install, build
yarn
if [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  npx pod-install
fi
detox build --configuration $EAS_BUILD_PLATFORM.release

# -- Execute Detox assets tests
detox test --configuration $EAS_BUILD_PLATFORM.release --headless 2>&1 | tee ./logs/detox-tests-assets.log


if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  # Kill emulator
  adb emu kill
fi
