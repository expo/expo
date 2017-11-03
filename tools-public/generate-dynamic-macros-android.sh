#!/bin/bash

# This is used by android-shell-app.js
set -eo pipefail

# Initialize the shell if we aren't already running in a terminal (initialize just once)
if [[ -z "$TERM" ]] || [[ $TERM == "dumb" ]]; then
  if [ -f /etc/profile ]; then
    source /etc/profile >/dev/null
  fi

  if [ -f ~/.bash_profile ]; then
    source ~/.bash_profile >/dev/null
  fi
fi

pushd ../../tools-public/
mkdir -p ../android/expoview/src/main/java/host/exp/exponent/generated/

gulp generate-dynamic-macros --buildConstantsPath ../android/expoview/src/main/java/host/exp/exponent/generated/ExponentBuildConstants.java --platform android
popd
