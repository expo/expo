#!/usr/bin/env bash

set -eo pipefail

[ -z "$NODE_BINARY" ] && export NODE_BINARY=node

DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
ASSETS_URL="http://localhost:8081/index.assets?platform=ios"

"$NODE_BINARY" ../node_modules/expo-updates/scripts/createManifest.js ios "$ASSETS_URL" "$DEST"
