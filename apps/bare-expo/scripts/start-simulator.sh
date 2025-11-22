#!/usr/bin/env bash

set -euo pipefail

port=${2:-8081}
CURRENT_ENV=${NODE_ENV:-"development"}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo " ☛  Bootstrapping Expo in ${CURRENT_ENV} mode"

"$DIR/setup-ios-project.sh"

if [ "${CURRENT_ENV}" = "test" ]; then
    if command -v maestro > /dev/null; then
    # if brew ls --versions applesimutils > /dev/null; then
        echo " ✅ Maestro are installed"
    else
        echo "Maestro is not installed, installing..."
        curl -Ls "https://get.maestro.mobile.dev" | bash
        brew tap facebook/fb
        brew install facebook/fb/idb-companion
    fi

    if [ -d "ios/build/BareExpo.app" ]; then
        echo " ✅ Project is built for iOS"
    else
        echo " ⚠️  Building the project..."
        "$DIR/start-ios-e2e-test.ts" --build
    fi

    echo " ☛  Starting E2E tests"
    # Run our default E2E tests
    "${DIR}/start-ios-e2e-test.ts" --test
else
    echo " ☛  Running the iOS project..."
    npx expo run:ios --port "${port}"
fi

