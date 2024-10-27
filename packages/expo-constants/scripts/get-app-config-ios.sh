#!/usr/bin/env bash

set -eo pipefail

DEST="$CONFIGURATION_BUILD_DIR"
RESOURCE_BUNDLE_NAME="EXConstants.bundle"
EXPO_CONSTANTS_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# For classic main project build phases integration, will be no-op to prevent duplicated app.config creation.
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
PROJECT_ROOT=${PROJECT_ROOT:-"$EXPO_CONSTANTS_PACKAGE_DIR/../.."}

cd "$PROJECT_ROOT" || exit

if [ "$BUNDLE_FORMAT" == "shallow" ]; then
  RESOURCE_DEST="$DEST/$RESOURCE_BUNDLE_NAME"
elif [ "$BUNDLE_FORMAT" == "deep" ]; then
  RESOURCE_DEST="$DEST/$RESOURCE_BUNDLE_NAME/Contents/Resources"
  mkdir -p "$RESOURCE_DEST"
else
  echo "Unsupported bundle format: $BUNDLE_FORMAT"
  exit 1
fi

"${EXPO_CONSTANTS_PACKAGE_DIR}/scripts/with-node.sh" "${EXPO_CONSTANTS_PACKAGE_DIR}/scripts/getAppConfig.js" "$PROJECT_ROOT" "$RESOURCE_DEST"
