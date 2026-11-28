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
UPDATES_SERVER_LOG="${MAESTRO_UPDATES_SERVER_LOG:-/tmp/updates-server-$MAESTRO_UPDATES_SERVER_PORT.log}"
STARTED_UPDATES_SERVER_PID=""

function killUpdatesServerIfNeeded() {
  if [[ -n "$STARTED_UPDATES_SERVER_PID" ]]; then
    echo "Killing updates server with PID $STARTED_UPDATES_SERVER_PID"
    kill "$STARTED_UPDATES_SERVER_PID" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      if ! kill -0 "$STARTED_UPDATES_SERVER_PID" 2>/dev/null; then
        return
      fi
      sleep 0.2
    done
    kill -9 "$STARTED_UPDATES_SERVER_PID" 2>/dev/null || true
  fi
}

function startUpdatesServerIfNeeded() {
  local existing_pid
  existing_pid=$(lsof -t -iTCP:"$MAESTRO_UPDATES_SERVER_PORT" -sTCP:LISTEN || true)
  if [[ -n "$existing_pid" ]]; then
    echo "Updates server already running with PID $existing_pid"
    return
  fi

  echo "Starting updates server (logs: $UPDATES_SERVER_LOG)"
  : > "$UPDATES_SERVER_LOG"
  pnpm --silent ts-node --transpile-only ./maestro/updates-server/start.ts >"$UPDATES_SERVER_LOG" 2>&1 &
  STARTED_UPDATES_SERVER_PID=$!

  local health_url="http://localhost:$MAESTRO_UPDATES_SERVER_PORT/health"
  for _ in $(seq 1 150); do
    if curl -sf "$health_url" >/dev/null 2>&1; then
      echo "Updates server ready (PID $STARTED_UPDATES_SERVER_PID)"
      return
    fi
    if ! kill -0 "$STARTED_UPDATES_SERVER_PID" 2>/dev/null; then
      echo "Updates server exited before becoming healthy. Logs:"
      cat "$UPDATES_SERVER_LOG"
      exit 1
    fi
    sleep 0.2
  done

  echo "Timed out waiting for updates server at $health_url. Logs:"
  cat "$UPDATES_SERVER_LOG"
  exit 1
}

function cleanup()
{
  local exit_code=$?
  if [[ $exit_code -ne 0 && -f "$UPDATES_SERVER_LOG" ]]; then
    echo "===== updates server log (last 200 lines) ====="
    tail -200 "$UPDATES_SERVER_LOG" || true
    echo "===== end updates server log ====="
  fi
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
  if [[ $exit_code -ne 0 && "$MAESTRO_PLATFORM" == "ios" ]]; then
    echo "===== iOS simulator logs ($MAESTRO_CONFIGURATION, last 200 lines) ====="
    xcrun simctl spawn booted log show --last 2m --style compact \
      --predicate 'process == "updatese2e" OR subsystem CONTAINS "expo"' 2>/dev/null \
      | tail -200 || true
    echo "===== end iOS simulator logs ====="
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
  pnpm maestro:$MAESTRO_PLATFORM:uninstall || true
  pnpm maestro:$MAESTRO_PLATFORM:$MAESTRO_CONFIGURATION:install
}

beforeAll

# Without -p, maestro runs on any connected device and ignores the platform argument
maestro -p "$MAESTRO_PLATFORM" test $MAESTRO_TEST_SUITE
