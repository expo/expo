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

if type "pod" > /dev/null; then
    echo " ✅ Has CocoaPods CLI"
else
  echo " 🛑  ERROR: Missing CocoaPods installation. Run 'sudo gem install cocoapods --pre' to install"
  exit 1
fi

RN_MACOS_VERSION=$(jq -r '.dependencies["react-native-macos"]' package.json)
echo $RN_MACOS_VERSION
if [[ "$RN_MACOS_VERSION" != "null" ]]; then
    echo " ✅ React Native macOS installed"
else
    RN_MINOR_VERSION=$(jq -r '.dependencies["react-native"] | capture("^(?<major>\\d+)\\.(?<minor>\\d+)") | "\( .major ).\( .minor )"' package.json)
    echo " ⚠️  Cannot find React Native macOS for this project, attempting to install version $RN_MINOR_VERSION..."
    yarn add react-native-macos@$RN_MINOR_VERSION
fi

echo " Removing macOS incompatible dependencies..."
remove_dependencies "react-native-safe-area-context"

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    yarn
fi

if [ -d "macos/Pods" ]; then
    echo " ✅ Project CocoaPods installed"
else
    echo " ⚠️  Cannot find Pods for this project, installing..."
    cd ios
    pod install
    cd ..
fi

