#!/usr/bin/env bash
set -euo pipefail
package_dir="$(cd "$(dirname "$0")/.." && pwd)"
build_dir="$(mktemp -d)"
trap 'rm -rf "$build_dir"' EXIT
cp "$package_dir/tests/test_BackgroundSessionCompletion.swift" "$build_dir/main.swift"
swiftc -module-cache-path "$build_dir/cache" "$package_dir/ios/BackgroundSessionCompletion.swift" "$build_dir/main.swift" -o "$build_dir/test-completion"
"$build_dir/test-completion"
