#!/bin/bash

# Ensures every required slice in ExpoModulesJSI.xcframework exists with at
# least a stub binary so CocoaPods detects the package as a dynamic framework
# and generates the "[CP] Copy XCFrameworks" and "[CP] Embed Pods Frameworks"
# build phases for every supported platform. The real xcframework is built by
# build-xcframework.sh at build time.
#
# Non-destructive: existing slice binaries (real or stub) are kept; only
# missing required slices are stamped. Info.plist is rewritten from whatever
# slices are on disk so additional slices built via Xcode survive.

set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_NAME="ExpoModulesJSI"
XCFRAMEWORK_PATH="${PACKAGE_DIR}/Products/${PACKAGE_NAME}.xcframework"

source "$(dirname "${BASH_SOURCE[0]}")/xcframework-helpers.sh"

BLUE=""; RESET=""
if [ -t 1 ]; then
  BLUE="\033[34m"
  RESET="\033[0m"
fi
echo -e "${BLUE}[Expo]${RESET} Ensuring required slices in ${PACKAGE_NAME}.xcframework"

# The stub binary is only inspected by CocoaPods at install time to detect
# that this is a dynamic framework — it is never linked against (the real
# xcframework replaces it before the sources compile). Compile it once and
# reuse the same binary for every slice that needs stamping.
mkdir -p "$XCFRAMEWORK_PATH"
STUB_SOURCE="${XCFRAMEWORK_PATH}/.stub-binary"
echo "" | clang -x c - -dynamiclib \
  -o "$STUB_SOURCE" \
  -install_name "@rpath/${PACKAGE_NAME}.framework/${PACKAGE_NAME}"

for slice_id in "${EXPO_MODULES_JSI_REQUIRED_SLICE_IDS[@]}"; do
  slice_dir="${XCFRAMEWORK_PATH}/${slice_id}"
  framework_dir="${slice_dir}/${PACKAGE_NAME}.framework"
  binary_path="${framework_dir}/${PACKAGE_NAME}"
  hash_file="${slice_dir}/.build-hash"

  mkdir -p "$framework_dir"
  if [[ ! -f "$binary_path" ]]; then
    cp "$STUB_SOURCE" "$binary_path"
  fi
  # Empty hash marks the slice as a stub. build-xcframework.sh treats any
  # mismatch (including stub vs. real source hash) as needing a rebuild.
  if [[ ! -f "$hash_file" ]]; then
    : > "$hash_file"
  fi
done

rm -f "$STUB_SOURCE"

write_xcframework_plist "$XCFRAMEWORK_PATH" "$PACKAGE_NAME"
