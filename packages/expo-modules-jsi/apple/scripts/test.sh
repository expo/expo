#!/bin/bash
#
# Runs the ExpoModulesJSI test suite against a host app's Pods.
#
# Tests need an iOS Simulator destination because the package's headers and
# prebuilt xcframeworks (React, hermesvm, ReactNativeDependencies) only ship
# iOS slices; macOS won't link.
#
# This script wires up a host-free test run by:
#   1. Pointing PODS_ROOT at an installed app (defaults to apps/bare-expo).
#   2. Symlinking React/hermesvm/ReactNativeDependencies xcframeworks from
#      Pods into `.test-frameworks/` so SwiftPM can register them as
#      relative-path binary targets (Package.swift picks them up).
#   3. Generating the `jsi` Clang module map against PODS_ROOT.
#   4. Invoking `xcodebuild test` against an iOS Simulator destination. Extra
#      args are forwarded to xcodebuild (e.g. `-only-testing TestName`).
#
# Usage:
#   scripts/test.sh [extra xcodebuild args...]
#
# Environment:
#   PODS_ROOT       Path to a Pods directory with prebuilt React Native.
#                   Defaults to $EXPO_ROOT_DIR/apps/bare-expo/ios/Pods.
#   DESTINATION     xcodebuild -destination value. Defaults to the booted
#                   simulator, or an iPhone on the highest-versioned
#                   available iOS runtime.

set -eo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "${PACKAGE_DIR}/scripts/xcframework-helpers.sh"

# Resolve PODS_ROOT with fallback logic (from xcframework-helpers.sh).
# Must be passed to subprocess calls, not exported, to avoid polluting the environment.
resolve_pods_root "$PACKAGE_DIR"

# --- Symlink xcframeworks for SwiftPM binary targets ---

TEST_FRAMEWORKS_DIR="${PACKAGE_DIR}/.test-frameworks"
mkdir -p "$TEST_FRAMEWORKS_DIR"

link_xcframework() {
  local name="$1"
  local source="$2"
  local link="${TEST_FRAMEWORKS_DIR}/${name}.xcframework"

  if [[ ! -d "$source" ]]; then
    echo "warning: missing $source — tests may fail to link" >&2
    return
  fi

  # Recreate the symlink unconditionally so it tracks the current PODS_ROOT.
  rm -f "$link"
  ln -s "$source" "$link"
}

link_xcframework "React" \
  "${PODS_ROOT}/React-Core-prebuilt/React.xcframework"
link_xcframework "hermesvm" \
  "${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework"
link_xcframework "ReactNativeDependencies" \
  "${PODS_ROOT}/ReactNativeDependencies/framework/packages/react-native/ReactNativeDependencies.xcframework"

# --- Generate the jsi module map ---

env PODS_ROOT="$PODS_ROOT" "${PACKAGE_DIR}/scripts/generate-modulemap.sh"

# --- Pick a simulator destination ---

if [[ -z "${DESTINATION:-}" ]]; then
  # Prefer a booted simulator if one's already running; otherwise pick an
  # iPhone on the highest-versioned available iOS runtime.
  # `|| true` keeps `set -e -o pipefail` from aborting when grep finds nothing.
  BOOTED_ID=$( { xcrun simctl list devices booted 2>/dev/null \
    | grep -oE '\(([0-9A-F-]{36})\)' | head -1 | tr -d '()'; } || true)
  if [[ -n "$BOOTED_ID" ]]; then
    DESTINATION="platform=iOS Simulator,id=$BOOTED_ID"
  else
    LATEST_ID=$( { xcrun simctl list devices available 2>/dev/null \
      | awk '
        /^-- iOS [0-9]/ { runtime = $3; next }
        runtime && /iPhone / && match($0, /\([0-9A-F-]+\)/) {
          print runtime, substr($0, RSTART + 1, RLENGTH - 2)
        }
      ' \
      | sort -V -r \
      | head -1 \
      | awk '{ print $2 }'; } || true)
    if [[ -z "$LATEST_ID" ]]; then
      echo "error: no iOS Simulator available; boot one or set DESTINATION" >&2
      exit 1
    fi
    DESTINATION="platform=iOS Simulator,id=$LATEST_ID"
  fi
fi

# --- Run the tests ---

cd "$PACKAGE_DIR"
exec env PODS_ROOT="$PODS_ROOT" xcodebuild test \
  -scheme ExpoModulesJSI \
  -destination "$DESTINATION" \
  -derivedDataPath "${PACKAGE_DIR}/.DerivedData" \
  -disableAutomaticPackageResolution \
  -skipPackagePluginValidation \
  -skipMacroValidation \
  "$@"
