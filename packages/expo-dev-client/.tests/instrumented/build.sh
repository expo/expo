#!/bin/bash

# Android

npx expo export:embed \
    --platform android \
    --dev false \
    --entry-file .tests/instrumented/app/index.js \
    --bundle-output android/src/androidTest/assets/bundled_app.bundle
