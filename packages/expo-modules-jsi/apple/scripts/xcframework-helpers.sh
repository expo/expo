# Shared helpers for managing ExpoModulesJSI.xcframework.
#
# Sourced by create-stub-xcframework.sh and build-xcframework.sh. Defines the
# canonical slice metadata and the Info.plist writer used by both scripts so
# the manifest is produced from a single place.

# All slice IDs known to the xcframework, mapped to their plist metadata.
# CocoaPods reads Info.plist at `pod install` time and generates a per-slice
# copy script; any slice missing from this table will be skipped by
# write_xcframework_plist with a warning.
#
# Format: slice_id|platform|variant|archs
EXPO_MODULES_JSI_KNOWN_SLICES=(
  "ios-arm64|ios||arm64"
  "ios-arm64_x86_64-simulator|ios|simulator|arm64 x86_64"
  "tvos-arm64|tvos||arm64"
  "tvos-arm64_x86_64-simulator|tvos|simulator|arm64 x86_64"
)

# Slice IDs the xcframework must always declare, even when only a subset has
# been built. The stub script materializes empty placeholders for any of these
# missing on disk so CocoaPods can wire up copy/embed phases for every target
# the podspec supports.
EXPO_MODULES_JSI_REQUIRED_SLICE_IDS=(
  "ios-arm64"
  "ios-arm64_x86_64-simulator"
  "tvos-arm64"
  "tvos-arm64_x86_64-simulator"
)

# xcframework_slice_descriptor SLICE_ID
# Echoes the descriptor row for SLICE_ID, or returns 1 if SLICE_ID is unknown.
xcframework_slice_descriptor() {
  local slice_id="$1"
  local entry
  for entry in "${EXPO_MODULES_JSI_KNOWN_SLICES[@]}"; do
    if [[ "${entry%%|*}" == "$slice_id" ]]; then
      echo "$entry"
      return 0
    fi
  done
  return 1
}

# write_xcframework_plist XCFRAMEWORK_PATH PACKAGE_NAME
# Writes Info.plist describing every slice directory currently inside
# XCFRAMEWORK_PATH. Slices are sorted by ID for deterministic output. Slice
# directories not listed in EXPO_MODULES_JSI_KNOWN_SLICES are skipped with a
# warning so callers can spot missing metadata instead of silently shipping a
# slice CocoaPods can't describe.
write_xcframework_plist() {
  local xcframework_path="$1"
  local package_name="$2"

  local slice_dirs=()
  local entry
  for entry in "${xcframework_path}"/*/; do
    [[ -d "$entry" ]] || continue
    slice_dirs+=("$(basename "$entry")")
  done

  local sorted_slices=()
  while IFS= read -r line; do
    sorted_slices+=("$line")
  done < <(printf '%s\n' "${slice_dirs[@]}" | LC_ALL=C sort)

  local available_libraries=""
  local slice_id
  for slice_id in "${sorted_slices[@]}"; do
    local descriptor
    if ! descriptor=$(xcframework_slice_descriptor "$slice_id"); then
      echo "warning: skipping slice '${slice_id}' — not in EXPO_MODULES_JSI_KNOWN_SLICES" >&2
      continue
    fi

    local platform variant archs
    IFS='|' read -r _ platform variant archs <<<"$descriptor"

    local arch_entries=""
    local arch
    for arch in $archs; do
      arch_entries+="        <string>${arch}</string>
"
    done

    local variant_entry=""
    if [[ -n "$variant" ]]; then
      variant_entry="      <key>SupportedPlatformVariant</key>
      <string>${variant}</string>
"
    fi

    available_libraries+="    <dict>
      <key>BinaryPath</key>
      <string>${package_name}.framework/${package_name}</string>
      <key>LibraryIdentifier</key>
      <string>${slice_id}</string>
      <key>LibraryPath</key>
      <string>${package_name}.framework</string>
      <key>SupportedArchitectures</key>
      <array>
${arch_entries}      </array>
      <key>SupportedPlatform</key>
      <string>${platform}</string>
${variant_entry}    </dict>
"
  done

  cat > "${xcframework_path}/Info.plist" <<PLIST
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
}
