#!/usr/bin/env bash

set -exo pipefail

if [ -z "$EXPO_TOOLS_DIR" ]; then
  EXPO_TOOLS_DIR="${SRCROOT}/../tools"
fi

source ${EXPO_TOOLS_DIR}/source-login-scripts.sh
export PATH="${SRCROOT}/../bin:$PATH"

if [ "${APP_OWNER}" == "Expo" ]; then
  et ios-generate-dynamic-macros --configuration ${CONFIGURATION}
else
  et ios-generate-dynamic-macros --configuration ${CONFIGURATION} --skip-template=GoogleService-Info.plist
fi

