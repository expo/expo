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
remove_dependencies "react-native-reanimated" "react-native-svg"

echo " Copying macOS patches..."
cp -r ./scripts/fixtures/macos/patches/* ../../patches/

RN_MACOS_VERSION=$(jq -r '.dependencies["react-native-macos"]' package.json)
if [[ "$RN_MACOS_VERSION" != "null" ]]; then
    echo " ✅ React Native macOS installed"
else
    RN_MINOR_VERSION=$(jq -r '.dependencies["react-native"] | capture("^(?<major>\\d+)\\.(?<minor>\\d+)") | "\( .major ).\( .minor )"' package.json)
    echo " ⚠️  Attempting to install react-native-macos@$RN_MINOR_VERSION..."
    if ! yarn add "react-native-macos@$RN_MINOR_VERSION" --non-interactive --silent; then
        echo "⚠️  Failed to install react-native-macos@$RN_MINOR_VERSION, falling back to latest version"
        # Manually extract the last react-native-macos version (highest) from npm because we can't rely on the @latest tag
        latest_version=$(npm view react-native-macos versions --json | jq -r '.[-1]')
        yarn add "react-native-macos@$latest_version"

    fi
fi

echo " Running yarn from root..."
cd ../../
yarn install
