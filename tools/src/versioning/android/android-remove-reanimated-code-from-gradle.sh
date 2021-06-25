#!/usr/bin/env bash

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
VERSIONED_ABI_PATH=versioned-abis/expoview-$ABI_VERSION
BUILD_GRADLE_PATH=$EXPO_ROOT_DIR/android/$VERSIONED_ABI_PATH/build.gradle
TOOLS_DIR=`pwd`

# Remove code that builds Reanimated from the new expoview-abiXX_X_X build.gradle
awk '
  /WHEN_PREPARING_REANIMATED_REMOVE_FROM_HERE/ { removing = 1 }
  /WHEN_PREPARING_REANIMATED_REMOVE_TO_HERE/ { stopRemoving = 1 }
  // { if (removing == 0) print $0 }
  // { if (stopRemoving == 1) removing = 0 }
  // { if (removing == 0) stopRemoving = 0 }
' $BUILD_GRADLE_PATH > tmp && mv tmp $BUILD_GRADLE_PATH
