# expo-firebase-database

`expo-firebase-database` provides a json based cloud data store that is synchronized in real-time.

[**Full documentation**](https://rnfirebase.io/docs/master/database/reference/database)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-database` or `yarn add expo-firebase-database`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseDatabase', path: '../node_modules/expo-firebase-database/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-database'
    project(':expo-firebase-database').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-database/android')
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
    compile project(':expo-firebase-database')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/database/android)

## Usage

```javascript
import React from 'react';
import { Button } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-database';
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
