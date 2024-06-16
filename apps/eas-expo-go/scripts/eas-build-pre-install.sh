#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"
export PATH="$ROOT_DIR/bin:$PATH"

if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
  sudo apt-get -y update
  sudo apt-get -y install ruby icu-devtools libicu-dev maven
  sdkmanager "cmake;3.22.1"
elif [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  HOMEBREW_NO_AUTO_UPDATE=1 brew install cmake
fi

if [ "$EAS_BUILD_PROFILE" = "release-client" ] || [ "$EAS_BUILD_PROFILE" = "publish-client" ]; then
  if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
    sudo apt-get -y update
    sudo apt-get -y install git-crypt
  elif [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
    HOMEBREW_NO_AUTO_UPDATE=1 brew install git-crypt
  fi
  git-crypt unlock $GIT_CRYPT_KEY
fi

cat << EOF > $ROOT_DIR/.gitmodules
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

if [ "$EAS_BUILD_PROFILE" = "release-client" ] && [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  et eas remove-background-permissions-from-info-plist
fi
