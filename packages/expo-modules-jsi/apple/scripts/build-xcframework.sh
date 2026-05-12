#!/bin/bash
#
# Builds ExpoModulesJSI.xcframework from the SPM package.
#
# This script is intended to run as a CocoaPods build phase (before headers),
# but can also be invoked manually with PODS_ROOT set.
#
# Features:
#   - Per-slice hash-based caching: a slice is rebuilt only when its own
#     recorded source hash differs from the current one. Other slices —
#     including those built for other platforms in earlier runs — are left
#     untouched.
#   - Reads React/JSI/Hermes headers directly from Pods/Headers/Public, so the
#     same configuration works for both prebuilt and source-built React Native
#   - Cleans .swiftinterface files for cross-compiler compatibility
#
# Usage:
#   PODS_ROOT=/path/to/Pods ./build-xcframework.sh [--clean]
#
# Environment:
#   PODS_ROOT       (required) Path to the CocoaPods Pods directory
#   PLATFORM_NAME   (optional) Build for a specific platform (e.g. iphoneos, iphonesimulator).
#                   When unset, builds for both iphoneos and iphonesimulator.

set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_NAME="ExpoModulesJSI"
XCFRAMEWORK_PATH="${PACKAGE_DIR}/Products/${PACKAGE_NAME}.xcframework"

CONFIGURATION="Release"
DERIVED_DATA_PATH="${PACKAGE_DIR}/.DerivedData"
SPM_BUILD_PATH="${PACKAGE_DIR}/.build"
SPM_WORKSPACE_PATH="${PACKAGE_DIR}/.swiftpm"
BUILD_PRODUCTS_PATH="${DERIVED_DATA_PATH}/Build/Products"

source "${PACKAGE_DIR}/scripts/xcframework-helpers.sh"

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
  "${PACKAGE_DIR}/scripts/create-stub-xcframework.sh"
  "${PACKAGE_DIR}/scripts/xcframework-helpers.sh"
)

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
    # Include PODS_ROOT and RN_ROOT so switching between worktrees or RN
    # sources invalidates the cache.
    echo "PODS_ROOT=${PODS_ROOT:-}"
    echo "RN_ROOT=${RN_ROOT:-}"
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

# Resolves the xcframework slice ID that a built platform should land in.
# Mirrors the slice IDs xcodebuild -create-xcframework would have assigned for
# a single-arch device build / dual-arch simulator build.
platform_slice_id() {
  case "$1" in
    iphoneos)         echo "ios-arm64" ;;
    iphonesimulator)  echo "ios-arm64_x86_64-simulator" ;;
    appletvos)        echo "tvos-arm64" ;;
    appletvsimulator) echo "tvos-arm64_x86_64-simulator" ;;
    *)
      log "error: No slice mapping for platform: $1"
      exit 1
      ;;
  esac
}

