# expo-firebase-remote-config

`expo-firebase-remote-config` enables you to configure your app based on user segmentation.

[**Full documentation**](https://rnfirebase.io/docs/master/config/reference/config)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-remote-config` or `yarn add expo-firebase-remote-config`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseRemoteConfig', path: '../node_modules/expo-firebase-remote-config/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-remote-config'
    project(':expo-firebase-remote-config').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-remote-config/android')
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
    api project(':expo-firebase-remote-config')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    api project(':expo-firebase-app')
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
    new FirebaseRemoteConfigPackage() // Include this.
  );
}
```

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-remote-config';
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
