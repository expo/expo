# expo-firebase-functions

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.

`expo-firebase-functions`

[**Full documentation**](https://rnfirebase.io/docs/master/functions/reference/functions)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-functions` or `yarn add expo-firebase-functions`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseFunctions', path: '../node_modules/expo-firebase-functions/ios'
```

and run `pod install`.

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-functions'
    project(':expo-firebase-functions').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-functions/android')
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
    api project(':expo-firebase-functions')
    ```
    and if not already included
    ```gradle
    api project(':unimodules-core')
    api project(':expo-firebase-app')
    ```
3.  Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

    ```java
    /*
    * At the top of the file.
    * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
    */
    import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.
    import expo.modules.firebase.functions.FirebaseFunctionsPackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseFunctionsPackage() // Include this.
      );
    }
    ```

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';

// API can be accessed with: firebase.functions();

export default class DemoView extends React.Component {
  async componentDidMount() {
    // ... initialize firebase app

    const httpsCallable = firebase.functions().httpsCallable('myFooBarFn');

    try {
      const { data } = await httpsCallable({ some: 'args' });
      console.log(data.someResponse); // hello world
    } catch ({ code, message, details }) {
      console.log(code); // invalid-argument
      console.log(message); // Your error message goes here
      console.log(details.foo); // bar
    }
  }
  render() {
    return <View />;
  }
}
```
