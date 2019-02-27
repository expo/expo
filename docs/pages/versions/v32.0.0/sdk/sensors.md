---
title: Sensors
---

Various APIs for accessing device sensors are included under this umbrella package called `expo-sensors`.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sensors).

## API

```js
// in managed apps:
import {
  Accelerometer,
  Barometer,
  Gyroscope,
  Magnetometer,
  MagnetometerUncalibrated,
  Pedometer,
} from 'expo';

// in bare apps:
import {
  Accelerometer,
  Barometer,
  Gyroscope,
  Magnetometer,
  MagnetometerUncalibrated,
  Pedometer,
} from 'expo-sensors';
```

See documentation for the sensors you are interested in using for more information.
