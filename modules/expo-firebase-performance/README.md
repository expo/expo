# expo-firebase-performance

`expo-firebase-performance` captures a number of traces automatically, such as all outbound HTTP requests, app boot time and more.

[**Full documentation**](https://rnfirebase.io/docs/master/perf-mon/reference/perf-mon)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-performance` or `yarn add expo-firebase-performance`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebasePerformance', path: '../node_modules/expo-firebase-performance/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-performance'
    project(':expo-firebase-performance').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-performance/android')
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
    compile project(':expo-firebase-performance')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/perf-mon/android)

## Usage

```javascript
import React from 'react';
import { Button } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-performance';
// API can be accessed with: firebase.perf();

export default class DemoView extends React.Component {
  constructor() {
    super();
    this.endpoint = 'https://example.com/data.json';
    this.trace = null;
  }

  async componentDidMount() {
    // Define & start trace
    this.trace = firebase.perf().newTrace('cache_trace');
    await this.trace.start();

    // Set initial attributes
    await this.trace.putAttribute('user_id', firebase.auth().currentUser.uid);
    await this.trace.putAttribute('endpoint', this.endpoint);
    await this.trace.putMetric('requests', 0);
  }

  async componentWillUnmount() {
    await this.trace.stop();
  }

  _onPress = async () => {
    const response = await fetch(this.endpoint);
    const json = await response.json();

    // Increment the requests metric by 1
    await this.trace.incrementMetric('requests', 1);

    // Increment a metric based on whether the payload was cached
    if (json.cached) await this.trace.incrementMetric('requests_cached', 1);
    else await this.trace.incrementMetric('requests_not_cached', 1);
  };

  render() {
    return <Button title="Press to get data" onPress={this._onPress} />;
  }
}
```
