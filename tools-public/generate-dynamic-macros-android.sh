#!/bin/bash

set -eo pipefail

if [ -f ~/.bash_profile ]; then
  source ~/.bash_profile >/dev/null 2>/dev/null
fi

mkdir -p src/main/java/host/exp/exponent/generated/
pushd ../../tools-public/
gulp generate-dynamic-macros --buildConstantsPath ../android/app/src/main/java/host/exp/exponent/generated/ExponentBuildConstants.java --platform android
popd
