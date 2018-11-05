#!/bin/bash

echo "Creating packfile"
PACKFILE="$(npm pack)"
EXPO_SDK_DIRECTORY="$(pwd)"
pushd $1
echo "Installing packfile at $EXPO_SDK_DIRECTORY/$PACKFILE to $1"
npm i --no-package-lock $EXPO_SDK_DIRECTORY/$PACKFILE
popd
