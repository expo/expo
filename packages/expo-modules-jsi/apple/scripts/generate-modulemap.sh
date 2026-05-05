#!/bin/bash
#
# Writes `.generated/module.modulemap` for the `jsi` Clang module.
#
# The umbrella header is referenced by absolute path so the modulemap works
# regardless of where Pods lives. The same Pods/Headers/Public/React-jsi/jsi/jsi.h
# path exists in both prebuilt and source-built React Native layouts. Stored
# outside `.build/` so SwiftPM state can be wiped without losing this file.
#
# Idempotent: re-running with the same PODS_ROOT rewrites identical content.
# Switching PODS_ROOT updates the umbrella header path.
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

# Avoid touching the file when contents would be identical, so the xcframework
# hash cache and Xcode don't see a spurious change when PODS_ROOT is unchanged.
NEW_CONTENT="module jsi {
  umbrella header \"${PODS_ROOT}/Headers/Public/React-jsi/jsi/jsi.h\"

  export *
  module * { export * }
}"
if [[ ! -f "$GENERATED_MODULE_MAP" ]] || [[ "$(cat "$GENERATED_MODULE_MAP")" != "$NEW_CONTENT" ]]; then
  printf '%s\n' "$NEW_CONTENT" > "$GENERATED_MODULE_MAP"
fi
