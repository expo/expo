#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../xcframework-cache.sh"

TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/expo-modules-jsi-cache-test.XXXXXX")
trap 'rm -rf "$TEST_ROOT"' EXIT

CACHE_DIR="${TEST_ROOT}/cache"
XCFRAMEWORK_PATH="${TEST_ROOT}/ExpoModulesJSI.xcframework"
SLICE_ID="ios-arm64"
BUILD_HASH="content-hash"
SLICE_DIR="${XCFRAMEWORK_PATH}/${SLICE_ID}"

mkdir -p "${SLICE_DIR}/ExpoModulesJSI.framework/Versions/A"
echo "binary" > "${SLICE_DIR}/ExpoModulesJSI.framework/Versions/A/ExpoModulesJSI"
ln -s "Versions/A/ExpoModulesJSI" "${SLICE_DIR}/ExpoModulesJSI.framework/ExpoModulesJSI"
echo "$BUILD_HASH" > "${SLICE_DIR}/.build-hash"

store_xcframework_slice_cache "$CACHE_DIR" "$BUILD_HASH" "$SLICE_ID" "$XCFRAMEWORK_PATH"

rm -rf "$SLICE_DIR"
mkdir -p "$SLICE_DIR"
echo "stub" > "${SLICE_DIR}/stub"
restore_xcframework_slice_cache "$CACHE_DIR" "$BUILD_HASH" "$SLICE_ID" "$XCFRAMEWORK_PATH"

test "$(cat "${SLICE_DIR}/ExpoModulesJSI.framework/Versions/A/ExpoModulesJSI")" = "binary"
test -L "${SLICE_DIR}/ExpoModulesJSI.framework/ExpoModulesJSI"
test ! -e "${SLICE_DIR}/stub"

echo "wrong-hash" > "${SLICE_DIR}/.build-hash"
tar -czf "${CACHE_DIR}/${BUILD_HASH}/${SLICE_ID}.tar.gz" -C "$XCFRAMEWORK_PATH" "$SLICE_ID"
if restore_xcframework_slice_cache "$CACHE_DIR" "$BUILD_HASH" "$SLICE_ID" "$XCFRAMEWORK_PATH"; then
  echo "Expected a cache entry with a different build hash to be rejected" >&2
  exit 1
fi

echo "xcframework cache tests passed"
