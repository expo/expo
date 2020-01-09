---
title: Using the native Firebase SDK
sidebar_title: Native Firebase
---

It's possible to use Firebase through the web SDK, built only in JavaScript, or the native SDK, which is built in native code for iOS and Android. The web SDK only provides access to some Firebase features and the most notable limitation is the lack of support for Firebase Analytics. If this is important for you, it may make sense to install the native SDK in your app. Using the bare workflow it is fairly straightforward to install the native Firebase SDK, but it's a bit trickier in the managed workflow currently.

The native Firebase SDK requires build-time configuration (app-specific strings that must be present when the Expo client app is compiled) and consequently you cannot use it with the Expo client available on the App Store. It's possible to work around this using [../../guides/adhoc-builds](a custom iOS client), and that will be explained in this guide. There is no workaround available yet for the Android Expo client, but it is possible to use the native Firebase SDK for Android standalone apps.

# Bare Workflow Setup

You can add any native packages you want (including the full native Firebase SDK), but you cannot currently build a bare workflow project in the cloud with Expo's build service.

- Create a new [**bare workflow** project](../../bare/exploring-bare-workflow/)
- If you have not already created a Firebase project for your app, do so now by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).
- In your new project console, create a new native sub-project for iOS and Android.

## Android

- click **Add Firebase to your Android app** and follow the setup steps. **Make sure that the Android package name you enter is the same as the value of the `applicationId` in your `android/app/build.gradle `.**
- Download the config file by clicking **"Download google-services.json"** move this file to your Expo project at this location `/android/app/google-services.json`.
- Back in the firebase console, you can skip the step **"Add Firebase SDK"**.

- Import the `google-services` plugin inside of your `android/build.gradle` file:
  ```groovy
  buildscript {
      dependencies {
          classpath 'com.google.gms:google-services:4.2.0'
      }
  }
  ```
- Apply the plugin by adding this line to the bottom of the `android/app/build.gradle` file:
  ```groovy
  apply plugin: 'com.google.gms.google-services'
  ```
- Finally rebuild your native Android app: `yarn react-native run-android`

## iOS

- click **Add Firebase to your iOS app** and follow the setup steps. **Make sure that the iOS bundle ID you enter is the same as the value of `ios.bundleIdentifier` in your app.json.**
- Download the services file by clicking **"Download GoogleService-Info.plist"**
- Open your Expo iOS project in Xcode `ios/{projectName}.xcworkspace` and then drag the services file into your project

  - Be sure to enable **'Copy items if needed'**.

- Initialize the default Firebase app by opening the AppDelegate file in your project `ios/{projectName}/AppDelegate.m`.
- At the top of the file:
  ```objc
  @import Firebase;
  ```
- At the top of the `didFinishLaunchingWithOptions` method:
  ```objc
  - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
      [FIRApp configure];
  ```
- Rebuild your iOS project to see the changes: `yarn react-native run-ios`

### Usage with react-native-firebase

After following the iOS and Android setup, you can optionally configure your project to work with react-native-firebase as well.

- Ensure your `ios/Podfile` has the following lines:

  ```rb
  # At the top of the file
  require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'
  require_relative '../node_modules/react-native-unimodules/cocoapods'

  # ...

  # Automatically detect installed unimodules
  use_unimodules!

  # The community version of use_unimodules (used for react-native-firebase)
  use_native_modules!
  ```

- Install the packages `yarn add @react-native-firebase/app`
- Re-install the Cocoapods in your iOS project then rebuild both native projects.

# Managed Workflow Setup

Build your project for the App Store and Play Store and bundle the Google Services info into your application binaries (this does not include support for `react-native-firebase`). Test in development using a custom Expo client on iOS, you cannot test this module locally on Android.

- If you have not already created a Firebase project for your app, do so now by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).
- In your new project console, create a new native sub-project for iOS and Android.

## Android

- click **Add Firebase to your Android app** and follow the setup steps. **Make sure that the Android package name you enter is the same as the value of `android.package` in your app.json.**
- Download the config file by clicking **"Download google-services.json"** and drag the file into your Expo project folder.
- Let the build service know where the file is by defining the relative path in your **`app.json`** with the key `android.googleServicesFile`.

```json5
{
  expo: {
    android: {
      googleServicesFile: './google-services.json',
    },
  },
}
```

- Now create a new build of your project with `expo build:android`

## iOS

- click **Add Firebase to your iOS app** and follow the setup steps. **Make sure that the iOS bundle ID you enter is the same as the value of `ios.bundleIdentifier` in your app.json.**
- Download the services file by clicking **"Download GoogleService-Info.plist"** and drag this file into your Expo project folder.
- Let the build service know where the file is by defining the relative path in your **`app.json`** with the key `ios.googleServicesFile`.

```json5
{
  expo: {
    ios: {
      googleServicesFile: './GoogleService-Info.plist',
    },
  },
}
```

- Now create a new build of your project with `expo build:ios`
