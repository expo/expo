#!/bin/bash
set -euo pipefail

# Runs the app target's "Build ExpoModulesJSI" phase, which expo's SwiftPM plugin adds to apps
# that consume Expo modules through Swift Package Manager. The plugin's launcher in that phase
# resolves react-native and this package at build time, then runs this script with RN_DIR set to
# the react-native package.
#
# npm ships ExpoModulesJSI as a headers-only XCFramework, because the framework must be compiled
# against the app's React Native. Swift packages compile against those headers; this phase builds
# the real ExpoModulesJSI.framework and puts it where the app links and embeds it.

: "${RN_DIR:?RN_DIR must point at the react-native package of the app}"
JSI_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

case "${PLATFORM_NAME:-}" in
  iphoneos) SLICE=ios-arm64 ;;
  iphonesimulator) SLICE=ios-arm64_x86_64-simulator ;;
  *)
    echo "error: ExpoModulesJSI cannot be built for the platform '${PLATFORM_NAME:-}'. Swift Package Manager support in Expo covers iOS and the iOS Simulator only. Build for one of those." >&2
    exit 1
    ;;
esac

# One per build folder, so Clean Build Folder rebuilds it and builds in different build folders
# never race. Every configuration in the folder shares it: build-xcframework.sh always builds
# Release.
JSI_ROOT="$OBJROOT/ExpoModulesJSI"

# build-xcframework.sh reads headers from a CocoaPods-shaped Headers/Public tree. A SwiftPM app has
# no Pods, so stage one from React Native's source and the SwiftPM artifacts in build/xcframeworks.
STAGE="$JSI_ROOT/pods-stage"
PUBLIC="$STAGE/Headers/Public"
XCFRAMEWORKS="$SRCROOT/build/xcframeworks"
REACT_HEADERS="$XCFRAMEWORKS/ReactNativeHeaders.xcframework/$SLICE/Headers"
DEPENDENCIES_HEADERS="$XCFRAMEWORKS/ReactNativeDependenciesHeaders.xcframework/$SLICE/Headers"
for required in "$REACT_HEADERS/hermes/hermes.h" "$DEPENDENCIES_HEADERS/folly"; do
  if [ ! -e "$required" ]; then
    echo "error: ExpoModulesJSI could not be built because $required is missing. It comes from React Native's Swift Package Manager artifacts, which are not set up for this app. Run \`node $RN_DIR/scripts/setup-apple-spm.js update\` from the app root (the directory above $SRCROOT), then build again." >&2
    exit 1
  fi
done

stage_link() {
  mkdir -p "$(dirname "$PUBLIC/$2")"
  ln -sfn "$1" "$PUBLIC/$2"
}
# Also listed in tools/src/prebuilds/CustomBuild.ts (RN_HEADER_POD_LAYOUT) and in
# packages/expo-modules-jsi/apple/Package.swift (headerSearchPaths). A header root added to one must
# be added to the others, or SwiftPM apps fail at build time with a missing header.
stage_link "$RN_DIR/ReactCommon/jsi/jsi" React-jsi/jsi
stage_link "$RN_DIR/ReactCommon/react/renderer/runtimescheduler" React-runtimescheduler/react/renderer/runtimescheduler
stage_link "$RN_DIR/ReactCommon/react/renderer/consistency" React-rendererconsistency/react/renderer/consistency
stage_link "$RN_DIR/ReactCommon/react/performance/timeline" React-performancetimeline/react/performance/timeline
stage_link "$RN_DIR/ReactCommon/react/timing" React-timing/react/timing
stage_link "$RN_DIR/ReactCommon/react/debug" React-debug/react/debug
stage_link "$RN_DIR/ReactCommon/callinvoker/ReactCommon" React-callinvoker/ReactCommon
stage_link "$RN_DIR/ReactCommon/runtimeexecutor/ReactCommon" React-runtimeexecutor/ReactCommon
stage_link "$REACT_HEADERS/hermes" hermes-engine/hermes
stage_link "$DEPENDENCIES_HEADERS" ReactNativeDependencies

# build-xcframework.sh hashes this file, so a React Native upgrade rebuilds the framework.
RN_VERSION="$(plutil -extract version raw -o - "$RN_DIR/package.json")"
PODSPEC="$STAGE/Local Podspecs/React-Core.podspec.json"
PODSPEC_JSON="{\"name\":\"React-Core\",\"version\":\"$RN_VERSION\"}"
if [ ! -f "$PODSPEC" ] || [ "$(cat "$PODSPEC")" != "$PODSPEC_JSON" ]; then
  mkdir -p "$(dirname "$PODSPEC")"
  printf '%s' "$PODSPEC_JSON" >"$PODSPEC"
fi

EXPO_CUSTOM_BUILD_ROOT="$JSI_ROOT/custom-build" PODS_ROOT="$STAGE" REACT_NATIVE_PATH="$RN_DIR" \
  "$JSI_DIR/apple/scripts/build-xcframework.sh"

FRAMEWORK="$JSI_ROOT/custom-build/Products/ExpoModulesJSI.xcframework/$SLICE/ExpoModulesJSI.framework"

# The link: the ExpoModulesJSILink target of the generated ExpoModulesJSIHeaders package passes
# `-framework ExpoModulesJSI` to the app's link step, and BUILT_PRODUCTS_DIR is on its framework
# search path.
/usr/bin/rsync -a --delete "$FRAMEWORK/" "$BUILT_PRODUCTS_DIR/ExpoModulesJSI.framework/"

EMBEDDED="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/ExpoModulesJSI.framework"
# rsync creates only the last path component, and this phase can run before Xcode creates Frameworks/.
mkdir -p "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH"
/usr/bin/rsync -a --delete "$FRAMEWORK/" "$EMBEDDED/"
if [ "${CODE_SIGNING_ALLOWED:-YES}" != "NO" ]; then
  /usr/bin/codesign --force --sign "${EXPANDED_CODE_SIGN_IDENTITY:--}" --timestamp=none \
    --preserve-metadata=identifier,entitlements,flags "$EMBEDDED"
fi

# Archives collect dSYMs from DWARF_DSYM_FOLDER_PATH; without this one, JSI crashes are not
# symbolicated.
if [ -d "$FRAMEWORK.dSYM" ] && [ -n "${DWARF_DSYM_FOLDER_PATH:-}" ]; then
  mkdir -p "$DWARF_DSYM_FOLDER_PATH"
  /usr/bin/rsync -a --delete "$FRAMEWORK.dSYM/" "$DWARF_DSYM_FOLDER_PATH/ExpoModulesJSI.framework.dSYM/"
fi
echo "Build ExpoModulesJSI phase finished in ${SECONDS}s"
