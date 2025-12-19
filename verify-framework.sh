#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  verify-xcframework.sh /path/to/MyLib.xcframework

What it checks:
  - Info.plist parses
  - codesign verify (deep/strict)
  - each slice: lipo/file/otool -hv/-L
  - module/headers presence + clang module import compile
  - Swift: typecheck every *.swiftinterface with swift-frontend
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || "${#}" -ne 1 ]]; then
  usage
  exit 1
fi

XCFRAMEWORK="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
if [[ ! -d "$XCFRAMEWORK" || ! -f "$XCFRAMEWORK/Info.plist" ]]; then
  echo "❌ Not an .xcframework (missing Info.plist): $XCFRAMEWORK" >&2
  exit 2
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing tool: $1" >&2; exit 3; }; }
need plutil
need codesign
need lipo
need file
need otool
need xcrun
need clang

SWIFT_FRONTEND="$(xcrun --find swift-frontend 2>/dev/null || true)"
if [[ -z "$SWIFT_FRONTEND" ]]; then
  echo "❌ Missing swift-frontend (Xcode toolchain not found via xcrun)." >&2
  exit 3
fi

sdk_for_identifier() {
  local id="$1"
  # Common identifiers: ios-arm64, ios-arm64_x86_64-simulator, tvos-..., macos-arm64_x86_64, etc.
  if [[ "$id" == ios*simulator* || "$id" == *-simulator ]]; then
    echo "iphonesimulator"
  elif [[ "$id" == ios* ]]; then
    echo "iphoneos"
  elif [[ "$id" == tvos*simulator* || "$id" == tvos*"-simulator" ]]; then
    echo "appletvsimulator"
  elif [[ "$id" == tvos* ]]; then
    echo "appletvos"
  elif [[ "$id" == watchos*simulator* || "$id" == watchos*"-simulator" ]]; then
    echo "watchsimulator"
  elif [[ "$id" == watchos* ]]; then
    echo "watchos"
  elif [[ "$id" == macos* ]]; then
    echo "macosx"
  else
    # fallback that still lets us run “structure only” checks
    echo ""
  fi
}

echo "== XCFramework =="
echo "$XCFRAMEWORK"
echo

echo "== Info.plist parse =="
plutil -p "$XCFRAMEWORK/Info.plist" >/dev/null
echo "✅ Info.plist is valid"
echo

echo "== codesign verify (deep/strict) =="
if codesign --verify --deep --strict --verbose=2 "$XCFRAMEWORK"; then
  echo "✅ codesign verify ok"
else
  echo "⚠️  codesign verify failed (common for debug/local builds). Continuing."
fi
echo

echo "== “junk file” scan =="
# tweak list to your policy
find "$XCFRAMEWORK" -type f \( \
  -name '*.m' -o -name '*.mm' -o -name '*.cpp' -o -name '*.cc' -o \
  -name '*.hmap' -o -name '*.pch' -o -name '*.xcconfig' \
\) -print | sed 's/^/⚠️  suspicious file: /' || true
echo

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "== Slices =="
# Each slice is a folder containing a *.framework
mapfile -t FRAMEWORK_DIRS < <(find "$XCFRAMEWORK" -maxdepth 2 -type d -name '*.framework' | sort)

if [[ "${#FRAMEWORK_DIRS[@]}" -eq 0 ]]; then
  echo "❌ No .framework slices found inside: $XCFRAMEWORK" >&2
  exit 4
fi

for FW in "${FRAMEWORK_DIRS[@]}"; do
  SLICE_DIR="$(dirname "$FW")"                 # e.g. .../ios-arm64
  SLICE_ID="$(basename "$SLICE_DIR")"          # ios-arm64, ios-arm64_x86_64-simulator, macos-arm64_x86_64, ...
  FW_NAME="$(basename "$FW" .framework)"       # framework name
  BIN="$FW/$FW_NAME"

  echo
  echo "-----------------------------"
  echo "Slice: $SLICE_ID"
  echo "Framework: $FW_NAME"
  echo "-----------------------------"

  if [[ ! -f "$BIN" ]]; then
    echo "❌ Missing binary: $BIN" >&2
    exit 5
  fi

  echo "== Mach-O =="
  lipo -info "$BIN" || true
  file "$BIN" || true
  otool -hv "$BIN" | head -n 25 || true

  echo
  echo "== Linked deps (otool -L) =="
  otool -L "$BIN" || true

  echo
  echo "== Headers/Modules presence =="
  if [[ -d "$FW/Headers" ]]; then
    echo "✅ Headers/ present"
  else
    echo "⚠️  Headers/ missing (might be ok if you’re Swift-only, but usually suspicious for mixed/ObjC)"
  fi

  if [[ -d "$FW/Modules" ]]; then
    echo "✅ Modules/ present"
  else
    echo "❌ Modules/ missing (usually bad for Swift dynamic frameworks)" >&2
    exit 6
  fi

  if [[ -f "$FW/Modules/module.modulemap" ]]; then
    echo "✅ module.modulemap present"
  else
    echo "⚠️  module.modulemap missing (may still work via Swift module, but ObjC @import may fail)"
  fi

  SDK_NAME="$(sdk_for_identifier "$SLICE_ID")"
  SDK_PATH=""
  if [[ -n "$SDK_NAME" ]]; then
    SDK_PATH="$(xcrun --sdk "$SDK_NAME" --show-sdk-path)"
    echo "Using SDK: $SDK_NAME ($SDK_PATH)"
  else
    echo "⚠️  Unknown slice identifier -> skipping compile/typecheck steps that need an SDK: $SLICE_ID"
  fi

  # 1) clang module import compile (catches broken modulemap/umbrella/non-modular headers)
  if [[ -n "$SDK_NAME" ]]; then
    cat > "$TMPDIR/verify_${FW_NAME}_${SLICE_ID}.m" <<EOF
@import Foundation;
@import $FW_NAME;
int main() { return 0; }
EOF

    echo
    echo "== clang @import compile check =="
    clang -fmodules -fobjc-arc \
      -isysroot "$SDK_PATH" \
      -F "$SLICE_DIR" \
      "$TMPDIR/verify_${FW_NAME}_${SLICE_ID}.m" \
      -c -o "$TMPDIR/verify_${FW_NAME}_${SLICE_ID}.o"
    echo "✅ clang module import ok"
  fi

  # 2) Swift interface typecheck for every *.swiftinterface in the slice
  echo
  echo "== Swift .swiftinterface typecheck =="
  mapfile -t SWIFTIFACES < <(find "$FW/Modules" -type f -name '*.swiftinterface' 2>/dev/null | sort || true)

  if [[ "${#SWIFTIFACES[@]}" -eq 0 ]]; then
    echo "❌ No *.swiftinterface found in $FW/Modules (for BUILD_LIBRARY_FOR_DISTRIBUTION frameworks this is usually bad)" >&2
    exit 7
  fi

  if [[ -z "$SDK_NAME" ]]; then
    echo "⚠️  Skipping swift-frontend typecheck (no SDK mapping for $SLICE_ID)"
  else
    for IFACE in "${SWIFTIFACES[@]}"; do
      echo "Typechecking: $(python3 - <<PY
import os,sys
p=sys.argv[1]
print(os.path.relpath(p, "$XCFRAMEWORK"))
PY
"$IFACE")"
      "$SWIFT_FRONTEND" -typecheck \
        "$IFACE" \
        -sdk "$SDK_PATH" \
        -I "$FW/Modules" \
        >/dev/null
    done
    echo "✅ swiftinterface typecheck ok"
  fi
done

echo
echo "✅ All checks passed."