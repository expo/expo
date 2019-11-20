---
title: Barometer
---

Access the device barometer sensor to respond to changes in air pressure. `pressure` is measured in _`hectopascals`_ or _`hPa`_. Note that the barometer hardware is [not supported in the iOS Simulator](../../workflow/ios-simulator/#limitations).

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-sensors`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sensors).

## API

```js
import { Barometer } from 'expo-sensors';
```

| OS      | Units   | Provider                                                                                                | Description                                                                                                                         |
| ------- | ------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| iOS     | _`hPa`_ | [`CMAltimeter`](https://developer.apple.com/documentation/coremotion/cmaltimeter)                       | Altitude events reflect the change in the current altitude, not the absolute altitude.                                              |
| Android | _`hPa`_ | [`Sensor.TYPE_PRESSURE`](https://developer.android.com/reference/android/hardware/Sensor#TYPE_PRESSURE) | Monitoring air pressure changes.                                                                                                    |
| Web     | `N/A`   | `N/A`                                                                                                   | This sensor is not available on the web and cannot be accessed. An `UnavailabilityError` will be thrown if you attempt to get data. |
|         |

### `Barometer.isAvailableAsync()`

> You should always check the sensor availability before attempting to use it.

Returns a promise which resolves into a boolean denoting the availability of the device barometer.

| OS      | Availability                |
| ------- | --------------------------- |
| iOS     | iOS 8+                      |
| Android | Android 2.3+ (API Level 9+) |
| Web     | `N/A`                       |

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `Barometer.addListener((data: BarometerMeasurement) => void)`

Subscribe for updates to the barometer.

```js
const subscription = Barometer.addListener(({ pressure, relativeAltitude }) => {
  console.log({ pressure, relativeAltitude });
});
```

#### Arguments

- **listener (_function_)** -- A callback that is invoked when an barometer update is available. When invoked, the listener is provided a single argument that is an object containing: `pressure: number` (_`hPa`_). On **iOS** the `relativeAltitude: number` (_`meters`_) value will also be available.

#### Returns

- A subscription that you can call `remove()` on when you would like to unsubscribe the listener.

### `Barometer.removeAllListeners()`

Remove all listeners.

## Types

### `BarometerMeasurement`

The altitude data returned from the native sensors.

```typescript
type BarometerMeasurement = {
  pressure: number;
  /* iOS Only */
  relativeAltitude?: number;
};
```

| Name             | Type                 | Format   | iOS | Android | Web |
| ---------------- | -------------------- | -------- | --- | ------- | --- |
| pressure         | `number`             | `hPa`    | ✅  | ✅      | ❌  |
| relativeAltitude | `number | undefined` | `meters` | ✅  | ❌      | ❌  |

## Example: basic subscription

```javascript
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Barometer } from 'expo-sensors';

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
        <Text>{pressure * 100} Pa</Text>

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
    marginTop: 45,
    paddingHorizontal: 10,
  },
});
```
