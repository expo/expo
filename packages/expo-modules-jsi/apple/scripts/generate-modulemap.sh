#!/bin/bash
#
# Writes `.generated/module.modulemap` for the `jsi` Clang module.
#
# Headers are referenced by absolute path so the modulemap works regardless of
# where Pods lives. The `Pods/Headers/Public` path exists in non-frameworks and
# prebuilt-RN layouts; under static frameworks + source-built RN it doesn't, so
# we fall back to the canonical RN source. Stored outside `.build/` so SwiftPM
# state can be wiped without losing this file.
#
# Idempotent: re-running with the same inputs rewrites identical content.
# Switching PODS_ROOT updates the header paths.
#
# Used by build-xcframework.sh and test.sh; can also be run manually before
# opening the package in Xcode.
#
# Usage:
#   PODS_ROOT=/path/to/Pods scripts/generate-modulemap.sh

set -eo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${PODS_ROOT:-}" ]]; then
  echo "error: PODS_ROOT is not set" >&2
  exit 1
fi
if [[ ! -d "$PODS_ROOT" ]]; then
  echo "error: PODS_ROOT does not exist: $PODS_ROOT" >&2
  exit 1
fi
PODS_ROOT="$(cd "$PODS_ROOT" && pwd)"

GENERATED_DIR="${PACKAGE_DIR}/.generated"
GENERATED_MODULE_MAP="${GENERATED_DIR}/module.modulemap"
mkdir -p "$GENERATED_DIR"

JSI_HEADER="${PODS_ROOT}/Headers/Public/React-jsi/jsi/jsi.h"
if [[ ! -f "$JSI_HEADER" ]]; then
  # Resolution order matches build-xcframework.sh: RN_ROOT (forwarded by the
  # build script), REACT_NATIVE_PATH (exported by Xcode for hosts like Expo Go
  # that build RN from a submodule), node resolve, then a relative fallback.
  RN="${RN_ROOT:-${REACT_NATIVE_PATH:-$(node -p 'require("path").dirname(require.resolve("react-native/package.json"))' 2>/dev/null || echo "${PODS_ROOT}/../../node_modules/react-native")}}"
  JSI_HEADER="${RN}/ReactCommon/jsi/jsi/jsi.h"
fi
[[ -f "$JSI_HEADER" ]] || { echo "error: cannot locate jsi.h" >&2; exit 1; }

JSI_DIR="$(dirname "$JSI_HEADER")"

# The two headers this package includes, listed one by one instead of behind an `umbrella header`.
# An umbrella claims every header sitting next to jsi.h, and the JSI pod ships several that jsi.h
# doesn't include (decorator.h, hermes-interfaces.h, JSIDynamic.h, jsilib.h, threadsafe.h). Clang
# warns "umbrella header for module 'jsi' does not include header ..." once per file, on every
# build of every slice. JSIDynamic.h would also pull in folly.
# jsi-inl.h needs no entry: jsi.h includes it, and Clang takes it textually from there.
JSI_HEADERS=""
for header in jsi.h instrumentation.h; do
  if [[ -f "${JSI_DIR}/${header}" ]]; then
    JSI_HEADERS="${JSI_HEADERS}
  header \"${JSI_DIR}/${header}\""
  fi
done

# Avoid touching the file when contents would be identical, so the xcframework
# hash cache and Xcode don't see a spurious change when inputs are unchanged.
#
# No `module * { export * }`: inferred submodules require an umbrella, and with headers listed
# explicitly there are no submodules to infer.
NEW_CONTENT="module jsi {${JSI_HEADERS}

  export *
}"
if [[ ! -f "$GENERATED_MODULE_MAP" ]] || [[ "$(cat "$GENERATED_MODULE_MAP")" != "$NEW_CONTENT" ]]; then
  printf '%s\n' "$NEW_CONTENT" > "$GENERATED_MODULE_MAP"
fi
