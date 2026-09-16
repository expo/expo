#!/usr/bin/env bash
# Run the agent-device e2e scripts for one platform.
#
#   ./run-agent-device.sh ios "iPhone 17 Pro (26.4)" [artifacts-dir] [script-or-dir...]
#   ./run-agent-device.sh android "Pixel 8a big"
#   ./run-agent-device.sh ios auto            # first booted simulator or emulator
#
# Cross-platform scripts have no `context platform` header. Platform-specific scripts end
# in `.ios.ad` or `.android.ad`. The app id reaches scripts as ${APP_ID}.
set -euo pipefail

platform="${1:?platform (ios|android)}"
device="${2:?device name as listed by 'agent-device devices', or auto}"
artifacts="${3:-$(mktemp -d)/agent-device-artifacts}"
shift 3 2>/dev/null || shift $#

cd "$(dirname "$0")"

case "$platform" in
  ios) app_id="dev.expo.Payments"; other="android"; kind="ios simulator" ;;
  android) app_id="dev.expo.payments"; other="ios"; kind="android emulator" ;;
  *) echo "unknown platform: $platform" >&2; exit 2 ;;
esac

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  targets=(.)
fi
scripts=()
while IFS= read -r file; do
  scripts+=("$file")
done < <(find "${targets[@]}" -name '*.ad' -not -name "*.${other}.ad" -not -path '*/.agent-device/*' | sort)
if [ ${#scripts[@]} -eq 0 ]; then
  echo "no .ad scripts found under: ${targets[*]}" >&2
  exit 2
fi

# A daemon left by an interactive session holds the device lease and makes `test` fail.
# The pattern must not match this script's own command line (run-agent-device.sh): on Linux,
# pkill -f kills the parent shell too and CI reports "exit code null".
agent-device daemon stop --clean >/dev/null 2>&1 || true
pkill -f '(^|[/ ])agent-device([ /]|$)' >/dev/null 2>&1 || true

if [ "$device" = "auto" ]; then
  # `agent-device devices` prints lines like: iPhone 17 Pro (26.4) (ios simulator target=mobile) booted=true
  device="$(agent-device devices --platform "$platform" 2>/dev/null \
    | grep "($kind " | grep 'booted=true' | head -1 | sed "s/ ($kind .*//")"
  if [ -z "$device" ]; then
    echo "no booted $kind found; boot one or pass a device name" >&2
    exit 2
  fi
fi

if [ "$platform" = "ios" ]; then
  # Pre-approve the "Open in BareExpo?" deep-link prompt, the way start-ios-e2e-test.ts does.
  udid="$(xcrun simctl list devices booted -j | python3 -c '
import json, sys
name = sys.argv[1]
for devs in json.load(sys.stdin)["devices"].values():
    for d in devs:
        if d["name"].startswith(name):
            print(d["udid"])
            sys.exit()
' "${device%% (*}" 2>/dev/null || true)"
  if [ -n "$udid" ]; then
    xcrun simctl spawn "$udid" defaults write com.apple.launchservices.schemeapproval \
      'com.apple.CoreSimulator.CoreSimulatorBridge-->bareexpo' -string "$app_id" >/dev/null 2>&1 || true
  fi
fi

if [ "$platform" = "android" ] && command -v adb >/dev/null 2>&1; then
  # A fresh emulator shows the system's "swipe down to exit full screen" hint the first time an
  # app enters immersive mode. The hint owns the accessibility window and hides the app's
  # controls, so confirm it up front on every connected emulator.
  for serial in $(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }'); do
    adb -s "$serial" shell settings put secure immersive_mode_confirmations confirmed >/dev/null 2>&1 || true
  done
fi

# Slow CI emulators need more than the 10 s the scripts give a step: an accessibility
# snapshot alone can take that long there. AD_WAIT_SCALE multiplies every numeric wait
# timeout in a temporary copy of the scripts; the committed scripts stay readable.
scale="${AD_WAIT_SCALE:-1}"
if [ "$scale" != "1" ]; then
  scaled="$(mktemp -d)/e2e"
  for f in "${scripts[@]}"; do
    mkdir -p "$scaled/$(dirname "$f")"
    awk -v scale="$scale" '{
      if ($1 == "wait" && $NF ~ /^[0-9]+$/) { $NF = int($NF * scale) }
      print
    }' "$f" > "$scaled/$f"
  done
  cd "$scaled"
fi

mkdir -p "$artifacts"
echo "agent-device test: ${#scripts[@]} script(s) on $platform / $device (wait scale $scale)"
# The daemon that `test` starts reaps itself after 5 idle minutes; a long first script on a CI
# simulator has ended whole suites early without a summary. Disable the reaper for the run.
export AGENT_DEVICE_DAEMON_IDLE_TIMEOUT_MS="${AGENT_DEVICE_DAEMON_IDLE_TIMEOUT_MS:-0}"
status=0
agent-device test "${scripts[@]}" \
  --device "$device" \
  -e "APP_ID=$app_id" \
  --retries "${AD_RETRIES:-1}" \
  --reporter default \
  --reporter "junit:$artifacts/junit.xml" \
  --artifacts-dir "$artifacts" \
  2>&1 | tee "$artifacts/run.log" || status=$?

# Leave the device as we found it. agent-device keeps its iOS XCUITest runner warm after a
# run, and Maestro's own XCTest driver misbehaves next to it; the app must also be stopped so
# a later launch with the screen inspector dylib injects cleanly.
agent-device daemon stop --clean >/dev/null 2>&1 || true
pkill -f '(^|[/ ])agent-device([ /]|$)' >/dev/null 2>&1 || true
# `test` runs on a temporary daemon, so the stop above does not own its XCUITest runner.
pkill -f 'AgentDeviceRunnerUITests' >/dev/null 2>&1 || true
if [ "$platform" = "ios" ] && [ -n "${udid:-}" ]; then
  xcrun simctl terminate "$udid" "$app_id" >/dev/null 2>&1 || true
  # The XCUITest runner apps stay resident on the simulator and keep pulling the foreground.
  for runner_app in com.callstack.agentdevice.runner.uitests.xctrunner com.callstack.agentdevice.runner; do
    xcrun simctl terminate "$udid" "$runner_app" >/dev/null 2>&1 || true
  done
fi
exit $status
