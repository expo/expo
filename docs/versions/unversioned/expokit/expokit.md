---
title: Developing With ExpoKit
---

ExpoKit is an Objective-C and Java library that allows you to use the Expo platform with a
native iOS/Android project.

## Before you read this guide

To create an ExpoKit project:

1.  Create a pure-JS project with Expo CLI (also projects that were created with exp, XDE or create-react-native-app will work)
2.  Then use [`expo eject`](eject.html) to add ExpoKit (choose the "ExpoKit" option).

Make sure to perform these steps before continuing in this guide. The remainder of the guide will assume you have created an ExpoKit project.

## Setting up your project

By this point you should have a JS app which additionally contains `ios` and `android` directories.

### 1. Check JS dependencies

- Your project's `package.json` should contain a `react-native` dependency pointing at Expo's fork of React Native. This should already be configured for you.
- Your JS dependencies should already be installed (via `npm install` or `yarn`).

### 2. Run the project with Expo CLI

Run `expo start` from the project directory.

This step ensures that the React Native packager is running and serving your app's JS bundle for development. Leave this running and continue with the following steps.

### 3. iOS: Configure, build and run

This step ensures the native iOS project is correctly configured and ready for development.

- Make sure you have the latest Xcode.
- If you don't have it already, install [CocoaPods](https://cocoapods.org), which is a native dependency manager for iOS.
- Run `pod install` from your project's `ios` directory.
- Open your project's `xcworkspace` file in Xcode.
- Use Xcode to build, install and run the project on your test device or simulator. (this will happen by default if you click the big "Play" button in Xcode.)

Once it's running, the iOS app should automatically request your JS bundle from the project you're serving from Expo CLI.

### 4. Android: Build and run

Open the `android` directory in Android Studio, then build and run the project on an Android device or emulator.

When opening the project, Android Studio may prompt you to upgrade the version of Gradle or other build tools, but don't do this as you may get unexpected results. ExpoKit always ships with the latest supported versions of all build tools.

If you prefer to use the command line, you can run `./run.sh` from inside the `android` directory to build the project and install it on the running device/emulator.

Once the Android project is running, it should automatically request your development url from Expo CLI. You can develop your project normally from here.

## Continuing with development

Every time you want to develop, ensure your project's JS is being served by Expo CLI (step 2), then run the native code from Xcode or Android Studio respectively.

Your ExpoKit project is configured to load your app's published url when you build it for release. So when you want to release it, don't forget to publish, like with any normal (non-ExpoKit) project.

## Changing Native Dependencies

### iOS

Your ExpoKit project manages its dependencies with [CocoaPods](https://cocoapods.org).

Many libraries in the React Native ecosystem include instructions to run `react-native link`. These are supported with ExpoKit for iOS.

- If the library supports CocoaPods (has a .podspec file), just follow the normal instructions and run `react-native link`.
- If the library doesn't support CocoaPods, `react-native link` may fail to include the library's header files. If you encounter build issues locating the `<React/*>` headers, you may need to manually add `Pods/Headers/Public` to the **Header Search Paths** configuration for your native dependency in Xcode. If you're not familiar with Xcode, search Xcode help for "configure build settings" to get an idea of how those work. **Header Search Paths** is one such build setting. The target you care to configure is the one created by `react-native link` inside your Xcode project. You'll want to determine the relative path from your library to `Pods/Headers/Public`.

### Android

Many libraries in the React Native ecosystem include instructions to run `react-native link`. These are supported with ExpoKit for Android.

## Upgrading ExpoKit

ExpoKit's release cycle follows the Expo SDK release cycle. When a new version of the Expo SDK comes out, the release notes include upgrade instructions for the normal, JS-only part of your project. Additionally, you'll need to update the native ExpoKit code.

> **Note:** Please make sure you've already updated your JS dependencies before proceeding with the following instructions. Additionally, there may be version-specific breaking changes not covered here.

### iOS

- Open up `ios/Podfile` in your project, and update the `ExpoKit` tag to point at the [release](https://github.com/expo/expo/releases) corresponding to your SDK version. Run `pod update` then `pod install`.
- Open `ios/your-project/Supporting/EXSDKVersions.plist` in your project and change all the values to the new SDK version.

If upgrading from SDK 30 or below, you'll also need to change `platform :ios, '9.0'` to `platform :ios, '10.0'` in `ios/Podfile`.

### Android

- Go to https://expo.io/--/api/v2/versions and find the `expokitNpmPackage` key under `sdkVersions.[NEW SDK VERSION]`.
- Update your version of expokit in `package.json` to the version in `expokitNpmPackage` and yarn/npm install.
- Go to `MainActivity.java` and replace `Arrays.asList("[OLD SDK VERSION]")` with `Arrays.asList("[NEW SDK VERSION]")`.
- Go to `android/app/build.gradle` and replace `compile('host.exp.exponent:expoview:[OLD SDK VERSION]@aar') {` with `compile('host.exp.exponent:expoview:[NEW SDK VERSION]@aar') {`.

If upgrading from SDK 28 or below, you'll also need to follow these instructions:

- Change all instances of `android\\detach-scripts` and `android/detach-scripts` to `node_modules\\expokit\\detach-scripts` and `node_modules/expokit/detach-scripts` respectively in `android/app/expo.gradle`.
- Add `maven { url "$rootDir/../node_modules/expokit/maven" }` under `allprojects.repositories` in `android/build.gradle`.
- In `android/app/build.gradle`, replace
```groovy
compile('host.exp.exponent:expoview:[SDK VERSION]@aar') {
  transitive = true
}
```
with
```groovy
compile('host.exp.exponent:expoview:[SDK VERSION]@aar') {
  transitive = true
  exclude group: 'com.squareup.okhttp3', module: 'okhttp'
  exclude group: 'com.squareup.okhttp3', module: 'okhttp-urlconnection'
}
```
