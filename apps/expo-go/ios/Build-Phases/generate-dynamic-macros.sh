#!/usr/bin/env bash

set -exo pipefail

if [[ -z "$EXPO_TOOLS_DIR" ]]; then
  EXPO_TOOLS_DIR="${SRCROOT}/../tools"
fi

if [[ -f "$PODS_ROOT/../.xcode.env" ]]; then
  source "$PODS_ROOT/../.xcode.env"
fi
if [[ -f "$PODS_ROOT/../.xcode.env.local" ]]; then
  source "$PODS_ROOT/../.xcode.env.local"
fi

export PATH="${SRCROOT}/../../../bin:$PATH"

if [ "${APP_OWNER}" == "Expo" ]; then
  et ios-generate-dynamic-macros --configuration ${CONFIGURATION}
else
  et ios-generate-dynamic-macros --configuration ${CONFIGURATION} --skip-template=GoogleService-Info.plist
fi
