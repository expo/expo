---
title: LightSensor
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-sensors'
packageName: 'expo-sensors'
---

import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

import { InlineCode } from '~/components/base/code';

`LightSensor` from `expo-sensors` provides access to the device's light sensor to respond to illuminance changes. `illuminance` is measured in `Lux` or `lx`.

<PlatformsSection android emulator />

## Installation

<APIInstallSection />

## Usage

<SnackInline label='Basic Light Sensor usage' dependencies={['expo-sensors']}>

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { LightSensor } from 'expo-sensors';

export default function App() {
  const [illuminance, setIlluminance] = useState(null);

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
    this._subscription = LightSensor.addListener(lightSensorData => {
      setIlluminance(lightSensorData.illuminance);
    });
  };

  const _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  return (
    <View style={styles.sensor}>
      <Text>Light Sensor:</Text>
      <Text>Illuminance: {Platform.OS === 'android' ? `${illuminance} lx` : `Only available on Android`}</Text>
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
import { LightSensor } from 'expo-sensors';
```

## Methods

### `LightSensor.isAvailableAsync()`

> You should always check the sensor availability before attempting to use it.

Returns a promise which resolves into a boolean denoting the availability of the device light sensor.

| OS      | Availability                |
| ------- | --------------------------- |
| iOS     | `N/A`                       |
| Android | Android 2.3+ (API Level 9+) |
| Web     | `N/A`                       |

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `LightSensor.addListener((data: LightSensorMeasurement) => void)`

Subscribe for updates to the light sensor.

```js
const subscription = LightSensor.addListener((lightSensorData) => {
  console.log(lightSensorData.illuminance);
});
```

#### Arguments

- **listener (_function_)** -- A callback that is invoked when a LightSensor update is available. When invoked, the listener is provided a single argument that is the illuminance value.

#### Returns

- A subscription that you can call `remove()` on when you would like to unsubscribe the listener.

### `LightSensor.removeAllListeners()`

Removes all listeners.

## Types

### `LightSensorMeasurement`

```typescript
type LightSensorMeasurement = {
  illuminance: number;
};
```

| Name             | Type                                         | Format   | iOS | Android | Web |
| ---------------- | -------------------------------------------- | -------- | --- | ------- | --- |
| illuminance         | `number`                                     | `lx`    | ❌  | ✅      | ❌  |

## Units and Providers

| OS      | Units   | Provider                                                                                                | Description                                                                                                                         |
| ------- | ------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| iOS     | `N/A`   | Not implemented... see([here](https://github.com/expo/expo/discussions/18101))
| Android | _`lx`_ | [`Sensor.TYPE_LIGHT`](https://developer.android.com/reference/android/hardware/Sensor#TYPE_LIGHT) | illuminance changes.                                                                                                    |
| Web     | `N/A` |          Not implemented... see([here](https://github.com/expo/expo/discussions/18101))