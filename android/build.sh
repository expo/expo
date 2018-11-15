#!/usr/bin/env bash
set -euo pipefail

../tools-public/generate-dynamic-macros-android.sh

# download dependencies in retry loop to reduce network-caused errors
for i in {1..3}; do ((i > 1)) && sleep 5; ./gradlew --stacktrace :app:preBuild && break; done

./gradlew --stacktrace :app:assembleProdKernelRelease
