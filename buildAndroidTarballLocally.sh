#!/usr/bin/env bash

set -xeo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
TEMP_DIR="/tmp/android-shell-app"

mkdir -p $ARTIFACTS_DIR
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# we use the root android project as a shell app template
ln -s ${ROOT_DIR}/android $TEMP_DIR/android
# We wouldn't want to use any versioned ABI in a standalone app
# and it makes the shell app smaller.
rm -rf $TEMP_DIR/android/versioned-abis

# root package.json defines a dependency on react-native-unimodules,
# which we require when building the shell app
ln -s ${ROOT_DIR}/package.json $TEMP_DIR/package.json

# packages are used by the optional-modules-linking-code in XDL
# see xdl/AndroidShellApp.js
ln -s ${ROOT_DIR}/packages $TEMP_DIR/packages

# generate dynamic macros (we can do it here, as the contents are already `ln -s`-ed)
et android-generate-dynamic-macros --configuration release

# build the artifact
cd $TEMP_DIR; tar -czhf $ARTIFACTS_DIR/android-shell-builder.tar.gz .
rm -rf $TEMP_DIR