# Builds a single framework slice for the given platform and replaces the
# matching slice inside XCFRAMEWORK_PATH. Other slices on disk are untouched.
build_slice() {
  local platform="$1"
  local destination
  destination=$(platform_destination "$platform")
  local slice_id
  slice_id=$(platform_slice_id "$platform")
  local build_dir_name="${CONFIGURATION}-${platform}"

  log "Building framework slice for ${platform}..."

  rm -rf "$BUILD_PRODUCTS_PATH"

  # Use env -i to clear inherited Xcode environment variables from the parent build.
  # Without this, the nested xcodebuild inherits SDKROOT, PLATFORM_NAME, etc.
  # which causes SDK/platform mismatches. PODS_ROOT and RN_ROOT are forwarded
  # explicitly because Package.swift reads them to resolve header search paths.
  # Run from PACKAGE_DIR so xcodebuild finds the SPM package, not the Pods project.
  (cd "$PACKAGE_DIR" && env -i PATH="$PATH" HOME="$HOME" PODS_ROOT="$PODS_ROOT" RN_ROOT="$RN_ROOT" \
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
  local framework_src="${product_path}/PackageFrameworks/${PACKAGE_NAME}.framework"
  local swiftmodule_src="${product_path}/${PACKAGE_NAME}.swiftmodule"
  local generated_maps="${DERIVED_DATA_PATH}/Build/Intermediates.noindex/GeneratedModuleMaps-${platform}"

  if [[ ! -d "$framework_src" ]]; then
    log "error: xcodebuild did not produce ${framework_src}"
    exit 1
  fi

  # Replace the slice in place. Stage to a temp location first so a partial
  # write can't leave the xcframework in a broken state.
  local slice_dir="${XCFRAMEWORK_PATH}/${slice_id}"
  local staging_dir="${XCFRAMEWORK_PATH}/.${slice_id}.new"
  rm -rf "$staging_dir"
  mkdir -p "$staging_dir"

  cp -r "$framework_src" "$staging_dir/"
  if [[ -d "${product_path}/${PACKAGE_NAME}.framework.dSYM" ]]; then
    cp -r "${product_path}/${PACKAGE_NAME}.framework.dSYM" "$staging_dir/"
  fi

  # Copy Swift module interfaces and generated headers into the staged framework.
  local modules_dir="${staging_dir}/${PACKAGE_NAME}.framework/Modules"
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

  local headers_dir="${staging_dir}/${PACKAGE_NAME}.framework/Headers"
  mkdir -p "$headers_dir"
  cp "${generated_maps}/${PACKAGE_NAME}-Swift.h" "$headers_dir/"
  cp "${generated_maps}/${PACKAGE_NAME}.modulemap" "$headers_dir/module.modulemap"

  echo "$current_hash" > "${staging_dir}/.build-hash"

  rm -rf "$slice_dir"
  mv "$staging_dir" "$slice_dir"
}

# --- Main ---

# PODS_ROOT is set by the CocoaPods build phase; fall back to bare-expo's
# Pods (via direnv's EXPO_ROOT_DIR, with a script-relative computation as a
# last resort) so manual / npm-script invocations also work.
if [[ -z "${PODS_ROOT:-}" ]]; then
  : "${EXPO_ROOT_DIR:=$(cd "${PACKAGE_DIR}/../../.." && pwd)}"
  PODS_ROOT="${EXPO_ROOT_DIR}/apps/bare-expo/ios/Pods"
fi
if [[ ! -d "$PODS_ROOT" ]]; then
  log "error: PODS_ROOT does not exist: $PODS_ROOT"
  log "       Run \`pod install\` in apps/bare-expo/ios first, or set PODS_ROOT explicitly."
  exit 1
fi

# Resolve to an absolute path so the build hash is stable regardless of
# whether PODS_ROOT was passed as relative or absolute.
PODS_ROOT="$(cd "$PODS_ROOT" && pwd)"

# Resolve react-native. Order:
#   1. REACT_NATIVE_PATH env var (set by Xcode from the Podfile's build setting)
#      — for hosts that build RN from a non-npm location, e.g. Expo Go which
#      uses the `react-native-lab/react-native` submodule, not node_modules.
#   2. `node -p require.resolve(...)` so the script works in any node_modules
#      layout (hoisted monorepos, pnpm/yarn workspaces).
#   3. Relative fallback from PODS_ROOT for when `node` isn't on PATH.
# Forwarded to Package.swift and the modulemap generator below.
if [[ -n "${REACT_NATIVE_PATH:-}" && -d "${REACT_NATIVE_PATH}" ]]; then
  RN_ROOT="$(cd "$REACT_NATIVE_PATH" && pwd)"
else
  RN_ROOT="$(node -p 'require("path").dirname(require.resolve("react-native/package.json"))' 2>/dev/null \
    || echo "${PODS_ROOT}/../../node_modules/react-native")"
fi

mode="$( [[ -d "${PODS_ROOT}/React-Core-prebuilt/React.xcframework" ]] && echo "prebuilt RN" || echo "source-built RN")"
[[ -f "${PODS_ROOT}/Target Support Files/React-jsi/React-jsi-umbrella.h" ]] && mode="${mode}, static frameworks"
log "Detected: ${mode} (RN_ROOT=${RN_ROOT})"

# React Native version — forces a rebuild after an RN upgrade. The local
# podspec is regenerated by `pod install` and only changes when the underlying
# RN version changes.
if [[ -f "${PODS_ROOT}/Local Podspecs/React-Core.podspec.json" ]]; then
  SOURCE_FILES+=("${PODS_ROOT}/Local Podspecs/React-Core.podspec.json")
fi

# Generate the module map for the `jsi` Clang module.
env PODS_ROOT="$PODS_ROOT" RN_ROOT="$RN_ROOT" "${PACKAGE_DIR}/scripts/generate-modulemap.sh"
GENERATED_MODULE_MAP="${PACKAGE_DIR}/.generated/module.modulemap"
SOURCE_FILES+=("$GENERATED_MODULE_MAP")

if [[ "$CLEAN" == true ]]; then
  rm -rf "$XCFRAMEWORK_PATH" "$DERIVED_DATA_PATH" "$SPM_BUILD_PATH" "$SPM_WORKSPACE_PATH"
  log "Cleaned existing xcframework, DerivedData, and SwiftPM state"
  # Re-stamp stub slices so the post-clean state matches a fresh `pod install`:
  # CocoaPods reads Info.plist before this script runs, and would fail to
  # resolve any slice not declared there.
  "${PACKAGE_DIR}/scripts/create-stub-xcframework.sh"
fi

# Determine which platforms to build.
if [[ -n "${PLATFORM_NAME:-}" ]]; then
  PLATFORMS=("$PLATFORM_NAME")
else
  PLATFORMS=("iphoneos" "iphonesimulator")
fi

current_hash=$(compute_hash)

# Filter out platforms whose slice is already up to date.
platforms_to_build=()
for platform in "${PLATFORMS[@]}"; do
  slice_id=$(platform_slice_id "$platform")
  slice_hash_file="${XCFRAMEWORK_PATH}/${slice_id}/.build-hash"
  if [[ -f "$slice_hash_file" ]] && [[ "$(cat "$slice_hash_file")" == "$current_hash" ]]; then
    continue
  fi
  platforms_to_build+=("$platform")
done

if [[ ${#platforms_to_build[@]} -eq 0 ]]; then
  log "xcframework slices up to date, skipping build"
  exit 0
fi

PLATFORMS=("${platforms_to_build[@]}")

SECONDS=0

for platform in "${PLATFORMS[@]}"; do
  build_slice "$platform"
done

write_xcframework_plist "$XCFRAMEWORK_PATH" "$PACKAGE_NAME"

SLICE_NAMES=$(for d in "${XCFRAMEWORK_PATH}"/*/; do basename "$d"; done | LC_ALL=C sort | tr '\n' ',' | sed 's/,$//;s/,/, /g')
log "Built xcframework successfully in ${SECONDS}s (${SLICE_NAMES})"
