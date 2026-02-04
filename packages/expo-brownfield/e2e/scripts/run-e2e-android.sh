#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

PROJECT_DIR=$(mktemp -d)
echo " ✅ Temporary directory created: $PROJECT_DIR"

# [1] Setup native project
$DIR/create-android-project.sh $PROJECT_DIR

# [2] Build and run the app
$DIR/install-app-android.sh $PROJECT_DIR

# [3] Run e2e tests
maestro test $DIR/../maestro/__tests__/android

# [4] Cleanup
rm -rf $PROJECT_DIR
