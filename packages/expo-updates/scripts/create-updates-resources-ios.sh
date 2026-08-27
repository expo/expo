#!/usr/bin/env bash

set -eo pipefail

CREATE_UPDATES_RESOURCES_MODE="all"

if [[ -n "$__EXPO_CONFIG_MODE" ]]; then
  CONFIG_MODE="$__EXPO_CONFIG_MODE"
elif [[ "$EAS_BUILD" == "1" || "$EAS_BUILD" == "true" ]]; then
  CONFIG_MODE="production"
elif [[ "$CONFIGURATION" == *Debug* ]]; then
  CONFIG_MODE="development"
else
  CONFIG_MODE="production"
fi

if [[ "$CONFIGURATION" == *Debug* ]]; then
  METRO_DEV="true"
else
  METRO_DEV="false"
fi

if [[ "$SKIP_BUNDLING" ]]; then
  echo "SKIP_BUNDLING enabled; skipping create-manifest-ios.sh."
  CREATE_UPDATES_RESOURCES_MODE="only-fingerprint"
elif [[ "$METRO_DEV" == "true" ]]; then
  if [[ "$FORCE_BUNDLING" ]]; then
    echo "FORCE_BUNDLING enabled; continuing create-manifest-ios.sh."
  else
    CREATE_UPDATES_RESOURCES_MODE="only-fingerprint"
  fi
fi

EXPO_UPDATES_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

DEST="$CONFIGURATION_BUILD_DIR"
RESOURCE_BUNDLE_NAME="EXUpdates.bundle"
RCT_METRO_PORT=${RCT_METRO_PORT:=8081}

# For classic main project build phases integration, will be no-op to prevent duplicated app.manifest or fingerprint creation.
#
# `$PROJECT_DIR` is passed by Xcode as the directory to the xcodeproj file.
# in classic main project setup it is something like /path/to/app/ios
# in new style pod project setup it is something like /path/to/app/ios/Pods
PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")
if [ "x$PROJECT_DIR_BASENAME" != "xPods" ]; then
  exit 0
fi

# If PROJECT_ROOT is not specified, fallback to use Xcode PROJECT_DIR
PROJECT_ROOT=${PROJECT_ROOT:-"$PROJECT_DIR/../.."}
PROJECT_ROOT=${PROJECT_ROOT:-"$EXPO_UPDATES_PACKAGE_DIR/../.."}

cd "$PROJECT_ROOT" || exit
# We should get the physical path (/var/folders -> /private/var/folders) for metro to resolve correct files
PROJECT_ROOT="$(pwd -P)"

if [ "$BUNDLE_FORMAT" == "shallow" ]; then
  RESOURCE_DEST="$DEST/$RESOURCE_BUNDLE_NAME"
  mkdir -p "$RESOURCE_DEST"
elif [ "$BUNDLE_FORMAT" == "deep" ]; then
  RESOURCE_DEST="$DEST/$RESOURCE_BUNDLE_NAME/Contents/Resources"
  mkdir -p "$RESOURCE_DEST"
else
  echo "Unsupported bundle format: $BUNDLE_FORMAT"
  exit 1
fi

__EXPO_CONFIG_MODE="$CONFIG_MODE" "${EXPO_UPDATES_PACKAGE_DIR}/scripts/with-node.sh" "${EXPO_UPDATES_PACKAGE_DIR}/utils/build/createUpdatesResources.js" ios "$PROJECT_ROOT" "$RESOURCE_DEST" "$CREATE_UPDATES_RESOURCES_MODE" "$ENTRY_FILE" "$METRO_DEV"
