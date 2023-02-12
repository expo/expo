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

EXPO_UPDATES_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

DEST="$CONFIGURATION_BUILD_DIR"
RESOURCE_BUNDLE_NAME="EXUpdates.bundle"
RCT_METRO_PORT=${RCT_METRO_PORT:=8081}

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

"${EXPO_UPDATES_PACKAGE_DIR}/scripts/with-node.sh" "${EXPO_UPDATES_PACKAGE_DIR}/scripts/createManifest.js" ios "$PROJECT_ROOT" "$DEST/$RESOURCE_BUNDLE_NAME" "$ENTRY_FILE"
