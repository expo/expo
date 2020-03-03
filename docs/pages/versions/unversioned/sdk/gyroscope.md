---
title: Gyroscope
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-sensors'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

`Gyroscope` from **`expo-sensors`** provides access to the device's gyroscope sensor to respond to changes in rotation in 3D space.

<PlatformsSection android emulator ios web />

## Installation

<InstallSection packageName="expo-sensors" />

## Usage

<SnackInline label='Basic Gyroscope usage' templateId='gyroscope' dependencies={['expo-sensors']}>

```js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gyroscope } from 'expo-sensors';

export default function App() {
  const [data, setData] = useState({});

  useEffect(() => {
    _toggle();
  }, []);

  useEffect(() => {
    return () => {
      _unsubscribe();
    };
  }, []);

  const _toggle = () => {
    if (this._subscription) {
      _unsubscribe();
    } else {
      _subscribe();
    }
  };

  const _slow = () => {
    Gyroscope.setUpdateInterval(1000);
  };

  const _fast = () => {
    Gyroscope.setUpdateInterval(16);
  };

  const _subscribe = () => {
    this._subscription = Gyroscope.addListener(gyroscopeData => {
      setData(gyroscopeData);
    });
  };

  const _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  let { x, y, z } = data;
  return (
    <View style={styles.sensor}>
      <Text style={styles.text}>Gyroscope:</Text>
      <Text style={styles.text}>
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
```

</SnackInline>

## API

```js
import { Gyroscope } from 'expo-sensors';
```

<TableOfContentSection title='Methods' contents={['Gyroscope.isAvailableAsync()', 'Gyroscope.addListener(listener)', 'Gyroscope.removeAllListeners()', 'Gyroscope.setUpdateInterval(intervalMs)']} />

## Methods

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
