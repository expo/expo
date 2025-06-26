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
    npx ts-node ./maestro/updates-server/start.ts >/dev/null 2>&1 &
  fi
}

function cleanup()
{
  echo 'Cleaning up...'
  killUpdatesServerIfNeeded
  yarn maestro:$MAESTRO_PLATFORM:uninstall || true
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

maestro test $MAESTRO_TEST_SUITE
