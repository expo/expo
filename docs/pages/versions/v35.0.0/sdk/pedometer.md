---
title: Pedometer
---

import SnackEmbed from '~/components/plugins/SnackEmbed';

Uses Core Motion on iOS and the system `hardware.Sensor` on Android to get the user's step count.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-sensors`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sensors).

## Usage

<SnackEmbed snackId="@charliecruzan/letsgoforawalk" />

## API

```js
import { Pedometer } from 'expo-sensors';
```

### `Pedometer.isAvailableAsync()`

Returns whether the pedometer is enabled on the device.

#### Returns

- Returns a promise that resolves to a `Boolean`, indicating whether the pedometer is available on this device.

### `Pedometer.getStepCountAsync(start, end)`

Get the step count between two dates.

#### Arguments

- **start (_Date_)** -- A date indicating the start of the range over which to measure steps.
- **end (_Date_)** -- A date indicating the end of the range over which to measure steps.

#### Returns

- Returns a promise that resolves to an `Object` with a `steps` key, which is a `Number` indicating the number of steps taken between the given dates.

##### Note: iOS returns only last 7 days worth of data

As [Apple documentation states](https://developer.apple.com/documentation/coremotion/cmpedometer/1613946-querypedometerdatafromdate?language=objc):

> Only the past seven days worth of data is stored and available for you to retrieve. Specifying a start date that is more than seven days in the past returns only the available data.

### `Pedometer.watchStepCount(callback)`

Subscribe to pedometer updates.

#### Arguments

- **callback (_function_)** A callback that is invoked when new step count data is available. The callback is provided a single argument that is an object with a `steps` key.

#### Returns

- An EventSubscription object that you can call remove() on when you would like to unsubscribe the listener.

## Standalone Applications

You'll need to configure an Android OAuth client for your app on the Google Play console for it to work as a standalone application on the Android platform. See https://developers.google.com/fit/android/get-api-key
