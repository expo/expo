#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"

if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
  sudo apt-get -y update
  sudo apt-get -y install ruby icu-devtools libicu66 libicu-dev maven
  sdkmanager "cmake;3.22.1"
fi

cat << EOF > $ROOT_DIR/.gitmodules
[submodule "docs/react-native-website"]
  path = docs/react-native-website
  url = https://github.com/facebook/react-native-website.git
  branch = main
  update = checkout
[submodule "react-native-lab/react-native"]
  path = react-native-lab/react-native
  url = https://github.com/expo/react-native.git
  branch = exp-latest
  update = checkout
EOF

git submodule update --init

if [ -n "${EAS_BUILD_NPM_CACHE_URL-}" ]; then
  sed -i -e "s#https://registry.yarnpkg.com#$EAS_BUILD_NPM_CACHE_URL#g" $ROOT_DIR/yarn.lock || true
fi

pushd $ROOT_DIR/tools
yarn
