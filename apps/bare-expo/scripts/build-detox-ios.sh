#!/usr/bin/env bash
# This script is design to wrap the xcodebuild command
# and exit with non-zero if the build fails. 
#
# This ensures that CI fails on the correct step 
# instead of attempting to run Detox tests without a build.

set -e

# Debug or Release
configuration=$1
# YES or NO
UseModernBuildSystem=${2:-"NO"}

xcodebuild \
    -workspace ios/BareExpo.xcworkspace \
    -scheme BareExpo \
    -configuration $configuration \
    -sdk iphonesimulator \
    -derivedDataPath "ios/build" \
    -UseModernBuildSystem=$UseModernBuildSystem 2>&1 | tee result.txt | xcpretty -k

if ! grep '\*\* BUILD SUCCEEDED \*\*' result.txt; then
    echo 'Build Failed'
    # cat result.txt | xcpretty -k
    rm result.txt
    set +e
    exit 1
fi
rm result.txt

echo 'Build Succeeded'
