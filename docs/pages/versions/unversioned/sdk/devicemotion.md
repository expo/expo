---
title: DeviceMotion
---

Access the device motion and orientation sensors. All data is presented in terms of three axes that run through a device. According to portrait orientation: X runs from left to right, Y from bottom to top and Z perpendicularly through the screen from back to front.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-sensors`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sensors).

## API

```js
import { DeviceMotion } from 'expo-sensors';
```

### `DeviceMotion.isAvailableAsync()`

> You should always check the sensor availability before attempting to use it.

Returns whether the `DeviceMotion` API is enabled on the device.

On **web** this starts a timer and waits to see if an event is fired. This should predict if the iOS device has the **device orientation** API disabled in `Settings > Safari > Motion & Orientation Access`. Some devices will also not fire if the site isn't hosted with **HTTPS** as `DeviceMotion` is now considered a secure API. There is no formal API for detecting the status of `DeviceMotion` so this API can sometimes be unreliable on web.

#### Returns

- A promise that resolves to a `boolean` denoting the availability of the sensor.

### `DeviceMotion.addListener(listener)`

Subscribe for updates to DeviceMotion.

#### Arguments

- **listener (_function_)** -- A callback that is invoked when a
  DeviceMotion update is available. When invoked, the listener is
  provided a single argument that is an object containing following fields:

  - **acceleration (_object_)** -- Device acceleration on the three axis as an object with x, y, z keys. Expressed in m/s<sup>2</sup>.

  - **accelerationIncludingGravity (_object_)** -- Device acceleration with the effect of gravity on the three axis as an object with x, y, z keys. Expressed in m/s<sup>2</sup>.

  - **rotation (_object_)** -- Device's orientation in space as an object with alpha, beta, gamma keys where alpha is for rotation around Z axis, beta for X axis rotation and gamma for Y axis rotation.

  - **rotationRate (_object_)** -- Rotation rates of the device around each of its axes as an object with alpha, beta, gamma keys where alpha is around Z axis, beta for X axis and gamma for Y axis.

  - **orientation (_number_)** -- Device orientation based on screen rotation. Value is on of `0` (portrait), `90` (right landscape), `180` (upside down), `-90` (left landscape).

#### Returns

- A subscription that you can call `remove()` on when you
  would like to unsubscribe the listener.

### `DeviceMotion.removeAllListeners()`

Remove all listeners.

### `DeviceMotion.setUpdateInterval(intervalMs)`

Subscribe for updates to DeviceMotion.

#### Arguments

- **intervalMs (_number_)** Desired interval in milliseconds between
  DeviceMotion updates.
