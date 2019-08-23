#!/usr/bin/env bash

# set -e


SIMULATOR_NAME="bare-expo"
port=$2
if [ -z "${port}" ]; then
  port=8081
fi

CURRENT_ENV=$NODE_ENV
if [ -z "${CURRENT_ENV}" ]; then
  CURRENT_ENV="development"
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo " ☛  Bootstrapping Expo in ${CURRENT_ENV} mode"

$DIR/setup-project.sh

$DIR/start-metro.sh $port

if [ "${CURRENT_ENV}" = "test" ]; then
    if which applesimutils > /dev/null; then 
    # if brew ls --versions applesimutils > /dev/null; then 
        echo " ✅ Detox simulators are installed"
    else
        echo "Detox simulators are not installed, installing..."
        brew tap wix/brew
        brew install applesimutils
    fi

    if [ -d "ios/build/Build/Products/Debug-iphonesimulator/BareExpo.app" ]; then
        echo " ✅ Debug Detox project is built for iOS"
    else
        echo " ⚠️  Building the debug Detox project..."
        yarn run ios:detox:build:debug
    fi

    echo " ☛  Opening the iOS simulator app"
    # Detox requires that the app is opened before it can connect
    open -a "Simulator"

    echo " ☛  Starting Detox in watch mode"
    # Run our default E2E tests
    yarn run ios:detox:test:debug --watch
else 
    echo " ☛  Running the iOS project..."
    # Build and run the iOS project using `react-native run-ios`
    node "node_modules/react-native/cli.js" run-ios --no-packager --port ${port}
fi

