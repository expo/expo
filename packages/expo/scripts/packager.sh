#!/bin/bash
# Copyright © 2023 650 Industries.
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# NOTE(EvanBacon): This is a fork of the react-native packager.sh script but with the ability
# to use Expo CLI to start the packager. This ensures the `@expo/metro-config`` is always used.

# TODO: Replace all manual fs checks with Node.js module resolution.

# scripts directory
THIS_DIR=$(cd -P "$(dirname "$(realpath "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
EXPO_PKG_ROOT="$THIS_DIR/.."
# Application root directory - General use case: react-native is a dependency
PROJECT_ROOT="$THIS_DIR/../../.."

# check and assign NODE_BINARY env
# shellcheck disable=SC1090
source "${THIS_DIR}/node-binary.sh"

# When running react-native tests, react-native doesn't live in node_modules but in the PROJECT_ROOT
if [ ! -d "$PROJECT_ROOT/node_modules/expo" ];
then
  PROJECT_ROOT="$THIS_DIR/.."
fi

# Start packager from PROJECT_ROOT
cd "$PROJECT_ROOT" || exit
"$NODE_BINARY" "$EXPO_PKG_ROOT/../@expo/cli/build/bin/cli" start --dev-client "$@"
