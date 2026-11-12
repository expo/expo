#!/usr/bin/env bash
# Builds the widgets bundle into the widget extension of an app that uses Swift Package Manager.
# With CocoaPods, the ExpoWidgets pod's own phases build and copy the bundle.

set -eo pipefail

if [ -n "${PODS_ROOT:-}" ]; then
  exit 0
fi

EXPO_WIDGETS_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
PROJECT_ROOT="${PROJECT_ROOT:-$SRCROOT/..}"

cd "$PROJECT_ROOT"

"$EXPO_WIDGETS_PACKAGE_DIR/scripts/with-node.sh" "$EXPO_WIDGETS_PACKAGE_DIR/scripts/build-bundle.mjs" "$PROJECT_ROOT"
"$EXPO_WIDGETS_PACKAGE_DIR/scripts/with-node.sh" "$EXPO_WIDGETS_PACKAGE_DIR/scripts/build-layout-registry.mjs" "$PROJECT_ROOT" ios

DEST="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/ExpoWidgets.bundle"
mkdir -p "$DEST"
cp "$EXPO_WIDGETS_PACKAGE_DIR/bundle/build/ExpoWidgets.bundle" "$DEST/ExpoWidgets.bundle"
cp "$EXPO_WIDGETS_PACKAGE_DIR/bundle/build/ExpoWidgetsLayoutRegistry.json" "$DEST/ExpoWidgetsLayoutRegistry.json"
