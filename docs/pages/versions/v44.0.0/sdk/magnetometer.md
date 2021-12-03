---
title: Magnetometer
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-sensors'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

`Magnetometer` from **`expo-sensors`** provides access to the device magnetometer sensor(s) to respond to and measure the changes in the magnetic field. You can access the calibrated values with `Magnetometer.` and uncalibrated raw values with `MagnetometerUncalibrated`.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-sensors" />

## Usage

<SnackInline label='Magnetometer' dependencies={['expo-sensors']}>

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';

export default function Compass() {
  const [data, setData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [subscription, setSubscription] = useState(null);

  const _slow = () => {
    Magnetometer.setUpdateInterval(1000);
  };

  const _fast = () => {
    Magnetometer.setUpdateInterval(16);
  };

  const _subscribe = () => {
    setSubscription(
      Magnetometer.addListener(result => {
        setData(result);
      })
    );
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  const { x, y, z } = data;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Magnetometer:</Text>
      <Text style={styles.text}>
        x: {round(x)} y: {round(y)} z: {round(z)}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={subscription ? _unsubscribe : _subscribe} style={styles.button}>
          <Text>{subscription ? 'On' : 'Off'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={_slow} style={[styles.button, styles.middleButton]}>
          <Text>Slow</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={_fast} style={styles.button}>
          <Text>Fast</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* @hide function round() { ... } */
function round(n) {
  if (!n) {
    return 0;
  }
  return Math.floor(n * 100) / 100;
}
/* @end */

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  text: {
    textAlign: 'center',
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
});
/* @end */
```

</SnackInline>

## API

```js
import { Magnetometer } from 'expo-sensors';
```

## Methods

### `Magnetometer.isAvailableAsync()`

> You should always check the sensor availability before attempting to use it.

Returns whether the magnetometer is enabled on the device.

| OS      | Availability                |
| ------- | --------------------------- |
| iOS     | iOS 8+                      |
| Android | Android 2.3+ (API Level 9+) |
| Web     | `N/A`                       |

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `Magnetometer.addListener(listener)`

Subscribe for updates to the Magnetometer.

#### Arguments

- **listener (_function_)** -- A callback that is invoked when an
  Magnetometer update is available. When invoked, the listener is
  provided a single argument that is an object containing keys x, y,
  z.

#### Returns

- A subscription that you can call `remove()` on when you
  would like to unsubscribe the listener.

### `Magnetometer.removeAllListeners()`

Remove all listeners.

### `Magnetometer.setUpdateInterval(intervalMs)`

Subscribe for updates to the Magnetometer.

#### Arguments

- **intervalMs (_number_)** Desired interval in milliseconds between
  Magnetometer updates.
