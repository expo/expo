---
title: Sensors
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-sensors'
packageName: 'expo-sensors'
---

import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-sensors`** provides various APIs for accessing device sensors to measure motion, orientation, pressure, magnetic fields, and step count.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Configuration

Starting in Android 12 (API level 31), the system has a 200ms limit for each sensor updates. If you need a update interval less than 200ms, you should add `<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS"/>` to **AndroidManifest.xml**.

## API

```js
import * as Sensors from 'expo-sensors';
// OR
import {
  Accelerometer,
  Barometer,
  Gyroscope,
  LightSensor,
  Magnetometer,
  MagnetometerUncalibrated,
  Pedometer,
} from 'expo-sensors';
```

For more information, please see the documentation for the sensor you are interested in:

- [Accelerometer](accelerometer.md)
- [Barometer](barometer.md)
- [Gyroscope](gyroscope.md)
- [Magnetometer](magnetometer.md)
- [LightSensor](light-sensor.md)
- [Pedometer](pedometer.md)
