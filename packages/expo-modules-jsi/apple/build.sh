#!/bin/bash

set -e

PACKAGE_NAME="ExpoModulesJSI"
CONFIGURATION="Debug"
PLATFORM_DESTINATION="iOS Simulator"
PLATFORM_NAME="iphonesimulator"
XCFRAMEWORK_PATH="$PACKAGE_NAME.xcframework"
DERIVED_DATA_PATH=".DerivedData"
BUILD_PRODUCTS_PATH="$DERIVED_DATA_PATH/Build/Products"

while [[ $# -gt 0 ]]; do
  case $1 in
    -r|--release)
      CONFIGURATION="Release"
      shift
      ;;
    -d|--device)
      PLATFORM_DESTINATION="iOS"
      PLATFORM_NAME="iphoneos"
      shift
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# e.g. Release-iphone, Release-iphonesimulator
BUILD_NAME="$CONFIGURATION-$PLATFORM_NAME"

# Clean build products in DerivedData
rm -rf $BUILD_PRODUCTS_PATH

# Remove existing .xcframework
rm -rf "$XCFRAMEWORK_PATH"

xcodebuild \
  build \
  -scheme "$PACKAGE_NAME" \
  -destination "generic/platform=$PLATFORM_DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -configuration "$CONFIGURATION" \
  -quiet \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  SKIP_INSTALL=NO \
  DEBUG_INFORMATION_FORMAT=dwarf-with-dsym

# Create .xcframework
xcodebuild \
  -create-xcframework \
  -framework "${PWD}/${BUILD_PRODUCTS_PATH}/${BUILD_NAME}/PackageFrameworks/${PACKAGE_NAME}.framework" \
  -debug-symbols "${PWD}/${BUILD_PRODUCTS_PATH}/${BUILD_NAME}/${PACKAGE_NAME}.framework.dSYM" \
  -output "$XCFRAMEWORK_PATH"

for product_path in $BUILD_PRODUCTS_PATH/*/; do
  swiftmodule_src_path="${product_path}${PACKAGE_NAME}.swiftmodule"

  for slice_path in $XCFRAMEWORK_PATH/*/; do
    framework_path="${slice_path}${PACKAGE_NAME}.framework"
    framework_modules_path="${framework_path}/Modules"
    swiftmodule_dest_path="${framework_modules_path}/${PACKAGE_NAME}.swiftmodule"

    # Make `Modules` directory and copy `.swiftmodule`
    mkdir -p $framework_modules_path
    cp -r $swiftmodule_src_path/ $swiftmodule_dest_path

    # Make `Headers` directory and put Swift header and modulemap there
    framework_headers_path="${framework_path}/Headers"
    generated_module_maps_path="${DERIVED_DATA_PATH}/Build/Intermediates.noindex/GeneratedModuleMaps-${PLATFORM_NAME}"
    swift_header_path="${generated_module_maps_path}/${PACKAGE_NAME}-Swift.h"
    module_map_path="${generated_module_maps_path}/${PACKAGE_NAME}.modulemap"

    mkdir -p $framework_headers_path
    cp $swift_header_path "$framework_headers_path/"
    cp $module_map_path "$framework_headers_path/module.modulemap"

    # We don't need this dir
    rm -rf "${swiftmodule_dest_path}/Project"
  done
done
