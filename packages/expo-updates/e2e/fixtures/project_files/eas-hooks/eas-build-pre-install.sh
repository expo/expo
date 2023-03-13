#!/usr/bin/env bash

set -eox pipefail

if [[ "$LOCAL_TESTING" == "1" ]]; then
  exit 0
fi

if [[ "$EAS_BUILD_RUNNER" == "eas-build" && "$EAS_BUILD_PROFILE" == "updates_testing" ]]; then
  if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
    sudo apt-get --quiet update --yes

    # Install emulator & video bridge dependencies
    # Source: https://github.com/react-native-community/docker-android/blob/master/Dockerfile
    sudo apt-get --quiet install --yes \
      libc6 \
      libdbus-1-3 \
      libfontconfig1 \
      libgcc1 \
      libpulse0 \
      libtinfo5 \
      libx11-6 \
      libxcb1 \
      libxdamage1 \
      libnss3 \
      libxcomposite1 \
      libxcursor1 \
      libxi6 \
      libxext6 \
      libxfixes3 \
      zlib1g \
      libgl1 \
      pulseaudio \
      socat

    # Emulator must be API 31 -- API 32 and 33 fail due to https://github.com/wix/Detox/issues/3762
    sdkmanager --install "system-images;android-31;google_apis;x86_64"
    avdmanager --verbose create avd --force --name "pixel_4" --device "pixel_4" --package "system-images;android-31;google_apis;x86_64"
  else
    brew tap wix/brew
    brew install applesimutils
  fi
fi
