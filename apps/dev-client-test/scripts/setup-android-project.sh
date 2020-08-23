#!/usr/bin/env bash

echo " ☛  Ensuring Android project is setup..."

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    yarn
fi

# 1. yarn why react-native : ... Found "react-native@0.62.2" ...
# 2. grep Found            : Found "react-native@0.62.2"
# 3. cut -d '@' -f2        : 0.62.2"
# 4. rev                   : "2.26.0
# 5. cut -c 2-             : 2.26.0
# 6. rev                   : 0.62.2
REACT_NATIVE_VERSION=$(yarn why react-native | grep Found | cut -d '@' -f2 | rev | cut -c 2- | rev)

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
    cd ../../apps/dev-client-test

    echo " ✅ React Android is now installed!"
fi
