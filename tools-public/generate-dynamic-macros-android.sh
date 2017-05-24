#!/bin/bash

# This is used by android-shell-app.js
set -eo pipefail

if [ -f ~/.bash_profile ]; then
  source ~/.bash_profile >/dev/null 2>/dev/null
fi

pushd ../../tools-public/
mkdir -p ../android/expoview/src/main/java/host/exp/exponent/generated/

gulp generate-dynamic-macros --buildConstantsPath ../android/expoview/src/main/java/host/exp/exponent/generated/ExponentBuildConstants.java --platform android
popd
