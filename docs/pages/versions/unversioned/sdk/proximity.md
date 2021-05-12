---
title: Proximity
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-sensors'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

import { InlineCode } from '~/components/base/code';

`Proximity` from **`expo-sensors`** provides access to the device proximity sensor to respond to changes in air pressure.

<PlatformsSection android ios />

## Installation

<InstallSection packageName="expo-sensors" />

## Usage

<SnackInline label='Basic Proximity usage' dependencies={['expo-sensors']}>

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Proximity } from 'expo-sensors';

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

  const _subscribe = () => {
    this._subscription = Proximity.addListener(proximityData => {
      setData(proximityData);
    });
  };

  const _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  const { proximityState = false } = data;

  return (
    <View style={styles.sensor}>
      <Text>Proximity:</Text>
      <Text>Is close?: {proximityState ? "yes" : "no"}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={_toggle} style={styles.button}>
          <Text>Toggle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
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
/* @end */
```

</SnackInline>

## API

```js
import { Proximity } from 'expo-sensors';
```

## Methods

### `Proximity.isAvailableAsync()`

> You should always check the sensor availability before attempting to use it.

Returns a promise which resolves into a boolean denoting the availability of the device proximity sensor.

| OS      | Availability                |
| ------- | --------------------------- |
| iOS     | iOS 3+                      |
| Android | Android ?.?+ (API Level ?+) |
| Web     | `N/A`                       |

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `Proximity.addListener((data: ProximityMeasurement) => void)`

Subscribe for updates to the proximity sensor.

```js
const subscription = Proximity.addListener(({ proximityState }) => {
  console.log({ proximityState });
});
```

#### Arguments

- **listener (_function_)** -- A callback that is invoked when a proximity sensor update is available. When invoked, the listener is provided a single argument that is an object containing: `proximityState: boolean` (_`isClose?`_).

#### Returns

- A subscription that you can call `remove()` on when you would like to unsubscribe the listener.

### `Proximity.removeAllListeners()`

Removes all listeners.

## Types

### `ProximityMeasurement`

The proximity state returned from the native sensors.

```typescript
type ProximityMeasurement = {
  proximityState: boolean;
};
```

| Name             | Type                                         | Format     | iOS | Android | Web |
| ---------------- | -------------------------------------------- | ---------- | --- | ------- | --- |
| proximityState   | `boolean`                                    | `isClose?` | ✅  | ✅      | ❌  |

## Units and Providers

| OS      | Units        | Provider                                                                                                | Description                                                                                                                         |
| ------- | ------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| iOS     | _`isClose?`_ | [`UIDevice`](https://developer.apple.com/documentation/uikit/uidevice)                                  | Proximity sensor is part of the basic device sensors.                                                                               |
| Android | _`?`_      | [`Sensor.TYPE_PRESSURE`](https://developer.android.com/reference/android/hardware/Sensor#TYPE_PRESSURE)   | Monitoring air pressure changes.                                                                                                    |
| Web     | `N/A`        | `N/A`                                                                                                   | This sensor is not available on the web and cannot be accessed. An `UnavailabilityError` will be thrown if you attempt to get data. |
