# Accelerometer

---

Access the device accelerometer sensor(s) to respond to changes in acceleration in 3d space.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sensors).

## API

```js
// in managed apps:
import { Accelerometer } from 'expo';

// in bare apps:
import { Accelerometer } from 'expo-sensors';
```

### `Accelerometer.isAvailableAsync()`

Returns whether the accelerometer is enabled on the device.

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `Accelerometer.addListener(listener)`

Subscribe for updates to the accelerometer.

#### Arguments

- **listener (_function_)** -- A callback that is invoked when an
  accelerometer update is available. When invoked, the listener is
  provided a single argument that is an object containing keys x, y,
  z.

#### Returns

- A subscription that you can call `remove()` on when you
  would like to unsubscribe the listener.

### `Accelerometer.removeAllListeners()`

Remove all listeners.

### `Accelerometer.setUpdateInterval(intervalMs)`

Subscribe for updates to the accelerometer.

#### Arguments

- **intervalMs (_number_)** Desired interval in milliseconds between
  accelerometer updates.

## Example: basic subscription

```javascript
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Accelerometer } from 'expo';

export default class AccelerometerSensor extends React.Component {
  state = {
    accelerometerData: {},
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
    /* @info Request updates every 1000ms */ Accelerometer.setUpdateInterval(1000); /* @end */
  };

  _fast = () => {
    /* @info Request updates every 16ms, which is approximately equal to every frame at 60 frames per second */ Accelerometer.setUpdateInterval(
      16
    ); /* @end */
  };

  _subscribe = () => {
    /* @info Subscribe to events and update the component state with the new data from the Accelerometer. We save the subscription object away so that we can remove it when the component is unmounted*/ this._subscription = Accelerometer.addListener(
      accelerometerData => {
        this.setState({ accelerometerData });
      }
    ); /* @end */
  };

  _unsubscribe = () => {
    /* @info Be sure to unsubscribe from events when the component is unmounted */ this
      ._subscription && this._subscription.remove(); /* @end */

    this._subscription = null;
  };

  render() {
    /* @info A data point is provided for each of the x, y, and z axes */ let {
      x,
      y,
      z,
    } = this.state.accelerometerData; /* @end */

    return (
      <View style={styles.sensor}>
        <Text>Accelerometer:</Text>
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
