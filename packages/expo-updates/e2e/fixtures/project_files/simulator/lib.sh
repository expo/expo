# shellcheck shell=bash
# Helpers for updates E2E flows that run on a device in Expo Simulators.
# simulator-test-executor.sh sources this file and sets PLATFORM, CONFIGURATION,
# UPDATES_SERVER_PORT and OUTPUT_DIR first. Flows call these functions; any failed step fails the
# flow.

TOOLS_DIR="$PWD/simulator/tools"
EAS=("$TOOLS_DIR/node_modules/.bin/eas")
AGENT_DEVICE=("${EAS[@]}" simulator:exec "$TOOLS_DIR/node_modules/.bin/agent-device")
APP_ID="dev.expo.updatese2e"
FLOW_STATE_FILE="$OUTPUT_DIR/flow-state.json"
COPIED_TEXT=""
SERVED_UPDATE_ID=""

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

# simulator/tools/package-lock.json pins the versions. The job holds an Expo token and an npm
# token, so install scripts do not run.
install_tools() {
  npm ci --prefix "$TOOLS_DIR" --ignore-scripts --no-audit --no-fund --loglevel=error
  echo "eas-cli: $("${EAS[@]}" --version)"
  echo "agent-device: $("$TOOLS_DIR/node_modules/.bin/agent-device" --version)"
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

# Usage: serve_manifest NAME [CHANNEL]. Sets SERVED_UPDATE_ID to the ID of the served update.
serve_manifest() {
  SERVED_UPDATE_ID="$(updates_server_get "serve-manifest?name=$1&platform=$PLATFORM${2:+&channel=$2}")"
}

# #endregion
# #region Flow state

# Usage: js EXPRESSION. Evaluates EXPRESSION with simulator/updates-api.js and prints the result.
# EXPRESSION can use `api` (the updates server), `copiedText` (from read_text) and `output`, which
# keeps its values until the next flow starts.
js() {
  OUTPUT_STATE_FILE="$FLOW_STATE_FILE" UPDATES_SERVER_PORT="$UPDATES_SERVER_PORT" \
    COPIED_TEXT="$COPIED_TEXT" node ./simulator/updates-api.js "$1"
}

# Usage: expect_js DESCRIPTION EXPRESSION. Waits up to 10 s for EXPRESSION to be true. The app
# sends some values, such as its log entries, to the updates server a short time after a tap.
expect_js() {
  local deadline=$((SECONDS + 10)) result
  until [[ "$(js "$2")" == "true" ]]; do
    if ((SECONDS >= deadline)); then
      result="$(js "$2")"
      echo "Failed: $1. The expression is $result: $2" >&2
      return 1
    fi
    sleep 1
  done
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

# #endregion
# #region App values

# Usage: expect_values [--timeout MS] ID=VALUE... Waits until each element ID shows the text VALUE.
# The default timeout is 15 s.
expect_values() {
  local timeout_ms=15000
  if [[ "$1" == "--timeout" ]]; then
    timeout_ms=$2
    shift 2
  fi
  local deadline=$((SECONDS + timeout_ms / 1000)) differences
  while true; do
    if differences="$(device snapshot --json | node ./simulator/app-values.js "$@" 2>&1)"; then
      return 0
    fi
    if ((SECONDS >= deadline)); then
      echo "The app values did not match in $((timeout_ms / 1000)) s:" >&2
      echo "$differences" >&2
      if grep -q "Egress tunnel disconnected" "$OUTPUT_DIR/egress.log" 2> /dev/null; then
        echo "The egress tunnel disconnected during the run. See $OUTPUT_DIR/egress.log." >&2
      fi
      return 1
    fi
    sleep 1
  done
}

# Usage: read_text ID. Waits up to 15 s for element ID, then sets COPIED_TEXT to its text.
read_text() {
  local deadline=$((SECONDS + 15))
  until COPIED_TEXT="$(device snapshot --json | node ./simulator/app-values.js --print "$1")"; do
    if ((SECONDS >= deadline)); then
      echo "The app did not show element $1 in 15 s." >&2
      return 1
    fi
    sleep 1
  done
}

# Usage: expect_app_js ID DESCRIPTION EXPRESSION. Waits up to 15 s for EXPRESSION to be true, with
# copiedText set to the text of element ID.
expect_app_js() {
  local deadline=$((SECONDS + 15))
  until read_text "$1" && [[ "$(js "$3")" == "true" ]]; do
    if ((SECONDS >= deadline)); then
      echo "Failed: $2. $1 is \"$COPIED_TEXT\"." >&2
      return 1
    fi
    sleep 1
  done
}

# #endregion
# #region Flow setup

# Each flow starts with a fresh install of the app, a restarted updates server and empty state.
before_each() {
  reinstall_app
  # shellcheck disable=SC2119 # No query: restart with the default server settings.
  restart_updates_server
  printf '{}' > "$FLOW_STATE_FILE"
  COPIED_TEXT=""
  SERVED_UPDATE_ID=""
}

# #endregion
