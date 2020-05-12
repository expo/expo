# Changelog

## master

### 🛠 Breaking changes

### 🎉 New features

## 0.2.1

### 🐛 Bug fixes

- Added a better error message to the `createManifest` script when project does not have the `hashAssetFiles` plugin configured.

### 🐛 Bug fixes

## 0.2.0

### 🎉 New features

- Added support for the **no-publish workflow**. In this workflow, release builds of both iOS and Android apps will create and embed a new update at build-time from the JS code currently on disk, rather than embedding a copy of the most recently published update. 
  - This means you no longer need to run `expo publish` before creating a release build.
  - The publish workflow is still supported, but it is no longer used by default in new projects, nor is it included in the setup instructions.
  - If you're upgrading from `0.1.x` and would like to use the no-publish workflow, make the following changes to your native projects:
    1. In your Xcode project, open the "Bundle Expo Assets" / "Bundle React Native code and images" build phase and replace the contents with the following:
    ```sh
    export NODE_BINARY=node
    ../node_modules/react-native/scripts/react-native-xcode.sh
    ../node_modules/expo-updates/scripts/create-manifest-ios.sh
    ```
    2. Open the "Start Packager" build phase and remove the following lines, if they exist:
    ```sh
    if [ \"$CONFIGURATION\" == \"Release\" ]; then
      exit 0;
    fi
    ```
    3. Delete the `app.manifest` and `app.bundle` files from your Xcode project.
    4. Delete the `app.manifest` and `app.bundle` files from your `android/app/src/main/assets` directory.
    5. In `android/app/build.gradle`, apply the following diff:
    ```diff
      project.ext.react = [
         entryFile: "index.js",
    -    bundleInRelease: false,
         enableHermes: false
     ]
     apply from: '../../node_modules/react-native-unimodules/gradle.groovy'
     apply from: "../../node_modules/react-native/react.gradle"
    -apply from: "../../node_modules/expo-updates/expo-updates.gradle"
    +apply from: "../../node_modules/expo-updates/scripts/create-manifest-android.gradle"
    ```
    6. Add `metro.config.js` with [these contents](https://github.com/expo/expo/blob/master/templates/expo-template-bare-minimum/metro.config.js) to your project.
- Added `Updates.updateId` and `Updates.releaseChannel` constant exports

### 🐛 Bug fixes

- Fixed an issue with recovering from an unexpectedly deleted asset on iOS.
- Fixed handling of invalid EXPO_UDPATE_URL values on Android.
- Updates Configuration Conditional From Equal To Prefix Check. ([#8225](https://github.com/expo/expo/pull/8225) by [@thorbenprimke](https://github.com/thorbenprimke))

## 0.1.3

### 🐛 Bug fixes

- Fixed some issues with `runtimeVersion` on Android for apps using `expo export`.

## 0.1.2

### 🐛 Bug fixes

- Fixed SSR support on Web. ([#7625](https://github.com/expo/expo/pull/7625) by [@EvanBacon](https://github.com/EvanBacon))

## 0.1.1

### 🐛 Bug fixes

- Fixed 'unable to resolve class GradleVersion' when using Gradle 5. ([#4935](https://github.com/expo/expo/pull/7577) by [@IjzerenHein](https://github.com/IjzerenHein))

## 0.1.0

Initial public beta 🎉
