#!/bin/bash
#
# Builds ExpoModulesJSI.xcframework from the SPM package.
#
# This script is intended to run as a CocoaPods build phase (before headers),
# but can also be invoked manually with PODS_ROOT set.
#
# Features:
#   - Hash-based caching: skips rebuild if source files haven't changed
#   - Additive slices: builds only the requested platform, preserves others
#   - Dependency symlinks: links React, hermes-engine, and ReactNativeDependencies
#     from the Pods directory so Package.swift can reference them locally
#   - Cleans .swiftinterface files for cross-compiler compatibility
#
# Usage:
#   PODS_ROOT=/path/to/Pods ./build-xcframework.sh [--clean]
#
# Environment:
#   PODS_ROOT       (required) Path to the CocoaPods Pods directory
#   PLATFORM_NAME   (optional) Build for a specific platform (e.g. iphoneos, iphonesimulator).
#                   When unset, builds for both iphoneos and iphonesimulator.

set -eo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_NAME="ExpoModulesJSI"
XCFRAMEWORK_PATH="${PACKAGE_DIR}/Products/${PACKAGE_NAME}.xcframework"
SLICES_DIR="${PACKAGE_DIR}/.xcframework-slices"
HASH_FILE="${SLICES_DIR}/.build-hash"

CONFIGURATION="Release"
DERIVED_DATA_PATH="${PACKAGE_DIR}/.DerivedData"
BUILD_PRODUCTS_PATH="${DERIVED_DATA_PATH}/Build/Products"

CLEAN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --clean)
      CLEAN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Use colors only when stdout is a terminal.
if [[ -t 1 ]]; then
  BLUE="\033[34m"
  RESET="\033[0m"
else
  BLUE=""
  RESET=""
fi

log() {
  echo -e "${BLUE}[${PACKAGE_NAME}]${RESET} $1"
}

# Directories and files that affect the build output.
SOURCE_DIRS=(
  "${PACKAGE_DIR}/Sources/ExpoModulesJSI"
  "${PACKAGE_DIR}/Sources/ExpoModulesJSI-Cxx"
  "${PACKAGE_DIR}/APINotes"
)
SOURCE_FILES=(
  "${PACKAGE_DIR}/Package.swift"
  "${PACKAGE_DIR}/scripts/build-xcframework.sh"
  # Dep xcframework identity — forces a rebuild when deps change (e.g. after
  # an RN upgrade). Info.plist contains version metadata and is read through
  # the symlink, so a new underlying dep invalidates the hash.
  "${PACKAGE_DIR}/Sources/React/React.xcframework/Info.plist"
  "${PACKAGE_DIR}/Sources/ReactNativeDependencies/ReactNativeDependencies.xcframework/Info.plist"
  "${PACKAGE_DIR}/Sources/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework/Info.plist"
)

# Computes a SHA256 hash of all source files.
compute_hash() {
  local all_files
  all_files=$(
    for dir in "${SOURCE_DIRS[@]}"; do
      find "$dir" -type f
    done
    for file in "${SOURCE_FILES[@]}"; do
      [[ -f "$file" ]] && echo "$file"
    done
  )
  # Force C locale so sort order is consistent regardless of the environment.
  # Xcode build phases run without locale variables, which changes sort ordering.
  (
    # Include PODS_ROOT so switching between worktrees invalidates the cache.
    echo "PODS_ROOT=${PODS_ROOT:-}"
    echo "$all_files" | LC_ALL=C sort | while IFS= read -r file; do
      echo "$file"
      cat "$file"
    done
  ) | shasum -a 256 | cut -d' ' -f1
}

# Resolves the xcodebuild destination for a given platform name.
platform_destination() {
  case "$1" in
    iphoneos)         echo "iOS" ;;
    iphonesimulator)  echo "iOS Simulator" ;;
    appletvos)        echo "tvOS" ;;
    appletvsimulator) echo "tvOS Simulator" ;;
    macosx)           echo "macOS" ;;
    *)
      log "error: Unsupported platform: $1"
      exit 1
      ;;
  esac
}

