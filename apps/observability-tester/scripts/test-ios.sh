#!/usr/bin/env bash
# Run the iOS unit-test schemes for ExpoAppMetrics and ExpoObserve against
# whichever iOS simulator is currently booted. Boot a simulator first
# (e.g. via `xcrun simctl boot <name>` or by opening Simulator.app) and
# then run `pnpm test:ios` from this app's directory.

set -euo pipefail

cd "$(dirname "$0")/.."

udid=$(
  xcrun simctl list devices booted -j |
    python3 -c "
import json, sys
data = json.load(sys.stdin).get('devices', {})
for runtime, devices in data.items():
    if 'iOS' not in runtime:
        continue
    for device in devices:
        if device.get('state') == 'Booted':
            print(device['udid'])
            sys.exit(0)
"
)

if [ -z "$udid" ]; then
  echo "No booted iOS simulator found." >&2
  echo "Boot one (e.g. open -a Simulator, or xcrun simctl boot <device>) and re-run." >&2
  exit 1
fi

echo "Running iOS unit tests against booted simulator: $udid"

xcodebuild test \
  -workspace ios/Observe.xcworkspace \
  -scheme ExpoAppMetrics-Unit-Tests \
  -destination "id=$udid"

xcodebuild test \
  -workspace ios/Observe.xcworkspace \
  -scheme ExpoObserve-Unit-Tests \
  -destination "id=$udid"
