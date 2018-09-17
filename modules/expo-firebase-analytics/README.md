# expo-firebase-analytics

`expo-firebase-analytics`

[**Full documentation**](https://rnfirebase.io/docs/master/analytics/reference/analytics)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-analytics` or `yarn add expo-firebase-analytics`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseAnalytics', path: '../node_modules/expo-firebase-analytics/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-analytics'
    project(':expo-firebase-analytics').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-analytics/android')
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
    compile project(':expo-firebase-analytics')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/analytics/android)

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-analytics';
// API can be accessed with: firebase.analytics();

export default class DemoView extends React.Component {
  async componentDidMount() {
    firebase.analytics().logEvent('component_mounted', { foo: 'bar' });
  }

  render() {
    return <View />;
  }
}
```
