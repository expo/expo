#!/bin/bash

if [[ "$#" -ne 2 ]]; then
  echo "Usage: $0 <ios|android> <debug|release>"
  exit 1
fi

export MAESTRO_PLATFORM=$1
export MAESTRO_CONFIGURATION=$2

function killUpdatesServerIfNeeded() {
  UPDATES_SERVER_PID=$(lsof -t -i:$MAESTRO_UPDATES_SERVER_PORT)
  if [[ -n "$UPDATES_SERVER_PID" ]]; then
    echo "Killing updates server with PID $UPDATES_SERVER_PID"
    kill -9 $UPDATES_SERVER_PID
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
  npx ts-node ./maestro/updates-server/start.ts >/dev/null 2>&1 &
  if [[ "$MAESTRO_PLATFORM" == "android" ]]; then
    adb reverse tcp:$MAESTRO_UPDATES_SERVER_PORT tcp:$MAESTRO_UPDATES_SERVER_PORT
  fi
}

beforeAll

maestro test maestro/tests/updates-e2e-enabled.yml
