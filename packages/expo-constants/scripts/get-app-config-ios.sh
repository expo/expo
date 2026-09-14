#!/usr/bin/env bash

set -eo pipefail

# Where resource bundles are assembled. CocoaPods runs this on the pod target,
# where that is CONFIGURATION_BUILD_DIR; SwiftPM has no pod target and runs it on
# the app target, so the caller passes the app's resources directory instead.
DEST="${EXPO_CONSTANTS_APP_CONFIG_DEST:-$CONFIGURATION_BUILD_DIR}"
RESOURCE_BUNDLE_NAME="EXConstants.bundle"
EXPO_CONSTANTS_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# For classic main project build phases integration, will be no-op to prevent duplicated app.config creation.
#
# `$PROJECT_DIR` is passed by Xcode as the directory to the xcodeproj file.
# in classic main project setup it is something like /path/to/app/ios
# in new style pod project setup it is something like /path/to/app/ios/Pods
#
# Under SwiftPM there is no Pods project and exactly one phase is injected, so
# there is nothing to de-duplicate against — EXPO_CONSTANTS_ALLOW_NON_PODS opts
# out of this check.
if [ -z "${EXPO_CONSTANTS_ALLOW_NON_PODS:-}" ]; then
  PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")
  if [ "x$PROJECT_DIR_BASENAME" != "xPods" ]; then
    exit 0
  fi
fi

# If PROJECT_ROOT is not specified, fallback to use Xcode PROJECT_DIR
PROJECT_ROOT=${PROJECT_ROOT:-"$PROJECT_DIR/../.."}
PROJECT_ROOT=${PROJECT_ROOT:-"$EXPO_CONSTANTS_PACKAGE_DIR/../.."}

cd "$PROJECT_ROOT" || exit

if [ "$BUNDLE_FORMAT" == "shallow" ]; then
  RESOURCE_DEST="$DEST/$RESOURCE_BUNDLE_NAME"
  # CocoaPods creates the bundle through `resource_bundles`; SwiftPM has no
  # equivalent, and getAppConfig.js writes into this directory without creating
  # it. A no-op when the bundle already exists.
  mkdir -p "$RESOURCE_DEST"
elif [ "$BUNDLE_FORMAT" == "deep" ]; then
  RESOURCE_DEST="$DEST/$RESOURCE_BUNDLE_NAME/Contents/Resources"
  mkdir -p "$RESOURCE_DEST"
else
  echo "Unsupported bundle format: $BUNDLE_FORMAT"
  exit 1
fi

"${EXPO_CONSTANTS_PACKAGE_DIR}/scripts/with-node.sh" "${EXPO_CONSTANTS_PACKAGE_DIR}/scripts/getAppConfig.js" "$PROJECT_ROOT" "$RESOURCE_DEST"
