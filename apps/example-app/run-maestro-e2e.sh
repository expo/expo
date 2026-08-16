#!/usr/bin/env bash
# Real Maestro E2E runner for the rollipop + Expo Router integration.
# Assumes: `expo run:ios` already built+installed the dev client on the booted
# simulator, OR we build it here. This script:
#   1. Starts `expo start --bundler rollipop` (the real rollipop dev server).
#   2. Runs the Maestro flow that launches the dev client against rollipop and
#      asserts the UI renders + Expo Router navigation works (no runtime crash).
set -u
ROOT=/Users/adm/Documents/Repos/rollipop-expo-integration
EXPO_CLI=$ROOT/packages/expo/packages/@expo/cli/bin/cli.js
ROLLIPOP=$ROOT/packages/rollipop/packages/rollipop
APP=$ROOT/packages/example-app
RN=$APP/node_modules/react-native
SIM=27088715-6C8B-436A-AC66-B2DA978A2944
PORT=8081
export PATH="$HOME/.maestro/bin:$PATH"

# 1) rollipop dev server
pkill -f "rollipop" 2>/dev/null; sleep 1
ROLLIPOP_BIN="$ROLLIPOP/bin/index.js" EXPO_BUNDLER=rollipop ROLLIPOP_REACT_NATIVE_PATH="$RN" \
  node "$EXPO_CLI" start --bundler rollipop --port $PORT --no-dev > /tmp/maestro-devserver.log 2>&1 &
DEV_PID=$!
echo "rollipop dev server pid=$DEV_PID"

# wait for ready
for i in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:$PORT/"; then echo "dev server up after ${i}s"; break; fi
  sleep 1
done

# 2) run maestro
maestro test "$APP/.maestro/rollipop-e2e.yaml"
RC=$?
kill $DEV_PID 2>/dev/null
echo "MAESTRO_EXIT=$RC"
exit $RC
