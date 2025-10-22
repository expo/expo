#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BIN_DIR="$PROJECT_ROOT/bin"
SRC_DIR="$PROJECT_ROOT/src"

# Create bin directory
mkdir -p "$BIN_DIR"

echo "Building iOS screenInspector Framework..."

# Create framework directories
FRAMEWORK_DIR="$BIN_DIR/IOSScreenInspectorFramework.framework"
mkdir -p "$FRAMEWORK_DIR"

echo "Building for iOS Simulator..."

xcrun -sdk iphonesimulator swiftc \
    -target arm64-apple-ios16.0-simulator \
    -emit-library \
    -module-name IOSScreenInspectorFramework \
    -o "$BIN_DIR/IOSScreenInspectorFramework_sim_arm64" \
    "$SRC_DIR/ScreenshotServer.swift" \
    "$SRC_DIR/UICapture.swift" \
    "$SRC_DIR/constructor.c" \
    -Xlinker -install_name -Xlinker @rpath/IOSScreenInspectorFramework.framework/IOSScreenInspectorFramework

# Create universal simulator framework binary
echo "Creating universal simulator framework..."
xcrun lipo -create \
    "$BIN_DIR/IOSScreenInspectorFramework_sim_arm64" \
    -output "$FRAMEWORK_DIR/IOSScreenInspectorFramework"

# Clean up individual arch files
rm "$BIN_DIR/IOSScreenInspectorFramework_sim_arm64"

# Create Info.plist for framework
cat > "$FRAMEWORK_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.example.IOSScreenInspectorFramework</string>
    <key>CFBundleName</key>
    <string>IOSScreenInspectorFramework</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>FMWK</string>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>IOSScreenInspectorFramework</string>
    <key>MinimumOSVersion</key>
    <string>16.0</string>
</dict>
</plist>
EOF

echo "Build completed successfully!"
echo "Simulator framework: $FRAMEWORK_DIR"
