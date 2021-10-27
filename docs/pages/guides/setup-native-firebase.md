---
title: Using the native Firebase SDK
sidebar_title: Native Firebase
---

It's possible to use Firebase through the web SDK, built only in JavaScript, or the native SDK, which is built in native code for iOS and Android. The web SDK only provides access to some Firebase features and the most notable limitation is the lack of support for browser features used in Firebase Analytics or the redirect URI scheme used for phone authentication. If this is important for you, it may make sense to install the native SDK in your app.

## Create Firebase project

If you have not done so already, create a Firebase project for your app by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).

This will guide you through a series of steps to create your own Firebase project.

## Managed Workflow Setup

Some (but not all) native Firebase features can be used with the Managed Workflow. The most notable native feature is Firebase Analytics,
which is otherwise unavailable in react-native using the Firebase JavaScript SDK.

### Android

- Open **Project overview** in the firebase console and click on the Android icon or + button to **Add Firebase to your Android app**.
- **Make sure that the Android package name is the same as the value of `android.package` in your app.json.**
- Register the app & download the config file by clicking **"Download google-services.json"** and drag the file into your Expo project folder.
- Add the relative path to the Android **google-services.json** file to **app.json**.

```json
{
  "expo": {
    "android": {
      "package": "com.mypackage.coolapp",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### iOS

- Open **Project overview** in the Firebase console and click on the iOS icon or + button to **Add Firebase to your iOS app**.
- **Make sure that the iOS bundle ID is the same as the value of `ios.bundleIdentifier` in your app.json.**
- Register the app & download the config file by clicking **"Download GoogleService-Info.plist"** and drag the file into your Expo project folder.
- Add the relative path to the iOS **GoogleService-Info.plist** file to **app.json**.

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.mypackage.coolapp",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

### Web

- Open **Project overview** in the Firebase console and click on the Web icon or + button to **Add Firebase to your Web app**.
- Register the app & copy the config into your **app.json** under the key `web.config.firebase`.

```json
{
  "expo": {
    "web": {
      "config": {
        "firebase": {
          "appId": "xxxxxxxxxxxxx:web:xxxxxxxxxxxxxxxx",
          "apiKey": "AIzaXXXXXXXX-xxxxxxxxxxxxxxxxxxx",
          "projectId": "my-awesome-project-id",
          ...
          "measurementId": "G-XXXXXXXXXXXX"
        }
      }
    }
  }
}
```

## Bare Workflow Setup

In the bare workflow, the firebase configuration needs to be added according to the native Firebase SDK installation guides
for [iOS](https://firebase.google.com/docs/ios/setup) and [Android](https://firebase.google.com/docs/android/setup).
Below you will find a tailored instruction for use with react-native and the Expo Bare Workflow.

You are free to use any native Firebase packages such as [react-native-firebase](https://rnfirebase.io/) in the bare workflow.

### Android

- Open **Project overview** in the Firebase console and click on the Android icon or + button to **Add Firebase to your Android app**.
- **Make sure that the Android package name is the same as the value of `applicationId` in your `android/app/build.gradle`.**
- Register the app & download the config file by clicking **"Download google-services.json"** to this location `/android/app/google-services.json`.
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
- Finally rebuild your native Android app: `expo run:android`

### iOS

- Open **Project overview** in the Firebase console and click on the iOS icon or + button to **Add Firebase to your iOS app**.
- **Make sure that the iOS bundle ID is the same as the value of `Bundle Identifier` of your iOS project.**
- Register the app & download the config file by clicking **"Download GoogleService-Info.plist"**.
- Open your Expo iOS project in Xcode `ios/{projectName}.xcworkspace` and then drag the services file into your project. If you don't see the `.xcworkspace` workspace file, run `npx pod-install` to create it.

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
- Rebuild your iOS project to see the changes: `expo run:ios`

### Usage with react-native-firebase

After following the iOS and Android setup, you can optionally configure your project to work with `react-native-firebase` version 6 as well.

- Install the `react-native-firebase` packages (e.g. `yarn add @react-native-firebase/app @react-native-firebase/auth etc..`)
- Install the pods on iOS

Continue further on the [react-native-firebase](https://rnfirebase.io/) website.
