---
title: Using the native Firebase SDK
sidebar_title: Using Native Firebase
---

React Native supports both the Firebase JavaScript SDK, and the native iOS and Android SDKs. The JavaScript SDK only provides access to some Firebase features and the most notable limitation is the lack of support for browser features used in Firebase Analytics or the redirect URI scheme used for phone authentication. If this is important for you, it may make sense to install the native SDK in your app.

## Create Firebase project

If you have not done so already, create a Firebase project for your app by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).

This will guide you through a series of steps to create your own Firebase project.

## Setup

Follow the official [React Native Firebase documentation](https://rnfirebase.io/#expo) to get started with native Firebase packages in [development builds](/development/introduction).

## Manual setup

The firebase configuration needs to be added according to the native Firebase SDK installation guides
for [iOS](https://firebase.google.com/docs/ios/setup) and [Android](https://firebase.google.com/docs/android/setup).
Below you will find a tailored instruction for use with React Native.

You are free to use any native Firebase packages such as [`react-native-firebase`](https://rnfirebase.io/) in bare React Native apps.

### Android

- Open **Project overview** in the Firebase console and click on the Android icon or + button to **Add Firebase to your Android app**.
- **Make sure that the Android package name is the same as the value of `applicationId` in your `android/app/build.gradle`.**
- Register the app & download the config file by clicking **Download google-services.json** to this location `/android/app/google-services.json`.
- Import the `google-services` plugin inside of your `android/build.gradle` file:
  ```groovy
  buildscript {
      dependencies {
          classpath 'com.google.gms:google-services:4.3.5'
      }
  }
  ```
- Apply the plugin by adding this line to the bottom of the `android/app/build.gradle` file:
  ```groovy
  apply plugin: 'com.google.gms.google-services'
  ```
- Finally rebuild your native Android app: `npx expo run:android`

### iOS

- Open **Project overview** in the Firebase console and click on the iOS icon or + button to **Add Firebase to your iOS app**.
- **Make sure that the iOS bundle ID is the same as the value of `Bundle Identifier` of your iOS project.**
- Register the app & download the config file by clicking **Download GoogleService-Info.plist**.
- Open your iOS project in Xcode `ios/{projectName}.xcworkspace` and then drag the services file into your project. If you don't see the `.xcworkspace` workspace file, run `npx pod-install` to create it.

  - Be sure to enable **'Copy items if needed'**.

- Initialize the default Firebase app by opening the AppDelegate file in your project.
  - If you're using Expo SDK 45 or later, add the following to the top of the `ios/{projectName}/AppDelegate.mm` file:
    ```objc
    #import <Firebase/Firebase.h>
    ```
  - For versions prior to Expo SDK 45, add the following to the top of `ios/{projectName}/AppDelegate.m` file:
    ```objc
    @import Firebase;
    ```
    Note that following the upgrade to Expo SDK 45, your AppDelegate file will have the `.mm` extension as opposed to the `.m` extension.
- At the top of the `didFinishLaunchingWithOptions` method:
  ```objc
  - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
      [FIRApp configure];
  ```
- Rebuild your iOS project to see the changes: `npx expo run:ios`

### Usage with react-native-firebase

After following the iOS and Android setup, you can optionally configure your project to work with `react-native-firebase` version 6 as well.

- Install the `react-native-firebase` packages (e.g. `yarn add @react-native-firebase/app @react-native-firebase/auth` etc..)
- Rebuild with `npx expo run:ios` or `npx expo run:android`

Continue further on the [react-native-firebase](https://rnfirebase.io/#installation) website.
