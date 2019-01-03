# expo-firebase-app

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.


`expo-firebase-app` provides the base library for interfacing with native Firebase.

[**Full documentation**](https://rnfirebase.io/docs/master/core/reference/core)

Based on **RNFirebase** by Invertase at [invertase/react-native-firebase](https://github.com/invertase/react-native-firebase). View the [full react-native-firebase documentation](https://rnfirebase.io/docs/v4.3.x/getting-started)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-app` or `yarn add expo-firebase-app`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseApp', path: '../node_modules/expo-firebase-app/ios'
```

and run `pod install`.

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-app')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    ```
3.  Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

    ```java
    /*
    * At the top of the file.
    * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
    */
    import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage() // Include this.
      );
    }
    ```

## Getting Started

Expo Firebase is very similar to the Firebase Web SDK.

- Head over to [the Firebase Console](https://console.firebase.google.com/u/0/)
- Create a new application
- Create an iOS app
  - If you are testing your app in Expo, you will need to use `host.exp.Exponent` as the Bundle ID
  - Download the `GoogleServices-Info.plist`
  - You can skip the rest of the default setup instructions in the console.
  - Convert the `.plist` to a `JSON`, you can use a CLI like `plist-to-json`
  - Run `npm install -g plist-to-json` to install this tool
  - Now convert the file `plist-to-json GoogleService-Info.plist`
  - You can now initialize the app using `firebase.initializeApp( <json> )` with the JSON you just created.
- Create an Android app
  - If you are testing your app in Expo, you will need to use `host.exp.Exponent` as the Package.
  - Download the `google-services.json`
  - Initialize the app using `firebase.initializeApp( <json> )` with the JSON you just downloaded.
- To use the proper JSON you can use `ReactNative.Platform` API. `Platform.select({ ios: <json>, android: <json> })`

That's all! 💙

### Caveats

Google Sign-In will crash automatically if used in the client, as it now requires the `REVERSE_CLIENT_ID` to be located in the `info.plist`

When using a native Firebase app in a dynamic way, you will need to consider that `offline persistence`, and `Auth Tokens` may not behave as expected.

Offline persistence will store data relative to the Firebase app. If you were to change the app in reload then this can corrupt or erase the data.

If you create an Auth Token in a native firebase app, then reload with a different firebase app the Auth Token will be invalidated. This is the intended behavior but it is less likely to occur in a native app as you would normally embed the application credentials into the build.

## Usage

```javascript
import React from 'react';
import { View, Platform } from 'react-native';
import firebase from 'expo-firebase-app';
import Constants from 'expo-constants';

export default class ExampleView extends React.Component {
  async componentDidMount() {
    // ... initialize firebase app
    await firebase.initializeApp(
      Platform.select({
        ios: {
          // Native config or plist data as json
        },
        android: {},
      })
    );
  }
  render() {
    return <View />;
  }
}
```

## Development

The async firebase setup allows for quick and easy debug without detaching, but it is recommended that you use the native initialization when releasing a production build.

This involves adding a `google-services.json` file to your Android build, and adding the `GoogleService-Info.plist` to your iOS project.

You cannot change your Firebase project's Bundle ID or Package ID, this means that you will need a Production and Development Firebase "app". Each app can access all the same data in the database, so you won't have to recreate any of your project settings, auth, database, ect...

## Modules

All the firebase modules can be used outside of Expo by installing any of the following modules:

- [App/Core](https://www.npmjs.com/package/expo-firebase-app)
- [Analytics](https://www.npmjs.com/package/expo-firebase-analytics)
- [Authentication](https://www.npmjs.com/package/expo-firebase-auth)
- [Cloud Firestore](https://www.npmjs.com/package/expo-firebase-firestore)
- [Cloud Functions](https://www.npmjs.com/package/expo-firebase-functions)
- [Instance ID](https://www.npmjs.com/package/expo-firebase-instance-id)
- [Performance Monitor](https://www.npmjs.com/package/expo-firebase-performance)
- [Realtime Database](https://www.npmjs.com/package/expo-firebase-database)
- [Cloud Storage](https://www.npmjs.com/package/expo-firebase-storage)
- [Remote Config](https://www.npmjs.com/package/expo-firebase-remote-config)
- [Firebase Cloud Messaging](https://www.npmjs.com/package/expo-firebase-messaging)
- [Remote Notifications](https://www.npmjs.com/package/expo-firebase-notifications)
- [Dynamic Linking](https://www.npmjs.com/package/expo-firebase-links)
- [Invites](https://www.npmjs.com/package/expo-firebase-invites)
- [Crashlytics](https://www.npmjs.com/package/expo-firebase-crashlytics)

## Future Development

Eventually we want most of these features to run in Expo by default. Currently they must be installed in a detached, or vanilla React Native project as we work out the bugs.
