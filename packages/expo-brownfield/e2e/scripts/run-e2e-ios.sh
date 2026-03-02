#!/usr/bin/env bash

APP_ID=${APP_ID:-dev.expo.BrownfieldIntegratedTester}
CONFIGURATION=${CONFIGURATION:-Release}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Setup simulator
source $DIR/setup-simulator.sh
start_simulator

# Install app
source $DIR/install-app-ios.sh $DEVICE_ID

# Run the tests
maestro test -e APP_ID=$APP_ID $DIR/../maestro/__tests__/ios
if [ "$CONFIGURATION" = "Debug" ]; then
  maestro test -e APP_ID=$APP_ID $DIR/../maestro/__tests__/common
fi
