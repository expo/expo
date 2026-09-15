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
PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")
if [ "x$PROJECT_DIR_BASENAME" != "xPods" ]; then
  exit 0
fi

# Native debugging configures the bundle through these files. Match the app bundle phase's order.
if [[ -f "$PODS_ROOT/../.xcode.env.updates" ]]; then
  # The bundle phase does not enable errexit or pipefail while sourcing environment files.
  set +eo pipefail
  for EXPO_CONSTANTS_XCODE_ENV_FILE in \
    "$PODS_ROOT/../.xcode.env" \
    "$PODS_ROOT/../.xcode.env.local" \
    "$PODS_ROOT/../.xcode.env.updates" \
    "$PODS_ROOT/../.xcode.env.local"; do
    if [[ -f "$EXPO_CONSTANTS_XCODE_ENV_FILE" ]]; then
      source "$EXPO_CONSTANTS_XCODE_ENV_FILE"
    fi
  done
  set -eo pipefail
fi

if [[ -n "${__EXPO_CONFIG_MODE+x}" ]]; then
  CONFIG_MODE="$__EXPO_CONFIG_MODE"
elif [[ "$CONFIGURATION" == *Debug* ]]; then
  CONFIG_MODE="development"
else
  CONFIG_MODE="production"
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

__EXPO_CONFIG_MODE="$CONFIG_MODE" "${EXPO_CONSTANTS_PACKAGE_DIR}/scripts/with-node.sh" "${EXPO_CONSTANTS_PACKAGE_DIR}/scripts/getAppConfig.js" "$PROJECT_ROOT" "$RESOURCE_DEST"
