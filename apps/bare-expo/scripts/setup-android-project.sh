#!/usr/bin/env bash

echo " ☛  Ensuring Android project is setup..."

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    yarn
fi

if [ -d "node_modules/react-native/android" ]; then
    echo " ✅ React Android is installed"
else
    echo " ⚠️  Compiling React Android (~5-10 minutes)..."
    # Go to our fork of React Native
    cd ../../react-native-lab/react-native
    # Build the AARs (~5-10 minutes)
    ./gradlew :ReactAndroid:installArchives 
    # Come back to the project
    cd ../../apps/bare-expo
    
    # echo " ⚠️  Syncing React Android..."
    # Delete the Android caches
    # rm -rf ./.gradle 
    # Sync gradle
    # gradle --recompile-scripts
    
    # cd ..

    echo " ✅ React Android is now installed!"
fi
