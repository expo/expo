# expo-firebase-instance-id

`expo-firebase-instance-id` provides access to the instance ID, and Push Token.

[**Full documentation**](https://rnfirebase.io/docs/master/iid/reference/iid)

## Installation

First, you need to install the package from `npm` registry.

`npm install expo-firebase-instance-id` or `yarn add expo-firebase-instance-id`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseInstanceID', path: '../node_modules/expo-firebase-instance-id/ios'
```

and run `pod install`.

#### Manually

You could also choose install this module manually.

1.  In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2.  Go to `node_modules` ➜ `expo-firebase-instance-id` and add `EXFirebaseInstanceID.xcodeproj`
3.  In XCode, in the project navigator, select your project. Add `libEXFirebaseInstanceID.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4.  Run your project (`Cmd+R`).

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-instance-id'
    project(':expo-firebase-instance-id').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-instance-id/android')
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
    api project(':expo-firebase-instance-id')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    api project(':expo-firebase-app')
    ```
3.  Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

    ```java
    /*
    * At the top of the file.
    * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
    */
    import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.
    import expo.modules.firebase.instanceid.FirebaseInstanceIDPackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseInstanceIDPackage() // Include this.
      );
    }
    ```

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-instance-id';
// API can be accessed with: firebase.iid();

export default class DemoView extends React.Component {
  async componentDidMount() {
    // ... initialize firebase app

    const token = await firebase.iid().getToken();
  }
  render() {
    return <View />;
  }
}
```
