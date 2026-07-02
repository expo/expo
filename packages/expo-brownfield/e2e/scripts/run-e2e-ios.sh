#!/usr/bin/env bash

APP_ID=${APP_ID:-dev.expo.BrownfieldIntegratedTester}
CONFIGURATION=${CONFIGURATION:-Release}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Setup simulator
source $DIR/setup-simulator.sh
if ! start_simulator || [[ -z "$DEVICE_ID" ]]; then
  echo " ❌ Could not find or boot the target iOS simulator. Check that the runtime is installed (xcrun simctl list runtimes) and matches DEVICE/IOS_VERSION in setup-simulator.sh."
  exit 1
fi

# Install app
source $DIR/install-app-ios.sh $DEVICE_ID

# Run the tests
maestro test \
  -e APP_ID=$APP_ID \
  $DIR/../maestro/__tests__/common/communication.yml \
  $DIR/../maestro/__tests__/common/navigation.yml

if [ "$CONFIGURATION" = "Debug" ]; then
  maestro test \
    -e APP_ID=$APP_ID \
    $DIR/../maestro/__tests__/common/dev-menu.yml
fi
