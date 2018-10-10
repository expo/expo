# expo-firebase-messaging

`expo-firebase-messaging` enables cloud messaging (FCM) in your app.

[**Full documentation**](https://rnfirebase.io/docs/master/messaging/introduction)

## Installation

First, you need to install the package from `npm` registry.

`npm install expo-firebase-messaging` or `yarn add expo-firebase-messaging`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseMessaging', path: '../node_modules/expo-firebase-messaging/ios'
```

and run `pod install`.

1. [**Setup Certificates**](https://rnfirebase.io/docs/master/messaging/ios#Setup-Certificates)
2. [**Enable Capabilities**](https://rnfirebase.io/docs/master/messaging/ios#Enable-Capabilities)

You can reliably produce a `.p12` file with fastlane. 

1. In `ios/` run `fastlane produce` - This will create an entry in the App Store. This method can cut down on reserved bundle ID errors.
2. While still in `ios/` run `fastlane pem` - This will generate the `.p12` file and provide you with a local path to the file.
3. You should see something like this - copy the middle file to your Firebase project's settings. You can use it as a development key if needed.
```sh
Private key: /Users/you/Documents/yourapp/ios/production_com.company.yourapp.pkey
p12 certificate: /Users/you/Documents/yourapp/ios/production_com.company.yourapp.p12
PEM: /Users/you/Documents/yourapp/ios/production_com.company.yourapp.pem
```

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-messaging'
    project(':expo-firebase-messaging').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-messaging/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-messaging')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    api project(':expo-firebase-app')
    ```
3.  Update the manifest (`android/app/src/main/AndroidManifest.xml`):
      ```xml
      <service android:name="expo.modules.firebase.messaging.EXFirebaseMessagingService">
          <intent-filter>
              <action android:name="com.google.firebase.MESSAGING_EVENT" />
          </intent-filter>
      </service>
      <service android:name="expo.modules.firebase.messaging.EXFirebaseInstanceIdService">
          <intent-filter>
              <action android:name="com.google.firebase.INSTANCE_ID_EVENT"/>
          </intent-filter>
      </service>
      <!--Inlcude this for Background Messages-->
      <service android:name="expo.modules.firebase.messaging.FirebaseBackgroundMessagingService" />
      ```

Some Unimodules are not included in the default `ExpoKit` suite, these modules will needed to be added manually.
If your Android build cannot find the Native Modules, you can add them like this:

`./android/app/src/main/java/host/exp/exponent/MainActivity.java`
```java
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

// Include the module before using it.
import 'expo-firebase-instance-id';
import 'expo-firebase-messaging';
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
