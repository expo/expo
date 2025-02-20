#!/bin/bash
# fixes generate-codegen-artifacts.js (executed in Expo Go's pod install step) resolving react-native to root node_modules/react-native instead of react-native-lab
# It'd generate incorrect codegen artifacts for react-native

TARGET="../../../react-native-lab/react-native/packages/react-native"
LINK="./node_modules/react-native"

rm -f "$LINK"

# Create symlink based on platform
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    cmd <<< "mklink /D \"${LINK//\//\\}\" \"${TARGET//\//\\}\"" > /dev/null
else
    # Linux/Unix
    ln -sfn "$TARGET" "$LINK"
fi
