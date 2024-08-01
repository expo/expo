#!/usr/bin/env bash

set +e
if [[ -n "$CI" ]]; then
  set -x
fi

CURR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ARTIFACT_DIR="${CURR_DIR}/../artifacts"
if [[ ! -d "${ARTIFACT_DIR}" ]]; then
  mkdir -p "${ARTIFACT_DIR}"
fi

adb logcat -d > "${ARTIFACT_DIR}/emulator.log"
adb logcat -c || true

cd "${CURR_DIR}/../android"
echo ''
echo '🔌 Installing APKs'
adb install -r app/build/outputs/apk/release/app-release.apk
adb install -r app/build/outputs/apk/androidTest/release/app-release-androidTest.apk

adb shell screencap -p /data/local/tmp/bareexpo.png && adb pull /data/local/tmp/bareexpo.png "${ARTIFACT_DIR}/beforeTests.png"

echo ''
echo '📷 Starting instrumentation tests'
LOG_FILE="${ARTIFACT_DIR}/instrumentation.log"
LOG_DIR=$(dirname "$LOG_FILE")
if [[ ! -d "${LOG_DIR}" ]]; then
  mkdir -p "${LOG_DIR}"
fi

adb shell am instrument -w -e debug false -e class dev.expo.payments.BareExpoTestSuite dev.expo.payments.test/androidx.test.runner.AndroidJUnitRunner 2>&1 | tee "${LOG_FILE}"
# Propagate instrumentation result to exit code
cat "${LOG_FILE}" | grep -e '^OK (.* tests)$' > /dev/null
STATUS=$?

adb shell screencap -p /data/local/tmp/bareexpo.png && adb pull /data/local/tmp/bareexpo.png "${ARTIFACT_DIR}/afterTests.png"
adb logcat -d > "${ARTIFACT_DIR}/adb.log"
exit $STATUS
