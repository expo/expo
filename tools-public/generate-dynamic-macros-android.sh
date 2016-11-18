#!/bin/bash

set -eo pipefail

if [ -f ~/.bash_profile ]; then
  source ~/.bash_profile >/dev/null 2>/dev/null
fi

pushd ../../tools-public/
mkdir -p ../android/exponentview/src/main/java/host/exp/exponent/generated/

npm run gulp -- generate-dynamic-macros --buildConstantsPath ../android/exponentview/src/main/java/host/exp/exponent/generated/ExponentBuildConstants.java --platform android
popd
