# expo-firebase-app

`expo-firebase-app` provides the base library for interfacing with native Firebase.

[**Full documentation**](https://rnfirebase.io/docs/master/core/reference/core)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-app` or `yarn add expo-firebase-app`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseApp', path: '../node_modules/expo-firebase-app/ios'
```

and run `pod install`.

#### Android

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
    compile project(':expo-firebase-app')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    ```

## Usage

```javascript
import React from 'react';
import { View, Platform } from 'react-native';
import firebase from 'expo-firebase-app';

export default class BaconUIBlock extends React.Component {
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
