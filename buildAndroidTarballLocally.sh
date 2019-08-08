#!/usr/bin/env bash

set -xeo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
TEMP_DIR="/tmp/android-shell-app"

mkdir -p $ARTIFACTS_DIR
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR
ln -s ${ROOT_DIR}/tools-public $TEMP_DIR/tools-public
ln -s ${ROOT_DIR}/secrets $TEMP_DIR/secrets
ln -s ${ROOT_DIR}/template-files $TEMP_DIR/template-files
ln -s ${ROOT_DIR}/android $TEMP_DIR/android
ln -s ${ROOT_DIR}/package.json $TEMP_DIR/package.json
ln -s ${ROOT_DIR}/expokit-npm-package $TEMP_DIR/expokit-npm-package
ln -s ${ROOT_DIR}/packages $TEMP_DIR/packages

# generate dynamic macros
mkdir -p $TEMP_DIR/android/expoview/src/main/java/host/exp/exponent/generated/
cd $TEMP_DIR/tools-public
et android-generate-dynamic-macros --configuration release
rm -rf $TEMP_DIR/secrets

cd $TEMP_DIR; tar -czhf $ARTIFACTS_DIR/android-shell-builder.tar.gz .
rm -rf $TEMP_DIR
