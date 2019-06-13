#!/usr/bin/env bash

set -eo pipefail

if [ -z "$EXPO_TOOLS_DIR" ]; then
  EXPO_TOOLS_DIR="${SRCROOT}/../tools"
fi

source ${EXPO_TOOLS_DIR}/source-login-scripts.sh
${EXPO_TOOLS_DIR}/expotools/bin/expotools.js ios-run-fabric
