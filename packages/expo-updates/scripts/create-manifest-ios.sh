#!/usr/bin/env bash

set -eo pipefail

DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
ENTRY_FILE=${ENTRY_FILE:-index.js}
RCT_METRO_PORT=${RCT_METRO_PORT:=8081}
REACT_NATIVE_PACKAGER_HOSTNAME=${REACT_NATIVE_PACKAGER_HOSTNAME:-"localhost:$RCT_METRO_PORT"}
ASSETS_URL="http://$REACT_NATIVE_PACKAGER_HOSTNAME/"${ENTRY_FILE%.js}".assets?platform=ios&dev=false"
NODE_BINARY=${NODE_BINARY:-node}

if ! [ -x "$(command -v $NODE_BINARY)" ]; then
  echo 'Error: cannot find the node binary. Try setting the NODE_BINARY variable in the ' \
  '"Bundle React Native code and images" Build Phase to the absolute path to your node binary. ' \
  'You can find it by executing "which node" in a terminal window.' >&2
  exit 1
fi

"$NODE_BINARY" "$(dirname "${BASH_SOURCE[0]}")/createManifest.js" ios "$ASSETS_URL" "$DEST"
