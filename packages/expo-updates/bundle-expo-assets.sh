#!/usr/bin/env bash

set -eo pipefail

if [ "$CONFIGURATION" == "Debug" ]; then
  echo "Skipping asset bundling in debug mode."
  exit 0
fi

pushd "${SRCROOT}/.."
export PATH="$(if [ -f ~/.expo/PATH ]; then echo $PATH:$(cat ~/.expo/PATH); else echo $PATH; fi)"
dest="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
expo bundle-assets --platform ios --dest "$dest"
popd

