#!/usr/bin/env bash

set -eo pipefail

script_dir="$(dirname "$0")"

args=("$@")
if [[ -t 1 && (-z "$CI" && -z "$EXPO_NONINTERACTIVE") ]]; then
  args+=("--watch")
fi

"$script_dir/expo-module-tsc.sh" --noEmit "${args[@]}"
