#!/usr/bin/env bash

set -eo pipefail

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

# Native debugging configures the bundle through these files. Match the app bundle phase's order.
if [[ -f "$PODS_ROOT/../.xcode.env.updates" ]]; then
  # The bundle phase does not enable errexit or pipefail while sourcing environment files.
  set +eo pipefail
  for EXPO_UPDATES_XCODE_ENV_FILE in \
    "$PODS_ROOT/../.xcode.env" \
    "$PODS_ROOT/../.xcode.env.local" \
    "$PODS_ROOT/../.xcode.env.updates" \
    "$PODS_ROOT/../.xcode.env.local"; do
    if [[ -f "$EXPO_UPDATES_XCODE_ENV_FILE" ]]; then
      source "$EXPO_UPDATES_XCODE_ENV_FILE"
    fi
  done
  set -eo pipefail
fi

if [[ "$CONFIGURATION" == *Debug* ]]; then
  CONFIG_MODE="development"
  METRO_DEV="true"
else
  CONFIG_MODE="production"
  METRO_DEV="false"
fi

if [[ -n "${__EXPO_CONFIG_MODE+x}" ]]; then
  CONFIG_MODE="$__EXPO_CONFIG_MODE"
fi

CREATE_UPDATES_RESOURCES_MODE="all"
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
