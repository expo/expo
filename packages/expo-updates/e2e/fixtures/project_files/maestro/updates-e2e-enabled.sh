#!/bin/bash

if [[ "$#" -ne 2 ]]; then
  echo "Usage: $0 <ios|android> <debug|release>"
  exit 1
fi

export MAESTRO_PLATFORM=$1
export E2E_CONFIGURATION=$2

function killUpdatesServerIfNeeded() {
  UPDATES_SERVER_PID=$(lsof -t -i:4747)
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
  npx ts-node ./maestro/updates-server/start.ts >/dev/null 2>&1 &
}

function beforeTest()
{
  yarn maestro:$MAESTRO_PLATFORM:uninstall || true
  yarn maestro:$MAESTRO_PLATFORM:$E2E_CONFIGURATION:install
  sleep 2
}

beforeAll
beforeTest
maestro test maestro/tests/startAndStop.yml
beforeTest
maestro test maestro/tests/checkLastRequestHeaders.yml
beforeTest
maestro test maestro/tests/reload.yml
beforeTest
maestro test maestro/tests/runUpdate.yml
beforeTest
maestro test maestro/tests/runUpdateWithInvalidHash.yml
beforeTest
maestro test maestro/tests/runUpdateWithInvalidAssetHash.yml
beforeTest
maestro test maestro/tests/runUpdateWithMultipleAssets.yml
beforeTest
maestro test maestro/tests/runUpdateWithOldCommitTime.yml
beforeTest
maestro test maestro/tests/runUpdateWithRollback.yml
beforeTest
maestro test maestro/tests/runUpdateWithJSAPI.yml
