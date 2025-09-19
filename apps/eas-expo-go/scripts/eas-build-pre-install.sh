#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"
export PATH="$ROOT_DIR/bin:$PATH"

if [ -n "${EXPO_TOKEN+x}" ]; then
  echo "Unsetting EXPO_TOKEN"
  unset EXPO_TOKEN
else
  echo "EXPO_TOKEN is not set"
fi

if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
  sudo apt-get -y update
  sudo apt-get -y install ruby icu-devtools libicu-dev maven
  sdkmanager "cmdline-tools;latest"
  sdkmanager "cmake;3.30.5"
elif [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  HOMEBREW_NO_AUTO_UPDATE=1 brew install cmake
fi

if [ "$EAS_BUILD_PROFILE" = "release-client" ] || [ "$EAS_BUILD_PROFILE" = "publish-client" ]; then
  if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
    sudo apt-get -y update
    sudo apt-get -y install google-cloud-sdk
  elif [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
    HOMEBREW_NO_AUTO_UPDATE=1 brew install google-cloud-sdk
  fi
  
  # Set up GCP authentication from service account key
  if [ -n "${GCP_SERVICE_ACCOUNT_KEY+x}" ]; then
    echo "$GCP_SERVICE_ACCOUNT_KEY" | base64 -d > /tmp/gcp-key.json
    if gcloud auth activate-service-account --key-file=/tmp/gcp-key.json; then
      echo "GCP secrets access configured successfully"
    else
      echo "Error: Failed to authenticate with GCP service account"
      rm -f /tmp/gcp-key.json
      exit 1
    fi
    rm /tmp/gcp-key.json
  else
    echo "Warning: No GCP service account key provided, secrets may not be available"
  fi
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
