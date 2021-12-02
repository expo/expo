#!/usr/bin/env bash

echo " ☛  Ensuring Android project is setup..."

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    yarn
fi

REACT_NATIVE_VERSION=$(node --print "require('react-native/package.json').version")

if [ -d "node_modules/react-native/android/com/facebook/react/react-native/$REACT_NATIVE_VERSION" ]; then
    echo " ✅ React Android is installed"
else
    echo " ⚠️  Compiling React Android (~5-10 minutes)..."

    if [ ! -f "../../react-native-lab/react-native/local.properties" ]; then
        # Copying local.properties to react-native-lab since it may come in handy
        if [ -f "../../android/local.properties" ]; then
            cp ../../android/local.properties ../../react-native-lab/react-native
            echo "   ✅ local.properties copied from Expo client Android project"
        else
            echo "   ⚠️  No local.properties found, the build may fail if you have no required (ANDROID_*) env variables set"
        fi
    fi

    # Go to our fork of React Native
    cd ../../react-native-lab/react-native
    # Build the AARs (~5-10 minutes)
    ./gradlew :ReactAndroid:installArchives 
    # Come back to the project
    cd ../../apps/bare-expo

    echo " ✅ React Android is now installed!"
fi

../../tools/bin/expotools.js android-generate-dynamic-macros --configuration $1 --bare
echo " ✅ Generete dynamic macros"
