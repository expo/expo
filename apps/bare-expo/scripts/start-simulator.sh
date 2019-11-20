#!/usr/bin/env bash

set -euo pipefail

port=${2:-8081}
CURRENT_ENV=${NODE_ENV:-"development"}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo " ☛  Bootstrapping Expo in ${CURRENT_ENV} mode"

"$DIR/setup-ios-project.sh"

"$DIR/start-metro.sh" "$port"

if [ "${CURRENT_ENV}" = "test" ]; then
    if command -v applesimutils > /dev/null; then 
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
    
    # CONNECTED_DEVICE=$(node ios-deploy -c | grep -oE 'Found ([0-9A-Za-z\-]+)' | sed 's/Found //g')
    # if [ -z "${CONNECTED_DEVICE}" ]; then
        # Build and run the iOS project using `react-native run-ios`
        node "node_modules/react-native/cli.js" run-ios --no-packager --port "$port"
    # else
    #     # Build and run the iOS project using `react-native run-ios`
    #     node "node_modules/react-native/cli.js" run-ios --no-packager --udid ${CONNECTED_DEVICE} --port ${port}
    # fi
fi

