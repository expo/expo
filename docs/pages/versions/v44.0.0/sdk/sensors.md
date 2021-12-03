---
title: Sensors
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-sensors'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-sensors`** provides various APIs for accessing device sensors to measure motion, orientation, pressure, magnetic fields, and step count.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-sensors" />

## API

```js
import * as Sensors from 'expo-sensors';
// OR
import {
  Accelerometer,
  Barometer,
  Gyroscope,
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
- [Pedometer](pedometer.md)
