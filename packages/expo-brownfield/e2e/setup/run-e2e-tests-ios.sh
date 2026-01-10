#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

PROJECT_DIR=$(mktemp -d)
echo " ✅ Temporary directory created: $PROJECT_DIR"

# [1] Setup simulator
source $DIR/setup-simulator.sh
start_simulator

# [2] Setup native projects (UIKit + SwiftUI)
$DIR/create-ios-projects.sh $PROJECT_DIR

# [3] Build brownfield artifacts
# TODO(pmleczek): Build brownfield artifacts

# [4] Build and run native apps consuming the brownfield
$DIR/install-app-ios.sh $PROJECT_DIR $DEVICE_ID

# [5] Run E2E tests
maestro test $DIR/../tests/ios/hello_ios.yml

# [6] Cleanup
# rm -rf $PROJECT_DIR
# TODO(pmleczek): Stop simulator, etc. (?)
