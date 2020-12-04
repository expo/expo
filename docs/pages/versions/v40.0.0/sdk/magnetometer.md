---
title: Magnetometer
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-40/packages/expo-sensors'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

`Magnetometer` from **`expo-sensors`** provides access to the device magnetometer sensor(s) to respond to and measure the changes in the magnetic field. You can access the calibrated values with `Magnetometer.` and uncalibrated raw values with `MagnetometerUncalibrated`.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-sensors" />

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
  provided a single argumument that is an object containing keys x, y,
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

### Example: basic subscription

<SnackInline label='Magnetometer' dependencies={['expo-sensors']}>

```javascript
import { Magnetometer } from 'expo-sensors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Compass() {
  const [data, setData] = React.useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [subscription, setSubscription] = React.useState(null);

  React.useEffect(() => {
    _toggle();
    return () => {
      _unsubscribe();
    };
  }, []);

  const _toggle = () => {
    if (subscription) {
      _unsubscribe();
    } else {
      _subscribe();
    }
  };

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

  const { x, y, z } = data;
  return (
    <View style={styles.sensor}>
      <Text>Magnetometer:</Text>
      <Text>
        x: {round(x)} y: {round(y)} z: {round(z)}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={_toggle} style={styles.button}>
          <Text>Toggle</Text>
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

</SnackInline>
