---
title: Gyroscope
---

Access the device gyroscope sensor to respond to changes in rotation in 3d space. Note that the gyroscope hardware is [not supported in the iOS Simulator](../../workflow/ios-simulator/#limitations).

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-sensors`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sensors).

## API

```js
import { Gyroscope } from 'expo-sensors';
```

### `Gyroscope.isAvailableAsync()`

> You should always check the sensor availability before attempting to use it.

Returns whether the gyroscope is enabled on the device.

On **web** this starts a timer and waits to see if an event is fired. This should predict if the iOS device has the **device orientation** API disabled in `Settings > Safari > Motion & Orientation Access`. Some devices will also not fire if the site isn't hosted with **HTTPS** as `DeviceMotion` is now considered a secure API. There is no formal API for detecting the status of `DeviceMotion` so this API can sometimes be unreliable on web.

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `Gyroscope.addListener(listener)`

Subscribe for updates to the gyroscope.

#### Arguments

- **listener (_function_)** -- A callback that is invoked when an gyroscope update is available. When invoked, the listener is provided a single argument that is an object containing keys x, y, z.

#### Returns

- An EventSubscription object that you can call `remove()` on when you would like to unsubscribe the listener.

### `Gyroscope.removeAllListeners()`

Remove all listeners.

### `Gyroscope.setUpdateInterval(intervalMs)`

Subscribe for updates to the gyroscope.

#### Arguments

- **intervalMs (_number_)** -- Desired interval in milliseconds between gyroscope updates.

## Example: basic subscription

```javascript
import React from 'react';
import { Gyroscope } from 'expo-sensors';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default class GyroscopeSensor extends React.Component {
  state = {
    gyroscopeData: {},
  };

  componentDidMount() {
    this._toggle();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _toggle = () => {
    if (this._subscription) {
      this._unsubscribe();
    } else {
      this._subscribe();
    }
  };

  _slow = () => {
    Gyroscope.setUpdateInterval(1000);
  };

  _fast = () => {
    Gyroscope.setUpdateInterval(16);
  };

  _subscribe = () => {
    this._subscription = Gyroscope.addListener(result => {
      this.setState({ gyroscopeData: result });
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    let { x, y, z } = this.state.gyroscopeData;

    return (
      <View style={styles.sensor}>
        <Text>Gyroscope:</Text>
        <Text>
          x: {round(x)} y: {round(y)} z: {round(z)}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this._toggle} style={styles.button}>
            <Text>Toggle</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._slow} style={[styles.button, styles.middleButton]}>
            <Text>Slow</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._fast} style={styles.button}>
            <Text>Fast</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

function round(n) {
  if (!n) {
    return 0;
  }

  return Math.floor(n * 100) / 100;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 15,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
  },
  middleButton: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  sensor: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
});
```
