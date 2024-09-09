#!/usr/bin/env bash

echo " ☛  Ensuring Android project is setup..."

CURR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "${CURR_DIR}/.."

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    yarn
fi

"${CURR_DIR}/../../../bin/expotools" android-generate-dynamic-macros --configuration $1 --bare
echo " ✅ Generate dynamic macros"

if [ ! -d "android/app/src/androidTest/assets" ]; then
  mkdir -p android/app/src/androidTest/assets
fi
yarn --silent ts-node --print --transpile-only -e 'JSON.stringify(require("./e2e/TestSuite-test.native.js").TESTS, null, 2)' > android/app/src/androidTest/assets/TestSuite.json
echo " ✅ Generate e2e test cases"
