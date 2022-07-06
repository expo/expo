#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"

mkdir -p ~/.config/direnv
cat << EOF > ~/.config/direnv/direnv.toml
[whitelist]
prefix = [ "/" ]
EOF

if [ "$EXPO_GO_BUILD_TYPE" = "versioned-client-add-sdk" ]; then
  direnv exec . et add-sdk --platform android --sdkVersion 46.0.0
fi
