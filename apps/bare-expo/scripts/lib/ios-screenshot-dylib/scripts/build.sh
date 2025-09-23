#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BIN_DIR="$PROJECT_ROOT/bin"
SRC_DIR="$PROJECT_ROOT/src"

# Create bin directory
mkdir -p "$BIN_DIR"

echo "Building iOS Screenshot Framework..."

# Create framework directories
FRAMEWORK_DIR="$BIN_DIR/IOSScreenshotFramework.framework"
mkdir -p "$FRAMEWORK_DIR"

# Build for iOS Simulator (x86_64 + arm64)
echo "Building for iOS Simulator..."
xcrun -sdk iphonesimulator swiftc \
    -target x86_64-apple-ios16.0-simulator \
    -emit-library \
    -module-name IOSScreenshotFramework \
    -o "$BIN_DIR/IOSScreenshotFramework_sim_x86_64" \
    "$SRC_DIR/ScreenshotServer.swift" \
    "$SRC_DIR/UICapture.swift" \
    "$SRC_DIR/constructor.c" \
    -Xlinker -install_name -Xlinker @rpath/IOSScreenshotFramework.framework/IOSScreenshotFramework

xcrun -sdk iphonesimulator swiftc \
    -target arm64-apple-ios16.0-simulator \
    -emit-library \
    -module-name IOSScreenshotFramework \
    -o "$BIN_DIR/IOSScreenshotFramework_sim_arm64" \
    "$SRC_DIR/ScreenshotServer.swift" \
    "$SRC_DIR/UICapture.swift" \
    "$SRC_DIR/constructor.c" \
    -Xlinker -install_name -Xlinker @rpath/IOSScreenshotFramework.framework/IOSScreenshotFramework

# Create universal simulator framework binary
echo "Creating universal simulator framework..."
xcrun lipo -create \
    "$BIN_DIR/IOSScreenshotFramework_sim_x86_64" \
    "$BIN_DIR/IOSScreenshotFramework_sim_arm64" \
    -output "$FRAMEWORK_DIR/IOSScreenshotFramework"

# Clean up individual arch files
rm "$BIN_DIR/IOSScreenshotFramework_sim_x86_64" "$BIN_DIR/IOSScreenshotFramework_sim_arm64"

# Create Info.plist for framework
cat > "$FRAMEWORK_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.example.IOSScreenshotFramework</string>
    <key>CFBundleName</key>
    <string>IOSScreenshotFramework</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>FMWK</string>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>IOSScreenshotFramework</string>
    <key>MinimumOSVersion</key>
    <string>16.0</string>
</dict>
</plist>
EOF

echo "Build completed successfully!"
echo "Simulator framework: $FRAMEWORK_DIR"

# Verify architectures
echo ""
echo "Verifying architectures:"
echo "Simulator framework:"
xcrun lipo -info "$FRAMEWORK_DIR/IOSScreenshotFramework"

# Check if constructor.c symbols are included
echo ""
echo "Checking for constructor symbols:"
nm "$FRAMEWORK_DIR/IOSScreenshotFramework" | grep -i constructor || echo "No constructor symbols found"
