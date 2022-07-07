#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"

mkdir -p ~/.config/direnv
cat << EOF > ~/.config/direnv/direnv.toml
[whitelist]
prefix = [ "/" ]
EOF

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  direnv exec . et ios-generate-dynamic-macros
fi

if [ "$EAS_BUILD_PROFILE" = "versioned-client-add-sdk" ]; then
  direnv exec . et add-sdk --platform android --sdkVersion 46.0.0
fi
