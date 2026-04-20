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
remove_dependencies "@shopify/react-native-skia" "react-native-svg"

echo " Copying macOS patches..."
cp -r ./scripts/fixtures/macos/patches/* ../../patches/

echo " Registering macOS patches in pnpm-workspace.yaml..."
node -e "
  const fs = require('fs');
  const patchDir = './scripts/fixtures/macos/patches';
  const workspaceFile = '../../pnpm-workspace.yaml';

  const files = fs.readdirSync(patchDir).filter(f => f.endsWith('.patch'));
  let yaml = fs.readFileSync(workspaceFile, 'utf8');

  for (const file of files) {
    if (yaml.includes('patches/' + file)) continue;

    const name = file.replace('.patch', '');
    const parts = name.split('+');
    let pkg;
    if (parts[0].startsWith('@')) {
      pkg = parts[0] + '/' + parts[1];
    } else {
      pkg = parts[0];
    }

    const quotedKey = pkg.includes('/') || pkg.includes('@') ? \"'\" + pkg + \"'\" : pkg;
    const entry = '  ' + quotedKey + ': patches/' + file;

    // Insert after the last entry in patchedDependencies
    const lines = yaml.split('\n');
    let insertIdx = -1;
    let inSection = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === 'patchedDependencies:') {
        inSection = true;
        continue;
      }
      if (inSection) {
        if (lines[i].startsWith('  ') && lines[i].trim()) {
          insertIdx = i + 1;
        } else if (lines[i].trim() && !lines[i].startsWith('  ')) {
          break;
        }
      }
    }

    if (insertIdx !== -1) {
      lines.splice(insertIdx, 0, entry);
      yaml = lines.join('\n');
    }
  }

  fs.writeFileSync(workspaceFile, yaml);
"

RN_MACOS_VERSION=$(jq -r '.dependencies["react-native-macos"]' package.json)
if [[ "$RN_MACOS_VERSION" != "null" ]]; then
    echo " ✅ React Native macOS installed"
else
    RN_MINOR_VERSION=$(jq -r '.dependencies["react-native"] | capture("^(?<major>\\d+)\\.(?<minor>\\d+)") | "\( .major ).\( .minor )"' package.json)
    echo " ⚠️  Attempting to install react-native-macos@$RN_MINOR_VERSION..."
    if ! pnpm add "react-native-macos@$RN_MINOR_VERSION" --silent; then
        echo "⚠️  Failed to install react-native-macos@$RN_MINOR_VERSION, falling back to latest version"
        # Manually extract the last react-native-macos version (highest) from npm because we can't rely on the @latest tag
        latest_version=$(npm view react-native-macos versions --json | jq -r '.[-1]')
        pnpm add "react-native-macos@$latest_version"

    fi
fi

echo " Running pnpm from root..."
cd ../../
pnpm install --ignore-scripts --frozen-lockfile=false
