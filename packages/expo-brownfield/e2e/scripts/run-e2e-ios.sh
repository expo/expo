#!/usr/bin/env bash

APP_ID=${APP_ID:-dev.expo.BrownfieldIntegratedTester}
CONFIGURATION=${CONFIGURATION:-Release}
if [ "$CONFIGURATION" = "Debug" ]; then
  DEBUG=true
fi
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Setup simulator
source $DIR/setup-simulator.sh
start_simulator

# Install app
source $DIR/install-app-ios.sh $DEVICE_ID

# Run the tests
maestro test -e DEBUG=$DEBUG -e APP_ID=$APP_ID $DIR/../maestro/__tests__/common
