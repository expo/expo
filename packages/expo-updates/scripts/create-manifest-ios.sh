#!/usr/bin/env bash

set -eo pipefail

if [[ "$SKIP_BUNDLING" ]]; then
  echo "SKIP_BUNDLING enabled; skipping create-manifest-ios.sh."
  exit 0;
elif [[ "$CONFIGURATION" == *Debug* ]]; then
  if [[ "$FORCE_BUNDLING" ]]; then
    echo "FORCE_BUNDLING enabled; continuing create-manifest-ios.sh."
  else
    exit 0;
  fi
fi

# ref: https://github.com/facebook/react-native/blob/c974cbff04a8d90ac0f856dbada3fc5a75c75b49/scripts/react-native-xcode.sh#L59-L65
EXPO_UPDATES_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# Suppress environment errors from sourcing the login scripts
set +e
source "$EXPO_UPDATES_PACKAGE_DIR/scripts/source-login-scripts.sh"
set -e

DEST="$CONFIGURATION_BUILD_DIR"
RESOURCE_BUNDLE_NAME="EXUpdates.bundle"
ENTRY_FILE=${ENTRY_FILE:-index.js}
RCT_METRO_PORT=${RCT_METRO_PORT:=8081}
NODE_BINARY=${NODE_BINARY:-node}

if ! [ -x "$(command -v "$NODE_BINARY")" ]; then
  echo 'Error: cannot find the node binary. Try setting the NODE_BINARY variable in the ' \
  '"Bundle React Native code and images" Build Phase to the absolute path to your node binary. ' \
  'You can find it by executing "which node" in a terminal window.' >&2
  exit 1
fi

# For classic main project build phases integration, will be no-op to prevent duplicated app.manifest creation.
#
# `$PROJECT_DIR` is passed by Xcode as the directory to the xcodeproj file.
# in classic main project setup it is something like /path/to/app/ios
# in new style pod project setup it is something like /path/to/app/ios/Pods
PROJECT_DIR_BASENAME=$(basename $PROJECT_DIR)
if [ "x$PROJECT_DIR_BASENAME" != "xPods" ]; then
  exit 0
fi

# If PROJECT_ROOT is not specified, fallback to use Xcode PROJECT_DIR
PROJECT_ROOT=${PROJECT_ROOT:-"$PROJECT_DIR/../.."}
PROJECT_ROOT=${PROJECT_ROOT:-"$EXPO_UPDATES_PACKAGE_DIR/../.."}

cd "$PROJECT_ROOT" || exit
# We should get the physical path (/var/folders -> /private/var/folders) for metro to resolve correct files
PROJECT_ROOT="$(pwd -P)"

"$NODE_BINARY" "${EXPO_UPDATES_PACKAGE_DIR}/scripts/createManifest.js" ios "$PROJECT_ROOT" "$DEST/$RESOURCE_BUNDLE_NAME" "$ENTRY_FILE"
