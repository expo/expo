# expo-firebase-functions

`expo-firebase-functions`

[**Full documentation**](https://rnfirebase.io/docs/master/functions/reference/functions)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-functions` or `yarn add expo-firebase-functions`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseFunctions', path: '../node_modules/expo-firebase-functions/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-functions'
    project(':expo-firebase-functions').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-functions/android')
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
    compile project(':expo-firebase-functions')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/functions/android)

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-functions';
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