# Builds a single framework slice for a given platform and stages it.
build_slice() {
  local platform="$1"
  local destination
  destination=$(platform_destination "$platform")
  local build_dir_name="${CONFIGURATION}-${platform}"

  log "Building framework slice for ${platform}..."

  rm -rf "$BUILD_PRODUCTS_PATH"

  # Use env -i to clear inherited Xcode environment variables from the parent build.
  # Without this, the nested xcodebuild inherits SDKROOT, PLATFORM_NAME, etc.
  # which causes SDK/platform mismatches.
  # Run from PACKAGE_DIR so xcodebuild finds the SPM package, not the Pods project.
  (cd "$PACKAGE_DIR" && env -i PATH="$PATH" HOME="$HOME" \
    xcodebuild \
    build \
    -scheme "$PACKAGE_NAME" \
    -sdk "$platform" \
    -destination "generic/platform=${destination}" \
    -derivedDataPath "$DERIVED_DATA_PATH" \
    -configuration "$CONFIGURATION" \
    -quiet \
    -disableAutomaticPackageResolution \
    -skipPackagePluginValidation \
    -skipMacroValidation \
    -parallelizeTargets \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    SKIP_INSTALL=NO \
    DEBUG_INFORMATION_FORMAT=dwarf-with-dsym \
    COMPILER_INDEX_STORE_ENABLE=NO \
    SWIFT_COMPILATION_MODE=wholemodule \
  )

  local product_path="${BUILD_PRODUCTS_PATH}/${build_dir_name}"
  local framework_path="${product_path}/PackageFrameworks/${PACKAGE_NAME}.framework"
  local swiftmodule_src="${product_path}/${PACKAGE_NAME}.swiftmodule"
  local generated_maps="${DERIVED_DATA_PATH}/Build/Intermediates.noindex/GeneratedModuleMaps-${platform}"

  # Stage the built slice for this platform.
  local slice_staging="${SLICES_DIR}/${platform}"
  rm -rf "$slice_staging"
  mkdir -p "$slice_staging"

  cp -r "$framework_path" "$slice_staging/"
  if [[ -d "${product_path}/${PACKAGE_NAME}.framework.dSYM" ]]; then
    cp -r "${product_path}/${PACKAGE_NAME}.framework.dSYM" "$slice_staging/"
  fi

  # Copy Swift module interfaces and generated headers into the staged framework.
  local modules_dir="${slice_staging}/${PACKAGE_NAME}.framework/Modules"
  mkdir -p "$modules_dir"
  cp -r "$swiftmodule_src/" "${modules_dir}/${PACKAGE_NAME}.swiftmodule"
  rm -rf "${modules_dir}/${PACKAGE_NAME}.swiftmodule/Project"

  # Remove private/package interfaces which reference package-internal and C++ types
  # that external consumers can't resolve.
  find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -type f \
    \( -name '*.private.swiftinterface' -o -name '*.package.swiftinterface' \) -delete

  # Strip declarations from public .swiftinterface that external consumers can't resolve:
  # - C++ type extensions (__ObjC) — entire blocks including their closing braces
  #   e.g. "extension __ObjC.expo.CppError : Swift.Error { ... }"
  # - Package-internal conformances (_ConstraintThatIsNotPartOfTheAPIOfThisLibrary)
  #   e.g. "extension Swift.Optional : where Wrapped : _Constraint... {}"
  # - @usableFromInline attributes preceding the _Constraint protocol definition
  #   e.g. "@usableFromInline\ninternal protocol _ConstraintThatIsNotPartOfTheAPIOfThisLibrary {}"
  # NOTE: If these patterns change in a future Swift version, the build will fail with
  # "expected declaration" or "expected type" errors in the .swiftinterface file.
  find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -name '*.swiftinterface' \
    -exec sed -i '' '/^extension __ObjC\./,/^}/d;/^@usableFromInline$/{N;/_ConstraintThatIsNotPartOfTheAPIOfThisLibrary/d;};/_ConstraintThatIsNotPartOfTheAPIOfThisLibrary/d' {} +

  local headers_dir="${slice_staging}/${PACKAGE_NAME}.framework/Headers"
  mkdir -p "$headers_dir"
  cp "${generated_maps}/${PACKAGE_NAME}-Swift.h" "$headers_dir/"
  cp "${generated_maps}/${PACKAGE_NAME}.modulemap" "$headers_dir/module.modulemap"
}

