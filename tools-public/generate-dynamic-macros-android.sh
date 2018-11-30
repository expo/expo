#!/usr/bin/env bash

# This file is currently used by https://github.com/expo/expo-cli/blob/master/packages/xdl/src/detach/AndroidShellApp.js

set -eo pipefail

scriptdir=$(dirname ${BASH_SOURCE[0]})

$scriptdir/generate-dynamic-macros-cli.js --platform android \
  --buildConstantsPath $scriptdir/../expoview/src/main/java/host/exp/exponent/generated/ExponentBuildConstants.java
