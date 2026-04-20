#!/usr/bin/env bash

APP_ID=${APP_ID:-dev.expo.brownfieldintegratedtester}
CONFIGURATION=${CONFIGURATION:-Release}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Install app
CONFIGURATION_LOWER=$(echo $CONFIGURATION | tr '[:upper:]' '[:lower:]')
adb install -r $GITHUB_WORKSPACE/apps/brownfield-tester/isolated/android/apk/app-$CONFIGURATION_LOWER.apk

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