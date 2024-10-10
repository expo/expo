# Developing Expo Go

- [Introduction](#introduction)
- [External Contributions](#external-contributions)
- [Configuring your environment](#configuring-your-environment)
- [Building Expo Go](#building-expo-go)
- [Troubleshooting](#troubleshooting)

## Introduction

> [!TIP]
> If you just want to install Expo Go on a simulator or device, you do not need to build it from source. Instead, go to [expo.dev/go](https://expo.dev/go).

To build Expo Go for development of it, follow the instructions in the [section below](#configuring-your-environment).

## External Contributions

If you want to contribute to the Expo SDK, use the [Bare Expo app](https://github.com/expo/expo/tree/main/apps/bare-expo) for developing and testing your changes (unless your changes are specific to the Expo Go app).

Please check with us before putting work into a Pull Request for Expo Go! The best place to talk to us is on Discord at https://chat.expo.dev.

**Disclaimers:**

If you want to build a standalone app that has a custom icon and name, use [EAS Build](https://docs.expo.dev/build/setup/). You're in the wrong place and you shouldn't need to build Expo Go from source.

If you need to make native code changes to your Expo project, such as adding custom native modules, create a [development build](https://docs.expo.dev/develop/development-builds/introduction/). You're in the wrong place and you shouldn't need to build Expo Go from source.

## Configuring your environment

> Note: We support building Expo Go only on macOS.

- Install [direnv](http://direnv.net/).
- Clone this repo; we recommend cloning it to a directory whose full path does not include any spaces (you should clone all the submodules with `git clone --recurse-submodules`).
- Run `yarn` in the root directory.
- Run `yarn setup:native` in the root directory.
- Run `yarn build` in the `packages/expo` directory.


## Building Expo Go

1. Build React Native

You can build the React Native Android dep using `./gradlew :packages:react-native:ReactAndroid:buildCMakeDebug` in `react-native-lab/react-native` directory. This is optional because React Native will be built anyway when you build Expo Go, but can help to narrow down a potential issue surface area.

2. Start Metro in `apps/expo-go` directory

Metro needs to run prior running the build. This is because `et android-generate-dynamic-macros` / `et ios-generate-dynamic-macros` is run during the build and needs Metro to be running.

3. Build Expo Go

For Android, run `./gradlew app:assembleDebug` in the `apps/expo-go/android` directory.

For iOS:
- set `DEV_KERNEL_SOURCE` to `LOCAL` in `EXBuildConstants.plist`
- open and run `ios/Exponent.xcworkspace` in Xcode.

4. Run Metro for Native Component List

- `cd apps/native-component-list`
- `EXPO_SDK_VERSION=UNVERSIONED npx expo start --clear`

Use the Expo Go app that you built in the previous step to scan the QR code and open the Native Component List, or hit `i` or `a` in that window to open it in Expo Go.

## Troubleshooting

- If you see
```
error: ReferenceError: SHA-1 for file /Users/vojta/_dev/expo/react-native-lab/react-native/packages/polyfills/console.js (/Users/vojta/_dev/expo/react-native-lab/react-native/packages/polyfills/console.js) is not computed.
         Potential causes:
           1) You have symlinks in your project - watchman does not follow symlinks.
           2) Check `blockList` in your metro.config.js and make sure it isn't excluding the file path.
```

run `rm -rf ./react-native-lab/react-native/node_modules`

- If you're seeing C++ related errors, run `find . -name ".cxx" -type d -prune -exec rm -rf '{}' +` which clears `.cxx` build artifacts.
- If you get `A valid Firebase Project ID is required to communicate with Firebase server APIs.`, make sure you Metro is running in the `apps/expo-go` directory and run `et android-generate-dynamic-macros`.
- You might need clean the project before building it. Run `./gradlew clean` in the `apps/expo-go/android` directory.
- As a "nuke" option, there's `git submodule foreach --recursive git clean -xfd` which removes all untracked files.
