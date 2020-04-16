---
title: Pedometer
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-37/packages/expo-sensors'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

`Pedometer` from **`expo-sensors`** uses Core Motion on iOS and the system `hardware.Sensor` on Android to get the user's step count, and also allows you to subscribe to pedometer updates.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-sensors" />

## Usage

<SnackInline label='Pedometer' dependencies={['expo-sensors']} >

```js
import React from 'react';
import { Pedometer } from 'expo-sensors';
import { StyleSheet, Text, View } from 'react-native';

export default class App extends React.Component {
  state = {
    isPedometerAvailable: 'checking',
    pastStepCount: 0,
    currentStepCount: 0,
  };

  componentDidMount() {
    this._subscribe();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _subscribe = () => {
    this._subscription = Pedometer.watchStepCount(result => {
      this.setState({
        currentStepCount: result.steps,
      });
    });

    Pedometer.isAvailableAsync().then(
      result => {
        this.setState({
          isPedometerAvailable: String(result),
        });
      },
      error => {
        this.setState({
          isPedometerAvailable: 'Could not get isPedometerAvailable: ' + error,
        });
      }
    );

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1);
    Pedometer.getStepCountAsync(start, end).then(
      result => {
        this.setState({ pastStepCount: result.steps });
      },
      error => {
        this.setState({
          pastStepCount: 'Could not get stepCount: ' + error,
        });
      }
    );
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    return (
      <View style={styles.container}>
        <Text>Pedometer.isAvailableAsync(): {this.state.isPedometerAvailable}</Text>
        <Text>Steps taken in the last 24 hours: {this.state.pastStepCount}</Text>
        <Text>Walk! And watch this go up: {this.state.currentStepCount}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

</SnackInline>

## API

```js
import { Pedometer } from 'expo-sensors';
```

### `Pedometer.isAvailableAsync()`

Returns whether the pedometer is enabled on the device.

#### Returns

- Returns a promise that resolves to a `Boolean`, indicating whether the pedometer is available on this device.

### `Pedometer.getStepCountAsync(start, end)`

Get the step count between two dates.

#### Arguments

- **start (_Date_)** -- A date indicating the start of the range over which to measure steps.
- **end (_Date_)** -- A date indicating the end of the range over which to measure steps.

#### Returns

- Returns a promise that resolves to an `Object` with a `steps` key, which is a `Number` indicating the number of steps taken between the given dates.

##### Note: iOS returns only last 7 days worth of data

As [Apple documentation states](https://developer.apple.com/documentation/coremotion/cmpedometer/1613946-querypedometerdatafromdate?language=objc):

> Only the past seven days worth of data is stored and available for you to retrieve. Specifying a start date that is more than seven days in the past returns only the available data.

### `Pedometer.watchStepCount(callback)`

Subscribe to pedometer updates.

#### Arguments

- **callback (_function_)** A callback that is invoked when new step count data is available. The callback is provided a single argument that is an object with a `steps` key.

#### Returns

- An EventSubscription object that you can call remove() on when you would like to unsubscribe the listener.

## Standalone Applications

You'll need to configure an Android OAuth client for your app on the Google Play console for it to work as a standalone application on the Android platform. See https://developers.google.com/fit/android/get-api-key
