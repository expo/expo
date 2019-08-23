#!/usr/bin/env bash

port=$1
if [ -z "${port}" ]; then
  port=8081
fi

PACKAGER_STATUS_URL="http://localhost:${port}/status"
# Check if Metro is running
STATUS=$(curl --silent $PACKAGER_STATUS_URL)

if [ "${STATUS}" = "packager-status:running" ]; then
    echo " ✅ Verified Metro Bundler is running."
else
    echo " ⚠️  Starting Metro Bundler..."
    yarn run clear-metro
    # yarn start

  commandFile=$(dirname "$0")/start.command
  cat > ${commandFile} << EOF
cd "\$(dirname "\$0")/.."
# Run 'react-native start --help' to get more parameters
yarn start --port ${port}
EOF
  # Permission is required by system of unix likely.
  chmod 0755 ${commandFile}
  open ${commandFile}
  
fi
