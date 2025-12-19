#!/bin/bash

# Ensure we're in the right directory
cd "$(dirname "$0")" || exit 1

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Accept 1 or 0 as parameter (default to 0)
EXPO_USE_PRECOMPILED_MODULES=${1:-0}

if [ "$EXPO_USE_PRECOMPILED_MODULES" = "1" ]; then
  echo "Building with Precompiled Pods"
else
  echo "Building with Regular Pods"
fi

echo "Cleaning Pods directory..."
rm -rf Pods

echo "Running pod install..."
EXPO_USE_PRECOMPILED_MODULES=$EXPO_USE_PRECOMPILED_MODULES RCT_USE_RN_DEP=1 RCT_USE_PREBUILT_RNCORE=1 RCT_TESTONLY_RNCORE_TARBALL_PATH="$SCRIPT_DIR/../../../node_modules/react-native/.build/output/xcframeworks/Debug/React.xcframework.tar.gz" bundle exec pod install