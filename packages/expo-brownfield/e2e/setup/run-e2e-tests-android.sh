#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

PROJECT_DIR=$(mktemp -d)
echo " ✅ Temporary directory created: $PROJECT_DIR"

# [1] Setup emulator
$DIR/setup-emulator.sh

# [2] Setup native project
$DIR/create-android-project.sh $PROJECT_DIR

# [3] Build and publish brownfield artifacts
# TODO(pmleczek): Build and publish brownfield artifacts

# [4] Build and run native app consuming the brownfield
$DIR/install-app-android.sh $PROJECT_DIR

# [5] Run E2E tests
maestro test $DIR/../tests/android/hello_android.yml

# [6] Cleanup
rm -rf $PROJECT_DIR
# TODO(pmleczek): Stop emulator, etc. (?)
