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
    compile project(':expo-firebase-messaging')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Update the manifest](https://rnfirebase.io/docs/master/messaging/android#Update-Android-Manifest)

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
