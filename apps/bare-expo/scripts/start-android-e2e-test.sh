#!/usr/bin/env bash

set -e

CURR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "${CURR_DIR}/../android"

echo ''
echo '🔌 Installing APKs'
adb install -r app/build/outputs/apk/release/app-release.apk
adb install -r app/build/outputs/apk/androidTest/release/app-release-androidTest.apk

if [[ -n "${CI}" && -n "${GITHUB_ACTION}" ]]; then
  echo ''
  echo '💤 Waiting for GitHub CI emulator to warm up'
  sleep 30
fi

echo ''
echo '📷 Starting instrumentation tests'
LOG_FILE="${CURR_DIR}/../artifacts/instrumentation.log"
LOG_DIR=$(dirname "$LOG_FILE")
if [[ ! -d "${LOG_DIR}" ]]; then
  mkdir -p "${LOG_DIR}"
fi
adb shell am instrument -w -e debug false -e class dev.expo.payments.BareExpoTestSuite dev.expo.payments.test/androidx.test.runner.AndroidJUnitRunner 2>&1 | tee "${LOG_FILE}"
# Propagate instrumentation result to exit code
cat "${LOG_FILE}" | grep -e '^OK (.* tests)$' > /dev/null
