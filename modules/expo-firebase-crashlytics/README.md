# expo-firebase-crashlytics

`expo-firebase-crashlytics` allows you to monitor native and non-fatal crashes.

[**Full documentation**](https://rnfirebase.io/docs/master/crashlytics/reference/crashlytics)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-crashlytics` or `yarn add expo-firebase-crashlytics`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseCrashlytics', path: '../node_modules/expo-firebase-crashlytics/ios'
```

and run `pod install`.

Finally add the [**crashlytics build script**](https://rnfirebase.io/docs/master/crashlytics/ios#Add-the-Crashlytics-run-script)

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-crashlytics'
    project(':expo-firebase-crashlytics').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-crashlytics/android')
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
    compile project(':expo-firebase-crashlytics')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Now include the package in React Native.](https://rnfirebase.io/docs/master/crashlytics/android#Install-the-RNFirebase-Crashlytics-package)

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-crashlytics';
// API can be accessed with: firebase.crashlytics();

export default class DemoView extends React.Component {
  async componentDidMount() {
    // Native crash the app to test.
    firebase.crashlytics().crash();

    try {
      await someAsyncTask();
    } catch ({ message, code }) {
      // Put this in all your try/catch's to log them.
      firebase.crashlytics().recordError(code, message);
    }
  }

  render() {
    return <View />;
  }
}
```
