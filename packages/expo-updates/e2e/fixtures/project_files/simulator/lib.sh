# shellcheck shell=bash
# Helpers for updates E2E flows that run on a device in Expo Simulators.
# simulator-test-executor.sh sources this file and sets PLATFORM, CONFIGURATION and
# UPDATES_SERVER_PORT first. Flows call these functions; any failed step fails the flow.

TOOLS_DIR="$PWD/simulator/tools"
EAS=("$TOOLS_DIR/node_modules/.bin/eas")
AGENT_DEVICE=("${EAS[@]}" simulator:exec "$TOOLS_DIR/node_modules/.bin/agent-device")
APP_ID="dev.expo.updatese2e"

case "$PLATFORM" in
  ios)
    case "$CONFIGURATION" in
      debug) XCODE_CONFIGURATION=Debug ;;
      release) XCODE_CONFIGURATION=Release ;;
    esac
    APP_PATH="ios/build/Build/Products/$XCODE_CONFIGURATION-iphonesimulator/updatese2e.app"
    ;;
  android)
    APP_PATH="android/app/build/outputs/apk/$CONFIGURATION/app-$CONFIGURATION.apk"
    ;;
esac

# #region Tools

# The Expo Simulators commands change often, so each run installs the latest versions.
install_tools() {
  npm install --prefix "$TOOLS_DIR" --no-save --no-audit --no-fund --loglevel=error \
    eas-cli@latest agent-device@latest
}

# #endregion
# #region Updates server

updates_server_get() {
  curl --fail --silent --show-error "http://localhost:$UPDATES_SERVER_PORT/$1"
}

# shellcheck disable=SC2120 # The flows pass the optional query.
# Usage: restart_updates_server [query], for example restart_updates_server serveOverriddenUrl=true
restart_updates_server() {
  updates_server_get "restart-server${1:+?$1}" > /dev/null
  sleep 0.5
}

serve_manifest() {
  updates_server_get "serve-manifest?name=$1&platform=$PLATFORM" > /dev/null
}

# #endregion
# #region Device

device() {
  "${AGENT_DEVICE[@]}" "$@" --platform "$PLATFORM"
}

reinstall_app() {
  device uninstall "$APP_ID"
  device install "$APP_ID" "$APP_PATH"
}

launch_app() {
  device open "$APP_ID" --relaunch
}

stop_app() {
  device close "$APP_ID"
}

tap() {
  device press "id=\"$1\""
}

# Waits for the updateString value of the app to equal the given text.
expect_update_string() {
  if ! device wait "id=\"updateString\" text=\"$1\"" 15000; then
    echo "Expected updateString to be \"$1\". It is:" >&2
    device get text 'id="updateString"' >&2 || true
    return 1
  fi
}

# #endregion
# #region Flow setup

# Each flow starts with a fresh install of the app and a restarted updates server.
before_each() {
  reinstall_app
  # shellcheck disable=SC2119 # No query: restart with the default server settings.
  restart_updates_server
}

# #endregion
