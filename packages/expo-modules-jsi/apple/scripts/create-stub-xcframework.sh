#!/bin/bash

# Creates a stub xcframework with a minimal dynamic library so that
# CocoaPods detects it as a dynamic framework and generates the
# "[CP] Copy XCFrameworks" and "[CP] Embed Pods Frameworks" build phases.
# The real xcframework is built by the build-xcframework.sh script at build time.

set -eo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_NAME="ExpoModulesJSI"
XCFRAMEWORK_PATH="${PACKAGE_DIR}/Products/${PACKAGE_NAME}.xcframework"

# Use colors only when run in the terminal
BLUE=""; RESET=""
if [ -t 1 ]; then
  BLUE="\033[34m"
  RESET="\033[0m"
fi
echo -e "${BLUE}[Expo]${RESET} Creating stub xcframework for ${PACKAGE_NAME}"

# Platform slices the podspec supports. CocoaPods reads Info.plist at
# `pod install` time to generate per-slice cases in its xcframework copy
# script, so every SDK we want to build for must appear here.
#
# Format: slice_id|platform|variant|archs
SLICES=(
  "ios-arm64|ios||arm64"
  "ios-arm64_x86_64-simulator|ios|simulator|arm64 x86_64"
  "tvos-arm64|tvos||arm64"
  "tvos-arm64_x86_64-simulator|tvos|simulator|arm64 x86_64"
)

# Always regenerate the Info.plist so it declares every slice. A previous
# build may have produced an xcframework with only the target platform's
# slice (e.g. device-only or simulator-only), which would cause CocoaPods
# to generate a copy script that is missing the other variant.

# The stub binary is only inspected by CocoaPods at install time to detect
# that this is a dynamic framework — it is never linked against (the real
# xcframework replaces it before the sources compile). Compile it once and
# reuse the same binary for every slice.
STUB_SOURCE="${XCFRAMEWORK_PATH}/.stub-binary"
mkdir -p "$XCFRAMEWORK_PATH"
echo "" | clang -x c - -dynamiclib \
  -o "$STUB_SOURCE" \
  -install_name "@rpath/${PACKAGE_NAME}.framework/${PACKAGE_NAME}"

available_libraries=""
for slice in "${SLICES[@]}"; do
  IFS='|' read -r slice_id platform variant archs <<<"$slice"
  slice_dir="${XCFRAMEWORK_PATH}/${slice_id}/${PACKAGE_NAME}.framework"
  mkdir -p "$slice_dir"
  if [[ ! -f "${slice_dir}/${PACKAGE_NAME}" ]]; then
    cp "$STUB_SOURCE" "${slice_dir}/${PACKAGE_NAME}"
  fi

  arch_entries=""
  for arch in $archs; do
    arch_entries+="        <string>${arch}</string>
"
  done

  variant_entry=""
  if [[ -n "$variant" ]]; then
    variant_entry="      <key>SupportedPlatformVariant</key>
      <string>${variant}</string>
"
  fi

  available_libraries+="    <dict>
      <key>BinaryPath</key>
      <string>${PACKAGE_NAME}.framework/${PACKAGE_NAME}</string>
      <key>LibraryIdentifier</key>
      <string>${slice_id}</string>
      <key>LibraryPath</key>
      <string>${PACKAGE_NAME}.framework</string>
      <key>SupportedArchitectures</key>
      <array>
${arch_entries}      </array>
      <key>SupportedPlatform</key>
      <string>${platform}</string>
${variant_entry}    </dict>
"
done
rm -f "$STUB_SOURCE"

cat > "${XCFRAMEWORK_PATH}/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>AvailableLibraries</key>
  <array>
${available_libraries}  </array>
  <key>CFBundlePackageType</key>
  <string>XFWK</string>
  <key>XCFrameworkFormatVersion</key>
  <string>1.0</string>
</dict>
</plist>
PLIST
