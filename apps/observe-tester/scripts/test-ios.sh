#!/usr/bin/env bash
# Run the iOS unit-test schemes for ExpoAppMetrics and ExpoObserve against
# the currently booted iOS simulator. If none is booted, the newest
# available iPhone simulator is booted automatically.

set -euo pipefail

cd "$(dirname "$0")/.."

UDID=$(xcrun simctl list devices booted -j | \
  jq -r '[.devices | to_entries[] | select(.key|test("iOS")) | .value[]] | .[0].udid // empty')

if [[ -z "$UDID" ]]; then
  PICK=$(xcrun simctl list devices available -j | jq -r '
    [ .devices | to_entries[]
      | select(.key | test("SimRuntime\\.iOS-"))
      | .key as $rt
      | (($rt | capture("iOS-(?<maj>[0-9]+)(-(?<min>[0-9]+))?")) as $v
         | (($v.maj|tonumber) * 1000 + (($v.min // "0")|tonumber))) as $ver
      | .value[]
      | select(.isAvailable)
      | {udid, name, ver: $ver, iphone: (.name | test("^iPhone"))}
    ]
    | sort_by([-.ver, (if .iphone then 0 else 1 end), .name])
    | .[0] | "\(.udid)\t\(.name)" // empty')

  if [[ -z "$PICK" ]]; then
    echo "error: no iOS simulator is booted and none is available to boot." >&2
    echo "Install an iOS simulator runtime via Xcode (Settings > Components), then rerun \`pnpm test:ios\`." >&2
    exit 1
  fi

  UDID=${PICK%%$'\t'*}
  NAME=${PICK#*$'\t'}
  echo "No simulator booted; booting $NAME ($UDID)..."
  xcrun simctl boot "$UDID"
fi

echo "Running iOS unit tests against simulator: $UDID"

if command -v xcbeautify >/dev/null 2>&1; then
  FORMATTER=(xcbeautify)
else
  FORMATTER=(cat)
fi

xcodebuild test \
  -workspace ios/Observe.xcworkspace \
  -scheme ExpoAppMetrics-Unit-Tests \
  -destination "id=$UDID" | "${FORMATTER[@]}"

xcodebuild test \
  -workspace ios/Observe.xcworkspace \
  -scheme ExpoObserve-Unit-Tests \
  -destination "id=$UDID" | "${FORMATTER[@]}"
