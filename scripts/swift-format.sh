#!/usr/bin/env bash
# Run swift-format against tracked .swift files under the given paths
# (or the current directory if none are given). Pass --lint to check
# without modifying. Reads .swift-format at the repo root.

set -euo pipefail

if command -v swift-format >/dev/null 2>&1; then
  bin=(swift-format)
else
  bin=(xcrun swift-format)
fi

# Keep in sync with SWIFT_FORMAT_VERSION in .github/workflows/swift-format.yml.
# The Xcode-bundled binary reports `6.3.0`; the swift-format Git tag is a 603
# prerelease (no final 603.0.0 has been cut). Both refer to the same series.
readonly EXPECTED_VERSION=603.0.0-prerelease-2026-02-09
readonly EXPECTED_XCODE_VERSION=6.3.0
got_version=$("${bin[@]}" --version 2>/dev/null || true)
if [[ "$got_version" != "$EXPECTED_VERSION" && "$got_version" != "$EXPECTED_XCODE_VERSION" ]]; then
  echo "warning: swift-format $got_version found, CI uses $EXPECTED_VERSION ($EXPECTED_XCODE_VERSION). Output may differ." >&2
fi

mode=format
extra=(--in-place)
if [[ "${1-}" == "--lint" ]]; then
  mode=lint
  extra=(--strict)
  shift
fi

paths=("$@")
[[ ${#paths[@]} -eq 0 ]] && paths=(".")

git ls-files -z -- "${paths[@]}" \
  | tr '\0' '\n' \
  | grep '\.swift$' \
  | xargs "${bin[@]}" "$mode" "${extra[@]}" --parallel
