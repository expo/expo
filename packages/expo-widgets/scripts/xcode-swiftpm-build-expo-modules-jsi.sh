#!/usr/bin/env bash
# Builds ExpoModulesJSI for the link of the widget extension in an app that uses Swift Package
# Manager. The app's own "Build ExpoModulesJSI" phase cannot serve the extension: the app depends
# on the extension, so that phase runs only after the extension is linked.

set -eo pipefail

if [ -n "${PODS_ROOT:-}" ]; then
  exit 0
fi

NODE_BINARY="${NODE_BINARY:-$(command -v node || true)}"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SRCROOT/.." && pwd)}"

# expo-modules-jsi is a dependency of expo-modules-core, not of the app, so under pnpm it is
# reachable only through that chain.
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
  echo "error: The widget extension could not build ExpoModulesJSI because react-native, or expo-modules-jsi through expo and expo-modules-core, could not be resolved from $PROJECT_ROOT. Install the app's dependencies, then build again." >&2
  exit 1
fi
export RN_DIR

# The app embeds and signs ExpoModulesJSI. The extension only links it, so the copy that the
# script would embed goes to a scratch folder, unsigned and without a dSYM.
export TARGET_BUILD_DIR="$DERIVED_FILE_DIR/ExpoModulesJSI-not-embedded"
export CODE_SIGNING_ALLOWED=NO
export DWARF_DSYM_FOLDER_PATH=
exec /bin/bash "$JSI_DIR/apple/scripts/build-swiftpm-app-phase.sh"
