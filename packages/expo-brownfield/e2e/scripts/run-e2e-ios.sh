#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Setup simulator
source $DIR/setup-simulator.sh
start_simulator

# Install app
source $DIR/install-app-ios.sh $DEVICE_ID

# Run the tests
maestro test $DIR/../maestro/__tests__/ios
