#!/usr/bin/env bash

set -eo pipefail

DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
ENTRY_FILE=${ENTRY_FILE:-index.js}
RCT_METRO_PORT=${RCT_METRO_PORT:=8081}
NODE_BINARY=${NODE_BINARY:-node}


# ref: https://github.com/facebook/react-native/blob/c974cbff04a8d90ac0f856dbada3fc5a75c75b49/scripts/react-native-xcode.sh#L59-L65
EXPO_UPDATES_PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The project should be located next to where expo-updates is installed
# in node_modules.
PROJECT_ROOT=${PROJECT_ROOT:-"$EXPO_UPDATES_PACKAGE_DIR/../.."}

cd "$PROJECT_ROOT" || exit

if ! [ -x "$(command -v $NODE_BINARY)" ]; then
  echo 'Error: cannot find the node binary. Try setting the NODE_BINARY variable in the ' \
  '"Bundle React Native code and images" Build Phase to the absolute path to your node binary. ' \
  'You can find it by executing "which node" in a terminal window.' >&2
  exit 1
fi

"$NODE_BINARY" "${EXPO_UPDATES_PACKAGE_DIR}/scripts/createManifest.js" ios "$PROJECT_ROOT" "$DEST"
