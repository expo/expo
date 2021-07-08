#!/usr/bin/env bash

set -exo pipefail

if [ -z "$EXPO_TOOLS_DIR" ]; then
  EXPO_TOOLS_DIR="${SRCROOT}/../../../tools"
fi

# Sourcing login scripts on macOS-11 runners is broken but can be omitted.
if [ -z "$CI" ]; then
  source ${EXPO_TOOLS_DIR}/source-login-scripts.sh
fi

export PATH="${SRCROOT}/../../../bin:$PATH"

et ios-generate-dynamic-macros --configuration ${CONFIGURATION}
