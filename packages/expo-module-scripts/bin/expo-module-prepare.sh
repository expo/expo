#!/usr/bin/env bash

set -eo pipefail

script_dir="$(dirname "$0")"

export EXPO_NONINTERACTIVE=1

echo "Configuring module"
"$script_dir/expo-module-clean.sh"
"$script_dir/expo-module-configure.sh"
"$script_dir/expo-module-build.sh"

extra_module_build_types=("plugin" "cli" "utils" "scripts")
for i in "${extra_module_build_types[@]}"
do
  if [[ -d "$i" ]]; then
    echo "Configuring $i"
    "$script_dir/expo-module-clean.sh" "$i"
    "$script_dir/expo-module-build.sh" "$i"
  fi
done
