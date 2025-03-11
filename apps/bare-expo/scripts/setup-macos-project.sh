#!/usr/bin/env bash

remove_dependencies() {
  local packages=("$@")
  local filter=""
  for pkg in "${packages[@]}"; do
    filter+=" | del(.dependencies[\"$pkg\"]?)"
  done

  filter="${filter# | }"

  local tmp_file
  tmp_file=$(mktemp) || return 1

  jq "$filter" package.json > "$tmp_file" && mv "$tmp_file" package.json
}

echo " ☛  Ensuring macOS project is setup..."

echo " Removing macOS incompatible dependencies..."
remove_dependencies "react-native-safe-area-context"

RN_MACOS_VERSION=$(jq -r '.dependencies["react-native-macos"]' package.json)
if [[ "$RN_MACOS_VERSION" != "null" ]]; then
    echo " ✅ React Native macOS installed"
else
    RN_MINOR_VERSION=$(jq -r '.dependencies["react-native"] | capture("^(?<major>\\d+)\\.(?<minor>\\d+)") | "\( .major ).\( .minor )"' package.json)
    echo " ⚠️  Attempting to install react-native-macos@$RN_MINOR_VERSION..."
    if ! yarn add "react-native-macos@$RN_MINOR_VERSION" --non-interactive --silent; then
        echo "⚠️  Failed to install react-native-macos@$RN_MINOR_VERSION, falling back to latest version"
        yarn add react-native-macos@latest
    fi
fi
