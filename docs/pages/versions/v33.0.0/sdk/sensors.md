---
title: Sensors
---

Various APIs for accessing device sensors are included under this umbrella package called `expo-sensors`.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-sensors`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sensors).

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

- [Accelerometer](../accelerometer/)
- [Barometer](../barometer/)
- [Gyroscope](../gyroscope/)
- [Magnetometer](../magnetometer/)
- [Pedometer](../pedometer/) 
