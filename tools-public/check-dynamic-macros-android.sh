#!/usr/bin/env bash

# This file is currently used by https://github.com/expo/expo-cli/blob/master/packages/xdl/src/detach/AndroidShellApp.js
set -eo pipefail

scriptdir=$(dirname ${BASH_SOURCE[0]})

# Initialize the shell if we aren't already running in a terminal (initialize just once)
if [[ -z "$EXPO_SKIP_SOURCING" ]] && ([[ -z "$TERM" ]] || [[ $TERM == "dumb" ]]); then
  if [ -f /etc/profile ]; then
    source /etc/profile >/dev/null
  fi

  if [ -f ~/.bash_profile ]; then
    source ~/.bash_profile >/dev/null
  fi
fi

pushd $scriptdir

function throwIfFileDoesntExist() {
  if [ ! -f "../$1" ]; then
    echo "File $1 not found!" > /dev/stderr
    exit 1
  fi
}

comm -3 <(sort <(awk -F'"' '
  # splits lines on `"` character which lets us detect key and value in:
  #   "fileName": "pathForFile",
  # $1"  $2    "$3"    $4     "$5
  (length($2) > 0) { print $4 }
  # if $5 is empty or equal to "," it is ok,
  # otherwise something is wrong
  (length($5) > 0 && $5 != ",") {
    printf("Failed to naively parse JSON file line %s.\n", $0) > "/dev/stderr"
    exit 1
  }' ../template-files/android-paths.json)) <(sort ../template-files/android-paths.check-ignore) |
while read PATH_TO_CHECK
do
  throwIfFileDoesntExist $PATH_TO_CHECK
done

throwIfFileDoesntExist "android/expoview/src/main/java/host/exp/exponent/generated/ExponentBuildConstants.java"

popd
