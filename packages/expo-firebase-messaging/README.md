# expo-firebase-messaging

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.

`expo-firebase-messaging` enables cloud messaging (FCM) in your app.

[**Full documentation**](https://rnfirebase.io/docs/master/messaging/introduction)

## Installation

First, you need to install the package from `npm` registry.

`npm install expo-firebase-messaging` or `yarn add expo-firebase-messaging`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseMessaging', path: '../node_modules/expo-firebase-messaging/ios'
```

and run `pod install`.

#### Common Setup

[**Enable Capabilities in XCode**](https://rnfirebase.io/docs/master/messaging/ios#Enable-Capabilities)

**Upload certs to Firebase**

You can reliably produce a `.p12` file with fastlane.

1. In `ios/` run `fastlane produce` - This will create an entry in the App Store. This method can cut down on reserved bundle ID errors.
2. While still in `ios/` run `fastlane pem` - This will generate the `.p12` file and provide you with a local path to the file.
3. You should see something like this - copy the middle file to your Firebase project's settings. You can use it as a development key if needed.

```sh
Private key: /Users/you/Documents/yourapp/ios/production_com.company.yourapp.pkey
p12 certificate: /Users/you/Documents/yourapp/ios/production_com.company.yourapp.p12
PEM: /Users/you/Documents/yourapp/ios/production_com.company.yourapp.pem
```

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-messaging'
    project(':expo-firebase-messaging').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-messaging/android')
    ```

    and if not already included

    ```gradle
    include ':unimodules-core'
    project(':unimodules-core').projectDir = new File(rootProject.projectDir, '../node_modules/@unimodules/core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-messaging')
    ```
    and if not already included
    ```gradle
    api project(':unimodules-core')
    api project(':expo-firebase-app')
    ```
3.  Update the manifest (`android/app/src/main/AndroidManifest.xml`):
    ```xml
    <service android:name="expo.modules.firebase.messaging.EXFirebaseMessagingService">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
    <!--Inlcude this for Background Messages-->
    <service android:name="expo.modules.firebase.messaging.FirebaseBackgroundMessagingService" />
    ```
4.  Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

    ```java
    /*
    * At the top of the file.
    * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
    */
    import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.
    import expo.modules.firebase.messaging.FirebaseMessagingPackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseMessagingPackage() // Include this.
      );
    }
    ```

## Usage

```javascript
import React from 'react';
import { Text, View } from 'react-native';
import firebase from 'expo-firebase-app';
import { Permissions } from 'expo-permissions';

import type { RemoteMessage } from 'expo-firebase-messaging';

// API can be accessed with: firebase.messaging();

export default class DemoView extends React.Component {
  state = { user: null };

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    if (status !== 'granted') return;

    this.messageListener = firebase.messaging().onMessage((message: RemoteMessage) => {
      // Process your message as required
    });

    // Get device push token
    const token = await firebase.iid().getToken();
  }

  componentWillUnmount() {
    // Clean up: remove the listener
    this.messageListener();
  }

  render() {
    return <View />;
  }
}
```

You can test sending messagings to your app by executing the following command in a terminal:
```sh
curl -X POST --header "Authorization: key=FIREBASE_SERVER_KEY" --Header "Content-Type: application/json" https://fcm.googleapis.com/fcm/send -d "{\"to\":\"DEVICE_TOKEN_ID\",\"message\":{\"body\":\"Test\"}}"
```

Just be sure to populate the command with your firebase server key and the device token ID from `firebase.iid().getToken()`


### [Listen for FCM messages in the background](https://rnfirebase.io/docs/v5.x.x/messaging/receiving-messages#4)-(Optional)(Android-only)-Listen-for-FCM-messages-in-the-background)

Android allows you to act on data-only messages when your application is closed or running in the background. This is particularly useful if you'd like to be able to show heads-up notifications to your user.

1.  Ensure your manifest has the following service registered (`android/app/src/main/AndroidManifest.xml`):
    ```xml
    <!--Inlcude this for Background Messages-->
    <service android:name="expo.modules.firebase.messaging.FirebaseBackgroundMessagingService" />
    ```
2.  Create a task handler

    ```js
    // @flow
    import firebase from 'expo-firebase-app';
    // Optional flow type
    import type { RemoteMessage } from 'expo-firebase-messaging';

    export default async (message: RemoteMessage) => {
      // handle your message

      return Promise.resolve();
    };
    ```

    > This handler method must return a promise and resolve within 60 seconds.

3.  Register the background handler in your Expo app (`App.js`)

    ```js
    import { AppRegistry } from 'react-native';
    import messageTask from './messageTask';

    AppRegistry.registerHeadlessTask('FirebaseBackgroundMessage', () => messageTask);
    ```

    > The name **`"FirebaseBackgroundMessage"`** is very important.
