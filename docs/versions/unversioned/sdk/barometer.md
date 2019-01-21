---
title: Barometer
---

Access the device barometer sensor to respond to changes in air pressure. Currently data is passed back as raw values. You will need to convert the units yourself. Below we've included information regarding the exact format data is returned in.

| OS      | Units               | Provider                                                                                                | Description                                                                                                                         |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| iOS     | kilopascal          | [`CMAltimeter`](https://developer.apple.com/documentation/coremotion/cmaltimeter)                       | Altitude events reflect the change in the current altitude, not the absolute altitude.                                              |
| Android | _`hPa`_ or _`mbar`_ | [`Sensor.TYPE_PRESSURE`](https://developer.android.com/reference/android/hardware/Sensor#TYPE_PRESSURE) | Monitoring air pressure changes.                                                                                                    |
| Web     | `N/A`               | `N/A`                                                                                                   | This sensor is not available on the web and cannot be accessed. An `UnavailabilityError` will be thrown if you attempt to get data. |
|         |

## Usage

> This module was introduced in Expo v33

Barometer can be used outside of the Expo client with the `expo-sensors` & `expo-sensors-interface` libraries.

## Methods

### `Barometer.isAvailableAsync()`

Returns a promise which resolves into a boolean denoting the availability of the device barometer.

| OS      | Availability                |
| ------- | --------------------------- |
| iOS     | iOS 8+                      |
| Android | Android 2.3+ (API Level 9+) |
| Web     | `N/A`                       |

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `Barometer.addListener(listener)`

Subscribe for updates to the barometer.

```js
const subscription = Barometer.addListener(({ pressure /* iOS Only */, relativeAltitude }) => {
  console.log({ pressure, relativeAltitude });
});
```

#### Arguments

- **listener (_function_)** -- A callback that is invoked when an barometer update is available. When invoked, the listener is provided a single argumument that is an object containing: `pressure: number`. On iOS the `relativeAltitude: number` value will also be available.

#### Returns

- A subscription that you can call `remove()` on when you
  would like to unsubscribe the listener.

### `Barometer.removeAllListeners()`

Remove all listeners.

## Example: basic subscription

```javascript
import React from 'react';
import { Barometer } from 'expo-sensors';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default class BarometerSensor extends React.Component {
  state = {
    data: {},
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

  _subscribe = () => {
    this._subscription = Barometer.addListener(data => {
      this.setState({ data });
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    const { pressure = 0 } = this.state.data;

    return (
      <View style={styles.sensor}>
        <Text>Barometer:</Text>
        <Text>{pressure * 100}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this._toggle} style={styles.button}>
            <Text>Toggle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
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
  sensor: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
});
```
