#!/bin/bash

export NODE_ENV=production

# Generate temporary app.json for `npx expo export:embed` and indicate that we want to use JSC bundling profile.
# The reason to use JSC because the bundle should be compatible with both JSC and Hermes.
cat > app.json <<EOF
{
  "expo": {
    "jsEngine": "jsc"
  }
}
EOF

# iOS

# Remove assets from previous build.
rm -rf ios/assets/

EXPO_BUNDLE_APP=1 npx expo export:embed \
    --platform ios \
    --dev false \
    --entry-file index.js \
    --unstable-transform-profile default \
    --bundle-output ios/main.jsbundle \
    --assets-dest ios \
    --reset-cache

rm ios/assets/__react-native-lab/react-native/package.json
rm ios/assets/__node_modules/css-tree/package.json

# Android

# Remove assets from previous build.
rm -rf android/src/debug/res/

EXPO_BUNDLE_APP=1 npx expo export:embed \
    --platform android \
    --dev false \
    --entry-file index.js \
    --unstable-transform-profile default \
    --bundle-output android/src/debug/assets/expo_dev_launcher_android.bundle \
    --assets-dest android/src/debug/res \
    --reset-cache

# Cleanup

rm app.json
