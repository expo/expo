---
title: Setup Native Firebase
---

Because the native Firebase SDK requires build-time configuration, you cannot use it with the managed Expo client from the App Store. Luckily there are a few workarounds that we'll cover in this guide.

- **Bare-Workflow (Universal):** You can add any native packages you want, but you cannot currently build a bare-workflow project in the cloud with Expo's build service.
- **Custom-Workflow (iOS Only):** Create a custom Expo client in the cloud and gain access to the few Firebase packages that are in Expo (this does not include react-native-firebase).
- **Managed-Workflow (iOS, and Android):** Build your project for the app store and bundle the Google Services info into your IPA, and APK. You cannot test this method locally on Android.

# Bare-Workflow Setup

- Create a new [**Bare-workflow** project](https://docs.expo.io/versions/v36.0.0/bare/exploring-bare-workflow/)

- If you have not already created a Firebase project for your app, do so now by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).
- In your new project console, create a new native sub-project for iOS and Android.

## Android

- click **Add Firebase to your Android app** and follow the setup steps. **Make sure that the Android package name you enter is the same as the value of `android.package` in your app.json.**
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

# Custom-Workflow Setup

- If you have not already created a Firebase project for your app, do so now by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).
- In your new project console, create a new native sub-project for iOS and Android.

## Android

- click **Add Firebase to your Android app** and follow the setup steps. **Make sure that the Android package name you enter is the same as the value of `android.package` in your app.json.**
- Download the config file by clicking **"Download google-services.json"** and drag the file into your Expo project folder.
- Let the build service know where the file is by defining the relative path in your **`app.json`** with the key `android.googleServicesFile`.
```json5
{
    "expo": {
        "android": {
            "googleServicesFile": "./google-services.json"
        }
    }
}
```
- Now create a new build of your project with `expo build:android`
  
## iOS

- click **Add Firebase to your iOS app** and follow the setup steps. **Make sure that the iOS bundle ID you enter is the same as the value of `ios.bundleIdentifier` in your app.json.**
- Download the services file by clicking **"Download GoogleService-Info.plist"** and drag this file into your Expo project folder.
- Let the build service know where the file is by defining the relative path in your **`app.json`** with the key `ios.googleServicesFile`.
```json5
{
    "expo": {
        "ios": {
            "googleServicesFile": "./GoogleService-Info.plist"
        }
    }
}
```
- Now create a new build of your project with `expo build:ios`


