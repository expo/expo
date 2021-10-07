#!/usr/bin/env bash

set -xeo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
TEMP_DIR="/tmp/android-shell-app"

[[ "$(command -v jq)" ]] || { echo "jq is not installed." ; exit 1; }

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
cp ${ROOT_DIR}/package.json $TEMP_DIR/package.json

# make some packages available for node modules resolution
mkdir -p $TEMP_DIR/local_packages
cp -r ${ROOT_DIR}/packages/expo $TEMP_DIR/local_packages/expo
cp -r ${ROOT_DIR}/packages/expo-modules-autolinking $TEMP_DIR/local_packages/expo-modules-autolinking
pushd $TEMP_DIR
jq '.dependencies += {"expo": "file:./local_packages/expo", "expo-modules-autolinking": "file:./local_packages/expo-modules-autolinking"}' package.json > package.json.tmp
mv -f package.json.tmp package.json
popd

# packages are used by the optional-modules-linking-code in XDL
# see xdl/AndroidShellApp.js
ln -s ${ROOT_DIR}/packages $TEMP_DIR/packages

# generate dynamic macros (we can do it here, as the contents are already `ln -s`-ed)
et android-generate-dynamic-macros --configuration release

# build the artifact
cd $TEMP_DIR; tar -czhf $ARTIFACTS_DIR/android-shell-builder.tar.gz .

rm -rf $TEMP_DIR
