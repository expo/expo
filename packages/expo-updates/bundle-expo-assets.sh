#!/usr/bin/env bash

set -eo pipefail

if [[ "$CONFIGURATION" == Debug* ]]; then
  if [ -z "$NODE_BINARY" ]; then
    export NODE_BINARY=node
  fi
  ../node_modules/react-native/scripts/react-native-xcode.sh
  exit 0
fi

pushd "${SRCROOT}/.."
export PATH="$(if [ -f ~/.expo/PATH ]; then echo $PATH:$(cat ~/.expo/PATH); else echo $PATH; fi)"
dest="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
expo bundle-assets --platform ios --dest "$dest"
popd
