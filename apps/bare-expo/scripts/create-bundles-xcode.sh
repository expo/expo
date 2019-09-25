# Print commands before executing them (useful for troubleshooting)
set -x

DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH
EXPO_APPS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLI_PATH="$EXPO_APPS_PATH/bare-expo/node_modules/react-native/cli.js"

if [[ "$CONFIGURATION" = *Debug* && ! "$PLATFORM_NAME" == *simulator ]]; then
  IP=$(ipconfig getifaddr en0)
  if [ -z "$IP" ]; then
    IP=$(ifconfig | grep 'inet ' | grep -v ' 127.' | cut -d\   -f2  | awk 'NR==1{print $1}')
  fi

  echo "$IP" > "$DEST/ip.txt"
fi

if [[ "$SKIP_BUNDLING" ]]; then
  echo "SKIP_BUNDLING enabled; skipping."
  exit 0;
fi

case "$CONFIGURATION" in
  *Debug*)
    if [[ "$PLATFORM_NAME" == *simulator ]]; then
      if [[ "$FORCE_BUNDLING" ]]; then
        echo "FORCE_BUNDLING enabled; continuing to bundle."
      else
        echo "Skipping bundling in Debug for the Simulator (since the packager bundles for you). Use the FORCE_BUNDLING flag to change this behavior."
        exit 0;
      fi
    else
      echo "Bundling for physical device. Use the SKIP_BUNDLING flag to change this behavior."
    fi

    DEV=true
    ;;
  "")
    echo "$0 must be invoked by Xcode"
    exit 1
    ;;
  *)
    DEV=false
    ;;
esac

createBundle()
{
    BUNDLE_PROJECT_FOLDER=$1
    cd "$EXPO_APPS_PATH/bare-expo/" && node "$CLI_PATH" bundle \
        --platform ios \
        --entry-file "$EXPO_APPS_PATH/$BUNDLE_PROJECT_FOLDER/index.js" \
        --dev false \
        --reset-cache \
        --bundle-output "$DEST/$BUNDLE_PROJECT_FOLDER.jsbundle" \
        --assets-dest "$DEST" 
}

createBundle "standalone-ncl"
createBundle "bare-expo"

