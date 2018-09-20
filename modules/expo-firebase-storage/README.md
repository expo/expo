# expo-firebase-storage

`expo-firebase-storage` provides a json based cloud data store that is synchronized in real-time.

[**Full documentation**](https://rnfirebase.io/docs/master/storage/reference/storage)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-storage` or `yarn add expo-firebase-storage`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseStorage', path: '../node_modules/expo-firebase-storage/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-storage'
    project(':expo-firebase-storage').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-storage/android')
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
    api project(':expo-firebase-storage')
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
    new FirebaseStoragePackage() // Include this.
  );
}
```

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-storage';
// API can be accessed with: firebase.storage();

export default class WishboneView extends React.Component {
  async componentDidMount() {
    const ref = firebase.storage().ref('posts');
    ref.on('value', snapshot => {
      const val = snapshot.val();
      console.log(val);
    });
  }

  render() {
    return <View />;
  }
}
```
