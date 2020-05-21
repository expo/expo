#!/usr/bin/env bash

set -eo pipefail

DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
ASSETS_URL="http://localhost:8081/index.assets?platform=ios&dev=false"

"${NODE_BINARY:-node}" "$(dirname "${BASH_SOURCE[0]}")/createManifest.js" ios "$ASSETS_URL" "$DEST"
