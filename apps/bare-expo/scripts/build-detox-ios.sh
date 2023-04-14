#!/usr/bin/env bash

# This script wraps the xcodebuild command and exits with non-zero if the build fails. 
#
# This ensures that CI fails on the correct step instead of attempting to run Detox tests without a
# build.

set -eu

# Debug or Release
configuration=$1
# YES or NO
UseModernBuildSystem=${2:-"NO"}

xcodebuild \
  -workspace ios/BareExpo.xcworkspace \
  -scheme BareExpoDetox \
  -configuration "$configuration" \
  -sdk iphonesimulator \
  -arch x86_64 \
  -derivedDataPath "ios/build" \
  -UseModernBuildSystem="$UseModernBuildSystem" 2>&1 | yarn excpretty

if [ "${PIPESTATUS[0]}" -ne "0" ]; then
  echo 'Build Failed'
  set +e
  exit 1
fi

echo 'Build Succeeded'
