#!/usr/bin/env bash

port=${1:-8081}

PACKAGER_STATUS_URL="http://localhost:${port}/status"
# Check if Metro is running
STATUS=$(curl --silent $PACKAGER_STATUS_URL)

if [ "${STATUS}" = "packager-status:running" ]; then
    echo " ✅ Verified Metro Bundler is running."
else
    echo " ⚠️  Starting Metro Bundler..."
    # yarn run clear-metro
    # yarn start

  commandFile=$(dirname "$0")/start.command
  cat > ${commandFile} << EOF
cd "\$(dirname "\$0")/.."
# Run 'react-native start --help' to get more parameters
yarn start --port ${port}
EOF
  # execute the file in a new command line window
  chmod 0755 ${commandFile}
  open ${commandFile}
  
fi
