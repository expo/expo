#!/usr/bin/env bash

# generate-dynamic-macros.sh
# Pure bash replacement for `et ios-generate-dynamic-macros`
# Generates EXBuildConstants.plist and copies template files with substitution

set -eo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Use Xcode's CONFIGURATION env var if available, otherwise default to Debug
CONFIGURATION="${CONFIGURATION:-Debug}"
SKIP_TEMPLATES=()

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --configuration)
      CONFIGURATION="$2"
      shift 2
      ;;
    --skip-template=*)
      SKIP_TEMPLATES+=("${1#*=}")
      shift
      ;;
    --skip-template)
      SKIP_TEMPLATES+=("$2")
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# =============================================================================
# Path Resolution
# =============================================================================

# Determine paths based on environment
if [[ -n "$SRCROOT" ]]; then
  # Running from Xcode
  IOS_DIR="$SRCROOT"
else
  # Running from command line - assume we're in the ios directory or its subdirectory
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

# EXPO_DIR is the monorepo root (3 levels up from ios dir)
EXPO_DIR="$(cd "$IOS_DIR/../../.." && pwd)"

# Key paths
EXPO_GO_DIR="$EXPO_DIR/apps/expo-go"
APP_JSON="$EXPO_GO_DIR/app.json"
INFO_PLIST="$IOS_DIR/Exponent/Supporting/Info.plist"
BUILD_CONSTANTS_PLIST="$IOS_DIR/Exponent/Supporting/EXBuildConstants.plist"
TEMPLATE_FILES_DIR="$EXPO_DIR/template-files"
SECRETS_DIR="$EXPO_DIR/secrets"

# =============================================================================
# Utility Functions
# =============================================================================

# PlistBuddy wrapper for cleaner syntax
plist_buddy() {
  /usr/libexec/PlistBuddy "$@"
}

# Read a value from a plist file
plist_read() {
  local plist_file="$1"
  local key="$2"
  plist_buddy -c "Print :$key" "$plist_file" 2>/dev/null || echo ""
}

# Set a string value in a plist file
plist_set_string() {
  local plist_file="$1"
  local key="$2"
  local value="$3"

  # Try to set the value, if it fails (key doesn't exist), add it
  if ! plist_buddy -c "Set :$key $value" "$plist_file" 2>/dev/null; then
    plist_buddy -c "Add :$key string $value" "$plist_file"
  fi
}

# Set a boolean value in a plist file
plist_set_bool() {
  local plist_file="$1"
  local key="$2"
  local value="$3"

  if ! plist_buddy -c "Set :$key $value" "$plist_file" 2>/dev/null; then
    plist_buddy -c "Add :$key bool $value" "$plist_file"
  fi
}

# Delete a key from a plist file (ignore errors if key doesn't exist)
plist_delete() {
  local plist_file="$1"
  local key="$2"
  plist_buddy -c "Delete :$key" "$plist_file" 2>/dev/null || true
}

# Check if a key exists in a plist file
plist_exists() {
  local plist_file="$1"
  local key="$2"
  plist_buddy -c "Print :$key" "$plist_file" &>/dev/null
}

# Read JSON value using jq if available, otherwise use Python or basic parsing
json_read() {
  local json_file="$1"
  local key="$2"

  if command -v jq &>/dev/null; then
    jq -r "$key // empty" "$json_file" 2>/dev/null
  elif command -v python3 &>/dev/null; then
    python3 -c "import json; data=json.load(open('$json_file')); print(eval('data$key') if eval('data$key') else '')" 2>/dev/null
  elif command -v python &>/dev/null; then
    python -c "import json; data=json.load(open('$json_file')); print eval('data$key') if eval('data$key') else ''" 2>/dev/null
  else
    # Fallback: simple grep-based extraction (works for simple cases)
    grep -o "\"${key#.}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$json_file" 2>/dev/null | sed 's/.*: *"\([^"]*\)"/\1/' | head -1
  fi
}

