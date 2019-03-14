# expo-firebase-database

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.

`expo-firebase-database` provides a json based cloud data store that is synchronized in real-time.

[**Full documentation**](https://rnfirebase.io/docs/master/database/reference/database)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-database` or `yarn add expo-firebase-database`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseDatabase', path: '../node_modules/expo-firebase-database/ios'
```

and run `pod install`.

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-database'
    project(':expo-firebase-database').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-database/android')
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
    api project(':expo-firebase-database')
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
    import expo.modules.firebase.database.FirebaseDatabasePackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseDatabasePackage() // Include this.
      );
    }
    ```

## Usage

```javascript
import React from 'react';
import { Button } from 'react-native';
import firebase from 'expo-firebase-app';
// API can be accessed with: firebase.database();

export default class PonyView extends React.Component {
  async componentDidMount() {
    const ref = firebase.database().ref('posts');
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
