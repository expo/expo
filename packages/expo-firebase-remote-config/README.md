# expo-firebase-remote-config

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.

`expo-firebase-remote-config` enables you to configure your app based on user segmentation.

[**Full documentation**](https://rnfirebase.io/docs/master/config/reference/config)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-remote-config` or `yarn add expo-firebase-remote-config`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseRemoteConfig', path: '../node_modules/expo-firebase-remote-config/ios'
```

and run `pod install`.

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-remote-config'
    project(':expo-firebase-remote-config').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-remote-config/android')
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
    api project(':expo-firebase-remote-config')
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
    import expo.modules.firebase.remoteconfig.FirebaseRemoteConfigPackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseRemoteConfigPackage() // Include this.
      );
    }
    ```

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';

// API can be accessed with: firebase.config();

export default class DemoView extends React.Component {
  async componentDidMount() {
    if (__DEV__) {
      firebase.config().enableDeveloperMode();
    }

    // Set default values
    firebase.config().setDefaults({
      hasExperimentalFeature: false,
    });

    await firebase.config().fetch();
    const activated = await firebase.config().activateFetched();
    if (!activated) console.log('Fetched data not activated');
    const snapshot = await firebase.config().getValue('hasExperimentalFeature');
    const hasExperimentalFeature = snapshot.val();
    if (hasExperimentalFeature) {
      this.enableSuperCoolFeature();
    }
  }

  enableSuperCoolFeature = () => {};

  render() {
    return <View />;
  }
}
```
