#!/bin/bash

# Creates a stub xcframework with a minimal dynamic library so that
# CocoaPods detects it as a dynamic framework and generates the
# "[CP] Copy XCFrameworks" and "[CP] Embed Pods Frameworks" build phases.
# The real xcframework is built by the build-xcframework.sh script at build time.

set -eo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_NAME="ExpoModulesJSI"
XCFRAMEWORK_PATH="${PACKAGE_DIR}/Products/${PACKAGE_NAME}.xcframework"

if [[ -d "$XCFRAMEWORK_PATH" ]]; then
  exit 0
fi

SLICE_DIR="${XCFRAMEWORK_PATH}/ios-arm64_x86_64-simulator/${PACKAGE_NAME}.framework"
mkdir -p "$SLICE_DIR"

# Create a minimal dynamic library so CocoaPods detects it as dynamic.
# This stub is replaced by the real xcframework at build time.
echo "" | clang -x c - -dynamiclib \
  -o "${SLICE_DIR}/${PACKAGE_NAME}" \
  -target arm64-apple-ios-simulator \
  -isysroot "$(xcrun --sdk iphonesimulator --show-sdk-path)" \
  -install_name "@rpath/${PACKAGE_NAME}.framework/${PACKAGE_NAME}"

cat > "${XCFRAMEWORK_PATH}/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>AvailableLibraries</key>
  <array>
    <dict>
      <key>BinaryPath</key>
      <string>${PACKAGE_NAME}.framework/${PACKAGE_NAME}</string>
      <key>LibraryIdentifier</key>
      <string>ios-arm64_x86_64-simulator</string>
      <key>LibraryPath</key>
      <string>${PACKAGE_NAME}.framework</string>
      <key>SupportedArchitectures</key>
      <array>
        <string>arm64</string>
        <string>x86_64</string>
      </array>
      <key>SupportedPlatform</key>
      <string>ios</string>
      <key>SupportedPlatformVariant</key>
      <string>simulator</string>
    </dict>
  </array>
  <key>CFBundlePackageType</key>
  <string>XFWK</string>
  <key>XCFrameworkFormatVersion</key>
  <string>1.0</string>
</dict>
</plist>
PLIST
