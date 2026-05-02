#!/usr/bin/env bash
# Run the iOS unit-test schemes for ExpoAppMetrics and ExpoObserve against
# whichever iOS simulator is currently booted. Boot a simulator first
# (e.g. via `xcrun simctl boot <name>` or by opening Simulator.app) and
# then run `pnpm test:ios` from this app's directory.

set -euo pipefail

cd "$(dirname "$0")/.."

UDID=$(xcrun simctl list devices available -j | \
  jq -r '.devices | to_entries | map(select(.key|test("iOS"))) | .[-1].value | map(select(.isAvailable)) | .[0].udid')

echo "Running iOS unit tests against simulator: $UDID"

xcodebuild test \
  -workspace ios/Observe.xcworkspace \
  -scheme ExpoAppMetrics-Unit-Tests \
  -destination "id=$UDID"

xcodebuild test \
  -workspace ios/Observe.xcworkspace \
  -scheme ExpoObserve-Unit-Tests \
  -destination "id=$UDID"
