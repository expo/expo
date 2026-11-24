#!/usr/bin/env bash
# Runs a suite of updates E2E flows on a device in Expo Simulators.
#
# Usage: simulator-test-executor.sh <suite file> <ios|android> <debug|release>
#
# The suite file lists one flow file in simulator/tests per line. The app must already be built
# for the platform and configuration. The updates server runs on this machine, and the device
# reaches it through the local egress tunnel of the session.
#
# Needs an Expo login (or EXPO_TOKEN) for an account with Expo Simulators access.

# shellcheck source-path=SCRIPTDIR/..
set -euo pipefail

usage() {
  echo "Usage: $0 <suite file> <ios|android> <debug|release>" >&2
  exit 1
}

[[ $# -eq 3 && -f "$1" ]] || usage
SUITE=$1
PLATFORM=$2
CONFIGURATION=$3
[[ "$PLATFORM" == "ios" || "$PLATFORM" == "android" ]] || usage
[[ "$CONFIGURATION" == "debug" || "$CONFIGURATION" == "release" ]] || usage

. .env
UPDATES_SERVER_PORT=$EXPO_PUBLIC_UPDATES_SERVER_PORT
OUTPUT_DIR="${SIMULATOR_OUTPUT_DIR:-$PWD/simulator/output/$PLATFORM-$CONFIGURATION}"
mkdir -p "$OUTPUT_DIR"

. ./simulator/lib.sh

[[ -e "$APP_PATH" ]] || {
  echo "The app is not built: $APP_PATH does not exist." >&2
  exit 1
}

SUITE_NAME="$(basename "$SUITE" .txt)"
SESSION_NAME="Updates E2E ${SUITE_NAME#updates-e2e-} $CONFIGURATION"
DEVICE_ARGS=()
if [[ "$PLATFORM" == "ios" ]]; then
  DEVICE_ARGS=(--device "${UPDATES_E2E_SIMULATOR_DEVICE:-iPhone 17}")
fi
UPDATES_SERVER_PID=""
EGRESS_PID=""
SESSION_ID=""

reset_dotenv() {
  printf '# managed by eas-cli\n' > .env.eas-simulator
}

start_updates_server() {
  if lsof -t -i:"$UPDATES_SERVER_PORT" > /dev/null; then
    echo "Port $UPDATES_SERVER_PORT is already in use." >&2
    exit 1
  fi
  MAESTRO_UPDATES_SERVER_PORT=$UPDATES_SERVER_PORT pnpm ts-node ./maestro/updates-server/start.ts \
    > "$OUTPUT_DIR/updates-server.log" 2>&1 &
  UPDATES_SERVER_PID=$!
  for _ in $(seq 1 60); do
    if curl --silent --output /dev/null "http://localhost:$UPDATES_SERVER_PORT/"; then
      return 0
    fi
    if ! kill -0 "$UPDATES_SERVER_PID" 2> /dev/null; then
      break
    fi
    sleep 1
  done
  echo "The updates server did not start. Its log:" >&2
  cat "$OUTPUT_DIR/updates-server.log" >&2
  exit 1
}

# The egress client must stay connected for the life of the session. It also forwards
# localhost:<updates server port> on the device host to this machine.
start_egress() {
  "${EAS[@]}" simulator:egress > "$OUTPUT_DIR/egress.log" 2>&1 &
  EGRESS_PID=$!
  for _ in $(seq 1 120); do
    if grep -q "Egress tunnel connected" "$OUTPUT_DIR/egress.log"; then
      return 0
    fi
    if ! kill -0 "$EGRESS_PID" 2> /dev/null; then
      break
    fi
    sleep 1
  done
  echo "The egress tunnel did not connect. Its log:" >&2
  cat "$OUTPUT_DIR/egress.log" >&2
  exit 1
}

# On the Linux runners, the egress client can ignore SIGINT, so SIGTERM follows after 10 s.
stop_egress() {
  kill -INT "$EGRESS_PID" 2> /dev/null
  for _ in $(seq 1 10); do
    if ! kill -0 "$EGRESS_PID" 2> /dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "The egress client did not stop on SIGINT. Sending SIGTERM." >&2
  pkill -TERM -P "$EGRESS_PID" 2> /dev/null
  kill -TERM "$EGRESS_PID" 2> /dev/null
}

# The app logs of a stopped session become available a short time after it stops.
download_ios_app_logs() {
  for _ in 1 2 3 4 5 6; do
    sleep 20
    if "${EAS[@]}" simulator:logs --id "$SESSION_ID" --output "$OUTPUT_DIR/app-logs.ndjson" \
      --non-interactive; then
      return 0
    fi
  done
  echo "The app logs of session $SESSION_ID were not available after 120 s." >&2
}

cleanup() {
  local exit_code=$?
  set +e
  if [[ $exit_code -ne 0 && -n "$SESSION_ID" ]]; then
    echo "===== Screen and UI tree at the failure ====="
    device screenshot "$OUTPUT_DIR/failure.png"
    device snapshot --force-full
    echo "===== Updates server log, last 100 lines ====="
    tail -100 "$OUTPUT_DIR/updates-server.log"
    echo "===== Egress client log, last 50 lines ====="
    tail -50 "$OUTPUT_DIR/egress.log"
    echo "===== end ====="
  fi
  echo 'Cleaning up...'
  if grep -q EAS_SIMULATOR_SESSION_ID .env.eas-simulator 2> /dev/null; then
    "${EAS[@]}" simulator:stop --non-interactive
  fi
  reset_dotenv
  if [[ -n "$EGRESS_PID" ]]; then
    stop_egress
  fi
  if [[ -n "$UPDATES_SERVER_PID" ]]; then
    kill "$UPDATES_SERVER_PID" 2> /dev/null
    lsof -t -i:"$UPDATES_SERVER_PORT" | xargs kill 2> /dev/null
  fi
  if [[ $exit_code -ne 0 && "$PLATFORM" == "ios" && -n "$SESSION_ID" ]]; then
    download_ios_app_logs
  fi
  echo "Logs and screenshots are in $OUTPUT_DIR."
  exit $exit_code
}

install_tools
if ! "${EAS[@]}" simulator:availability --json --non-interactive | grep -q '"available": *true'; then
  echo "Expo Simulators is not available for this account. It needs a paid EAS plan." >&2
  exit 1
fi

trap cleanup EXIT
start_updates_server
reset_dotenv
"${EAS[@]}" simulator:start --platform "$PLATFORM" ${DEVICE_ARGS[@]+"${DEVICE_ARGS[@]}"} \
  --type agent-device \
  --egress local --egress-allow "localhost:$UPDATES_SERVER_PORT" \
  --max-duration-minutes 30 --name "$SESSION_NAME" --tag updates-e2e --non-interactive
SESSION_ID="$("${EAS[@]}" simulator:get --json --non-interactive |
  node -e 'let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => console.log(JSON.parse(s).id ?? ""))')"
start_egress

# The suite is read on fd 3, so the commands in a flow cannot read it from stdin.
while read -r flow <&3; do
  [[ -z "$flow" || "$flow" == \#* ]] && continue
  echo "===== $flow ($PLATFORM $CONFIGURATION) ====="
  # shellcheck disable=SC1090 # The suite file names the flows.
  . "./simulator/tests/$flow"
  echo "===== $flow passed ====="
done 3< "$SUITE"
