#!/usr/bin/env bash

echo " ☛  Ensuring iOS project is setup..."

if type "pod" > /dev/null; then
    echo " ✅ Has CocoaPods CLI"
else
  echo " 🛑  ERROR: Missing CocoaPods installation. Run 'sudo gem install cocoapods --pre' to install"
  exit 1
fi

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    yarn
fi

if [ -d "ios/Pods" ]; then
    echo " ✅ Project CocoaPods installed"
else
    echo " ⚠️  Cannot find Pods for this project, installing..."
    cd ios
    pod install
    cd ..
fi
