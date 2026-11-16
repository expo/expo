#!/bin/bash

# Executes a suite of Maestro tests tests defined in a YAML file

if [[ "$#" -ne 3 ]]; then
  echo "Usage: $0 <test_suite_path> <ios|android> <debug|release>"
  exit 1
fi

. .env
export MAESTRO_TEST_SUITE=$1
export MAESTRO_PLATFORM=$2
export MAESTRO_CONFIGURATION=$3
export MAESTRO_UPDATES_SERVER_PORT=$EXPO_PUBLIC_UPDATES_SERVER_PORT

function killUpdatesServerIfNeeded() {
  UPDATES_SERVER_PID=$(lsof -t -i:$MAESTRO_UPDATES_SERVER_PORT || true)
  if [[ -n "$UPDATES_SERVER_PID" ]]; then
    echo "Killing updates server with PID $UPDATES_SERVER_PID"
    kill -9 $UPDATES_SERVER_PID
  fi
}

function startUpdatesServerIfNeeded() {
  UPDATES_SERVER_PID=$(lsof -t -i:$MAESTRO_UPDATES_SERVER_PORT || true)
  if [[ -n "$UPDATES_SERVER_PID" ]]; then
    echo "Updates server already running with PID $UPDATES_SERVER_PID"
  else
    echo "Starting updates server"
    pnpm ts-node ./maestro/updates-server/start.ts >/dev/null 2>&1 &
  fi
}

function cleanup()
{
  local exit_code=$?
  # Maestro only reports which element it could not find, which is indistinguishable between a
  # missing test ID and an app that crashed on launch. Dump the device log on failure — to stdout,
  # so it lands in the CI job log without needing artifact upload.
  #
  # Maestro's own instrumentation logs a view hierarchy dump several times a second, which drowns
  # out the app in any fixed-size tail, so drop those lines before trimming. Crashes are printed
  # separately from the whole buffer, since they can predate the window by a long way.
  if [[ $exit_code -ne 0 && "$MAESTRO_PLATFORM" == "android" ]]; then
    echo "===== adb logcat: crashes ($MAESTRO_CONFIGURATION) ====="
    adb logcat -d -b all 2>/dev/null | grep -E "FATAL EXCEPTION|AndroidRuntime|beginning of crash" || echo "(none)"
    echo "===== adb logcat: app output, last 300 lines ====="
    adb logcat -d -b all 2>/dev/null \
      | grep -vE "(Maestro|QueryController|AccessibilityNodeInfo) *:" \
      | tail -300 || true
    echo "===== end adb logcat ====="
  fi
  echo 'Cleaning up...'
  killUpdatesServerIfNeeded
  pnpm maestro:$MAESTRO_PLATFORM:uninstall || true
}

# Fail if anything errors
set -eox pipefail
# If this script exits, trap it first and clean up
trap cleanup EXIT

function beforeAll() {
  if [[ "$MAESTRO_UPDATES_SERVER_PORT" == "" ]]; then
    echo "MAESTRO_UPDATES_SERVER_PORT is not set"
    exit 1
  fi
  startUpdatesServerIfNeeded
  if [[ "$MAESTRO_PLATFORM" == "android" ]]; then
    adb reverse tcp:$MAESTRO_UPDATES_SERVER_PORT tcp:$MAESTRO_UPDATES_SERVER_PORT
    adb reverse tcp:8081 tcp:8081
  fi
}

beforeAll

# Without -p, maestro runs on any connected device and ignores the platform argument
maestro -p "$MAESTRO_PLATFORM" test $MAESTRO_TEST_SUITE