# Assembles the xcframework from all staged slices.
assemble_xcframework() {
  rm -rf "$XCFRAMEWORK_PATH"

  local xcframework_args=()
  for slice_dir in "${SLICES_DIR}"/*/; do
    local framework="${slice_dir}${PACKAGE_NAME}.framework"
    local dsym="${slice_dir}${PACKAGE_NAME}.framework.dSYM"
    if [[ -d "$framework" ]]; then
      xcframework_args+=(-framework "$framework")
      if [[ -d "$dsym" ]]; then
        xcframework_args+=(-debug-symbols "$(cd "$dsym" && pwd)")
      fi
    fi
  done

  xcodebuild -create-xcframework "${xcframework_args[@]}" -output "$XCFRAMEWORK_PATH"

  # Write the hash so subsequent builds can skip if nothing changed.
  mkdir -p "$SLICES_DIR"
  echo "$current_hash" > "$HASH_FILE"
}

# Creates symlinks from Sources/ to the dependency xcframeworks in the Pods directory.
# This allows Package.swift to reference them via local paths without committing them.
symlink_dependencies() {
  if [[ -z "${PODS_ROOT:-}" ]]; then
    log "error: PODS_ROOT is not set. Run this script as a CocoaPods build phase or set PODS_ROOT manually."
    exit 1
  fi

  local sources="${PACKAGE_DIR}/Sources"

  # hermes-engine and React are committed directories containing files that
  # can't come from Pods (module.modulemap, VFS overlay). Only their
  # heavy subdirectories are symlinked. `ln -sfn` atomically replaces an
  # existing symlink so we recover from dangling links and keep the target
  # in sync when PODS_ROOT changes.
  local hermes_destroot="${sources}/hermes-engine/destroot"
  if [[ -d "${PODS_ROOT}/hermes-engine/destroot" ]]; then
    [[ -d "$hermes_destroot" && ! -L "$hermes_destroot" ]] && rm -rf "$hermes_destroot"
    ln -sfn "${PODS_ROOT}/hermes-engine/destroot" "$hermes_destroot"
  fi

  local react_xcframework="${sources}/React/React.xcframework"
  if [[ -d "${PODS_ROOT}/React-Core-prebuilt/React.xcframework" ]]; then
    [[ -d "$react_xcframework" && ! -L "$react_xcframework" ]] && rm -rf "$react_xcframework"
    ln -sfn "${PODS_ROOT}/React-Core-prebuilt/React.xcframework" "$react_xcframework"
  fi

  local rndeps_xcframework="${sources}/ReactNativeDependencies/ReactNativeDependencies.xcframework"
  if [[ -d "${PODS_ROOT}/ReactNativeDependencies/framework/packages/react-native/ReactNativeDependencies.xcframework" ]]; then
    [[ -d "$rndeps_xcframework" && ! -L "$rndeps_xcframework" ]] && rm -rf "$rndeps_xcframework"
    ln -sfn "${PODS_ROOT}/ReactNativeDependencies/framework/packages/react-native/ReactNativeDependencies.xcframework" "$rndeps_xcframework"
  fi

  # Generate the VFS overlay with paths matching the local Sources/React directory.
  # The Pods VFS uses absolute Pods paths which don't match when the compiler
  # resolves headers through our symlinked Sources/React path.
  # Regenerate when the Pods source is newer (e.g. after a React Native upgrade).
  local vfs_output="${sources}/React/React-VFS.yaml"
  local vfs_source="${PODS_ROOT}/React-Core-prebuilt/React-VFS.yaml"
  if [[ -f "$vfs_source" ]] && [[ ! -f "$vfs_output" || "$vfs_source" -nt "$vfs_output" ]]; then
    log "Regenerating React VFS overlay"
    sed "s|${PODS_ROOT}/React-Core-prebuilt|${sources}/React|g" "$vfs_source" > "$vfs_output"
  fi
}

# --- Main ---

if [[ -n "${PODS_ROOT:-}" ]]; then
  # Resolve to an absolute path so symlinks and the build hash are stable
  # regardless of whether PODS_ROOT was passed as relative or absolute.
  PODS_ROOT="$(cd "$PODS_ROOT" && pwd)"
fi

if [[ "$CLEAN" == true ]]; then
  rm -rf "$XCFRAMEWORK_PATH" "$SLICES_DIR"
  log "Cleaned existing xcframework and staged slices"
fi

symlink_dependencies

# Determine which platforms to build.
if [[ -n "$PLATFORM_NAME" ]]; then
  PLATFORMS=("$PLATFORM_NAME")
else
  PLATFORMS=("iphoneos" "iphonesimulator")
fi

current_hash=$(compute_hash)

# Check if sources have changed since the last build.
if [[ -f "$HASH_FILE" ]]; then
  previous_hash=$(cat "$HASH_FILE")
  if [[ "$current_hash" == "$previous_hash" ]]; then
    # Sources haven't changed — filter out platforms that already have a staged slice.
    platforms_to_build=()
    for platform in "${PLATFORMS[@]}"; do
      if [[ ! -d "${SLICES_DIR}/${platform}/${PACKAGE_NAME}.framework" ]]; then
        platforms_to_build+=("$platform")
      fi
    done

    if [[ ${#platforms_to_build[@]} -eq 0 ]]; then
      log "xcframework is up to date, skipping build"
      exit 0
    fi

    PLATFORMS=("${platforms_to_build[@]}")
  else
    # Sources changed — remove all staged slices so they get rebuilt.
    log "Source files changed, rebuilding all slices"
    rm -rf "$SLICES_DIR" "$XCFRAMEWORK_PATH"
  fi
fi

SECONDS=0

for platform in "${PLATFORMS[@]}"; do
  build_slice "$platform"
done

assemble_xcframework

SLICE_NAMES=$(for d in "${XCFRAMEWORK_PATH}"/*/; do basename "$d"; done | paste -sd', ' - | sed 's/,/, /g')
log "Built xcframework successfully in ${SECONDS}s (${SLICE_NAMES})"
