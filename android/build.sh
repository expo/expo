#!/usr/bin/env bash
set -euo pipefail

# download dependencies in retry loop to reduce network-caused errors
for i in {1..3}; do ((i > 1)) && sleep 5; ./gradlew --stacktrace :app:preBuild && break; done

./gradlew --stacktrace --warning-mode all :app:assembleProdKernel${1:-Debug}
