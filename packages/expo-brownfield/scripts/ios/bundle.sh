#!/bin/bash
set -euo pipefail

for env_file in "$PROJECT_DIR/.xcode.env" "$PROJECT_DIR/.xcode.env.local"; do
  if [[ -f "$env_file" ]]; then
    source "$env_file"
  fi
done

export PROJECT_ROOT="${PROJECT_ROOT:-$PROJECT_DIR/..}"
export NODE_BINARY="${NODE_BINARY:-node}"
cd "$PROJECT_ROOT"

if [[ -z "${ENTRY_FILE:-}" ]]; then
  export ENTRY_FILE="$("$NODE_BINARY" -e "require('expo/scripts/resolveAppEntry')" "$PROJECT_ROOT" ios absolute | tail -n 1)"
fi
if [[ -z "${CLI_PATH:-}" ]]; then
  export CLI_PATH="$("$NODE_BINARY" --print "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })")"
fi
export BUNDLE_COMMAND="${BUNDLE_COMMAND:-export:embed}"

# The framework must run without Metro, including Debug simulator builds.
unset SKIP_BUNDLING
export FORCE_BUNDLING=1
REACT_NATIVE_SCRIPT="$("$NODE_BINARY" --print "require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'")"
exec /bin/bash "$REACT_NATIVE_SCRIPT"
