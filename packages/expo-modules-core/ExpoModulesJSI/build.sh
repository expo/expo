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

# ARCHIVES_DIR_PATH="Archives"
# XCARCHIVE_PATH="$ARCHIVES_DIR_PATH/$BUILD_NAME.xcarchive"

# Clean build products in DerivedData
rm -rf $BUILD_PRODUCTS_PATH

# Clean Archives folder
# rm -rf "$ARCHIVES"

# Remove existing .xcframework
rm -rf "$XCFRAMEWORK_PATH"

# xcodebuild \
#   archive \
#   -workspace . \
#   -scheme "$PACKAGE_NAME" \
#   -destination "generic/platform=$PLATFORM_DESTINATION" \
#   -archivePath "$XCARCHIVE_PATH" \
#   -derivedDataPath "$DERIVED_DATA_PATH" \
#   -quiet \
#   BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
#   SKIP_INSTALL=NO \
#   DEBUG_INFORMATION_FORMAT=dwarf-with-dsym

# FRAMEWORK_PATH="$XCARCHIVE_PATH/Products/usr/local/lib/$PACKAGE_NAME.framework"
# FRAMEWORK_MODULES_PATH="$FRAMEWORK_PATH/Modules"
# mkdir -p $FRAMEWORK_MODULES_PATH

# BUILD_PRODUCTS_PATH="$DERIVED_DATA_PATH/Build/Intermediates.noindex/ArchiveIntermediates/$PACKAGE_NAME/BuildProductsPath/$BUILD_NAME"
# SWIFT_MODULE_PATH="$BUILD_PRODUCTS_PATH/$PACKAGE_NAME.swiftmodule"

# # for swift_interface in $SWIFT_MODULE_PATH/*.{private,package}.swiftinterface; do
#   # rm -rf "$swift_interface"
#   # echo "Found Swift interface: ${swift_interface}"
#   # perl -i -p0e 's/\@usableFromInline\s+internal protocol _ConstraintThatIsNotPartOfTheAPIOfThisLibrary \{\}\s*//g' "$swift_interface"
# # done

# # Copy .swiftmodule file to .framework
# if [ -d $SWIFT_MODULE_PATH ]
# then
#   cp -r $SWIFT_MODULE_PATH $FRAMEWORK_MODULES_PATH
# fi

# xcodebuild \
#   -create-xcframework \
#   -framework "$FRAMEWORK_PATH" \
#   -output "$XCFRAMEWORK_PATH"

# exit 0;

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
  -framework "${BUILD_PRODUCTS_PATH}/${BUILD_NAME}/PackageFrameworks/${PACKAGE_NAME}.framework" \
  -output "$XCFRAMEWORK_PATH"

# TODO: I could not get this to work, it throws saying it is not a valid debug symbols file
# -debug-symbols "${BUILD_PRODUCTS_PATH}/${CONFIGURATION}-${PLATFORM_NAME}/${PACKAGE_NAME}.framework.dSYM" \

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
