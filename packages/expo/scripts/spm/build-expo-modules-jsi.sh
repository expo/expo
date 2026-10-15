set -euo pipefail

# Body of the app target's "Build ExpoModulesJSI" phase (see script-phases.js).
#
# npm ships ExpoModulesJSI as a headers-only XCFramework, because the framework must be compiled
# against the app's React Native. Swift packages compile against those headers; this phase builds
# the real ExpoModulesJSI.framework and puts it where the app links and embeds it.

if [ -z "${NODE_BINARY:-}" ]; then
  set +eu
  if [ -f "$SRCROOT/.xcode.env" ]; then . "$SRCROOT/.xcode.env"; fi
  if [ -f "$SRCROOT/.xcode.env.local" ]; then . "$SRCROOT/.xcode.env.local"; fi
  set -eu
fi
NODE_BINARY="${NODE_BINARY:-$(command -v node || true)}"
if [ -z "$NODE_BINARY" ]; then
  echo "error: ExpoModulesJSI could not be built because node was not found. The build uses node to find react-native and expo-modules-jsi. Set NODE_BINARY in $SRCROOT/.xcode.env, for example: echo \"export NODE_BINARY=\$(command -v node)\" >> \"$SRCROOT/.xcode.env\"" >&2
  exit 1
fi

PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SRCROOT/.." && pwd)}"

# expo-modules-jsi is a dependency of expo-modules-core, not of the app, so it is resolved through
# that chain: under pnpm it is not reachable from the app root.
RESOLVED="$("$NODE_BINARY" -e '
  const path = require("path");
  const dir = (name, from) => path.dirname(require.resolve(`${name}/package.json`, { paths: [from] }));
  const root = process.argv[1];
  const core = dir("expo-modules-core", dir("expo", root));
  console.log(`${dir("react-native", root)}\n${dir("expo-modules-jsi", core)}`);
' "$PROJECT_ROOT" || true)"
RN_DIR="$(printf '%s\n' "$RESOLVED" | sed -n 1p)"
JSI_DIR="$(printf '%s\n' "$RESOLVED" | sed -n 2p)"
if [ -z "$RN_DIR" ] || [ -z "$JSI_DIR" ]; then
  echo "error: ExpoModulesJSI could not be built because react-native, or expo-modules-jsi through expo and expo-modules-core, could not be resolved from $PROJECT_ROOT. The dependencies are not installed, or PROJECT_ROOT does not point at the app. Install the app's dependencies, then build again." >&2
  exit 1
fi

case "$PLATFORM_NAME" in
  iphoneos) SLICE=ios-arm64 ;;
  iphonesimulator) SLICE=ios-arm64_x86_64-simulator ;;
  *)
    echo "error: ExpoModulesJSI cannot be built for the platform '$PLATFORM_NAME'. Swift Package Manager support in Expo covers iOS and the iOS Simulator only. Build for one of those." >&2
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
REACT_HEADERS="$XCFRAMEWORKS/ReactNativeHeaders.xcframework/ios-arm64/Headers"
DEPENDENCIES_HEADERS="$XCFRAMEWORKS/${RN_SPM_FLAVOR:-release}/ReactNativeDependencies.xcframework/Headers"
for required in "$REACT_HEADERS/hermes/hermes.h" "$DEPENDENCIES_HEADERS/folly"; do
  if [ ! -e "$required" ]; then
    echo "error: ExpoModulesJSI could not be built because $required is missing. It comes from React Native's Swift Package Manager artifacts, which are not set up for this app. Run \`npx react-native spm update\` in $SRCROOT, then build again." >&2
    exit 1
  fi
done

stage_link() {
  mkdir -p "$(dirname "$PUBLIC/$2")"
  ln -sfn "$1" "$PUBLIC/$2"
}
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
echo "Build ExpoModulesJSI phase finished in ${SECONDS}s"