# Generate a UUID
generate_uuid() {
  if command -v uuidgen &>/dev/null; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  elif [[ -f /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  else
    # Fallback using /dev/urandom
    od -x /dev/urandom | head -1 | awk '{OFS="-"; print $2$3,$4,$5,$6,$7$8$9}' | tr '[:upper:]' '[:lower:]'
  fi
}

# =============================================================================
# Keys Loading
# =============================================================================

load_keys() {
  local keys_file=""

  if [[ -f "$SECRETS_DIR/keys.json" ]]; then
    keys_file="$SECRETS_DIR/keys.json"
  elif [[ -f "$TEMPLATE_FILES_DIR/keys.json" ]]; then
    echo "You don't have access to decrypted secrets. Falling back to template-files/keys.json."
    keys_file="$TEMPLATE_FILES_DIR/keys.json"
  else
    echo "Warning: No keys.json file found"
    return
  fi

  # Also check for private-keys.json override
  local private_keys_file="$EXPO_DIR/private-keys.json"

  # Export the keys file path for later use
  KEYS_FILE="$keys_file"
  PRIVATE_KEYS_FILE=""
  if [[ -f "$private_keys_file" ]]; then
    PRIVATE_KEYS_FILE="$private_keys_file"
  fi
}

# Get a key value (checks private-keys.json first, then keys.json)
get_key() {
  local key="$1"
  local value=""

  # Try private-keys.json first
  if [[ -n "$PRIVATE_KEYS_FILE" ]] && [[ -f "$PRIVATE_KEYS_FILE" ]]; then
    value=$(json_read "$PRIVATE_KEYS_FILE" ".[\"$key\"]")
    if [[ -n "$value" ]]; then
      echo "$value"
      return
    fi
  fi

  # Fall back to keys.json
  if [[ -n "$KEYS_FILE" ]] && [[ -f "$KEYS_FILE" ]]; then
    value=$(json_read "$KEYS_FILE" ".[\"$key\"]")
    echo "$value"
  fi
}

# =============================================================================
# Macro Resolution
# =============================================================================

resolve_macros() {
  echo "Resolving macros..."

  # TEST_APP_URI
  TEST_APP_URI="${TEST_SUITE_URI:-}"
  echo "Resolved TEST_APP_URI macro to \"$TEST_APP_URI\""

  # TEST_CONFIG
  TEST_CONFIG="${TEST_CONFIG:-}"
  echo "Resolved TEST_CONFIG macro to \"$TEST_CONFIG\""

  # TEST_SERVER_URL
  TEST_SERVER_URL="TODO"
  echo "Resolved TEST_SERVER_URL macro to \"$TEST_SERVER_URL\""

  # TEST_RUN_ID
  if [[ -n "${UNIVERSE_BUILD_ID:-}" ]]; then
    TEST_RUN_ID="$UNIVERSE_BUILD_ID"
  else
    TEST_RUN_ID=$(generate_uuid)
  fi
  echo "Resolved TEST_RUN_ID macro to \"$TEST_RUN_ID\""

  # TEMPORARY_SDK_VERSION (from app.json)
  if [[ -f "$APP_JSON" ]]; then
    TEMPORARY_SDK_VERSION=$(json_read "$APP_JSON" ".expo.sdkVersion")
  else
    TEMPORARY_SDK_VERSION=""
    echo "Warning: app.json not found at $APP_JSON"
  fi
  echo "Resolved TEMPORARY_SDK_VERSION macro to \"$TEMPORARY_SDK_VERSION\""

  echo ""
}

# =============================================================================
# EXBuildConstants.plist Generation
# =============================================================================

generate_build_constants() {
  local relative_path="${BUILD_CONSTANTS_PLIST#$EXPO_DIR/}"
  echo "Generating build config $relative_path ..."

  # Create the plist file if it doesn't exist
  if [[ ! -f "$BUILD_CONSTANTS_PLIST" ]]; then
    cat > "$BUILD_CONSTANTS_PLIST" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>
EOF
  fi

  # Check if USE_GENERATED_DEFAULTS is explicitly set to false
  local use_generated=$(plist_read "$BUILD_CONSTANTS_PLIST" "USE_GENERATED_DEFAULTS")
  if [[ "$use_generated" == "false" ]]; then
    echo "USE_GENERATED_DEFAULTS is false, skipping generation"
    return
  fi

  # Set macro values
  plist_set_string "$BUILD_CONSTANTS_PLIST" "TEST_APP_URI" "$TEST_APP_URI"
  plist_set_string "$BUILD_CONSTANTS_PLIST" "TEST_CONFIG" "$TEST_CONFIG"
  plist_set_string "$BUILD_CONSTANTS_PLIST" "TEST_SERVER_URL" "$TEST_SERVER_URL"
  plist_set_string "$BUILD_CONSTANTS_PLIST" "TEST_RUN_ID" "$TEST_RUN_ID"
  plist_set_string "$BUILD_CONSTANTS_PLIST" "TEMPORARY_SDK_VERSION" "$TEMPORARY_SDK_VERSION"

  # Set EXPO_RUNTIME_VERSION from Info.plist
  local bundle_version=$(plist_read "$INFO_PLIST" "CFBundleVersion")
  if [[ -z "$bundle_version" ]]; then
    bundle_version=$(plist_read "$INFO_PLIST" "CFBundleShortVersionString")
  fi
  plist_set_string "$BUILD_CONSTANTS_PLIST" "EXPO_RUNTIME_VERSION" "$bundle_version"

  # Set API_SERVER_ENDPOINT if not already set
  local api_endpoint=$(plist_read "$BUILD_CONSTANTS_PLIST" "API_SERVER_ENDPOINT")
  if [[ -z "$api_endpoint" ]]; then
    plist_set_string "$BUILD_CONSTANTS_PLIST" "API_SERVER_ENDPOINT" "https://api.expo.dev/v2/"
  fi

  # Set USE_EMBEDDED_SNACK_RUNTIME if not already set
  local use_embedded_snack=$(plist_read "$BUILD_CONSTANTS_PLIST" "USE_EMBEDDED_SNACK_RUNTIME")
  if [[ -z "$use_embedded_snack" ]]; then
    plist_set_bool "$BUILD_CONSTANTS_PLIST" "USE_EMBEDDED_SNACK_RUNTIME" "true"
  fi

  # Set USE_GENERATED_DEFAULTS to true
  plist_set_bool "$BUILD_CONSTANTS_PLIST" "USE_GENERATED_DEFAULTS" "true"

  # Sort keys alphabetically by converting to XML, sorting, and back
  # PlistBuddy doesn't support sorting, so we use plutil
  # First, ensure the plist is valid
  plutil -lint "$BUILD_CONSTANTS_PLIST" >/dev/null 2>&1 || {
    echo "Warning: Generated plist is not valid"
  }
}

# =============================================================================
# Template File Copying
# =============================================================================

copy_template_files() {
  local ios_paths_file="$TEMPLATE_FILES_DIR/ios-paths.json"

  if [[ ! -f "$ios_paths_file" ]]; then
    echo "Warning: ios-paths.json not found at $ios_paths_file"
    return
  fi

  # Parse the paths from ios-paths.json
  # Expected format: { "paths": { "source": "destination", ... } }

  # Get the template paths
  local template_source="GoogleService-Info.plist"
  local template_dest=$(json_read "$ios_paths_file" ".paths[\"$template_source\"]")

  if [[ -z "$template_dest" ]]; then
    echo "Warning: No destination found for $template_source in ios-paths.json"
    return
  fi

  # Check if this template should be skipped
  for skip in "${SKIP_TEMPLATES[@]}"; do
    if [[ "$skip" == "$template_source" ]]; then
      echo "Skipping template $TEMPLATE_FILES_DIR/ios/$template_source ..."
      return
    fi
  done

  local source_file="$TEMPLATE_FILES_DIR/ios/$template_source"
  local dest_file="$EXPO_DIR/$template_dest"

  echo "Rendering $dest_file from template $source_file..."

  if [[ ! -f "$source_file" ]]; then
    echo "Error: Couldn't find $source_file file."
    exit 1
  fi

  # Read the template file
  local content
  content=$(cat "$source_file")

  # Substitute all ${VARIABLE} patterns with values from keys
  # List of known keys to substitute
  local keys=(
    "FIREBASE_API_KEY"
    "FIREBASE_GCM_SENDER_ID"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_BUNDLE_ID"
    "FIREBASE_GOOGLE_APP_ID"
    "FIREBASE_CLIENT_ID"
    "FIREBASE_REVERSED_CLIENT_ID"
    "FIREBASE_DATABASE_URL"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_PLIST_VERSION"
  )

  for key in "${keys[@]}"; do
    local value=$(get_key "$key")
    # Escape special characters for sed
    local escaped_value=$(printf '%s\n' "$value" | sed -e 's/[\/&]/\\&/g')
    content=$(echo "$content" | sed "s/\${$key}/$escaped_value/g")
  done

  # Create destination directory if it doesn't exist
  mkdir -p "$(dirname "$dest_file")"

  # Only write if content is different
  if [[ -f "$dest_file" ]]; then
    local existing_content
    existing_content=$(cat "$dest_file")
    if [[ "$content" == "$existing_content" ]]; then
      echo "No changes to $template_source"
      return
    fi
  fi

  echo "$content" > "$dest_file"
}

# =============================================================================
# Main
# =============================================================================

main() {
  echo "=== iOS Dynamic Macros Generator ==="
  echo "Configuration: $CONFIGURATION"
  echo "iOS Directory: $IOS_DIR"
  echo "Expo Directory: $EXPO_DIR"
  echo ""

  # Load keys
  load_keys

  # Resolve macros
  resolve_macros

  # Generate EXBuildConstants.plist
  generate_build_constants

  # Copy template files with substitution
  copy_template_files

  echo ""
  echo "=== Done ==="
}

main
