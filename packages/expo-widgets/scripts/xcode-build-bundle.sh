#!/usr/bin/env bash

set -eo pipefail

EXPO_WIDGETS_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# NOTE: Early exit for non-Pods PROJECT_DIR removed — it prevented JS bundle
# generation during `npx expo run:ios` (basename = "ios", not "Pods").
# The build script is idempotent, so running it in both contexts is safe.

# If PROJECT_ROOT is not specified, fallback to use Xcode PROJECT_DIR
PROJECT_ROOT=${PROJECT_ROOT:-"$PROJECT_DIR/../.."}
PROJECT_ROOT=${PROJECT_ROOT:-"$EXPO_WIDGETS_PACKAGE_DIR/../.."}

cd "$PROJECT_ROOT" || exit

"${EXPO_WIDGETS_PACKAGE_DIR}/scripts/with-node.sh" "${EXPO_WIDGETS_PACKAGE_DIR}/scripts/build-bundle.mjs" "$PROJECT_ROOT"
