---
title: Pedometer
---

Use Core Motion (iOS) or Google Fit (Android) to get the user's step count.

${<SnackEmbed snackId="S1gdfOb4Z" />}

### `Expo.Pedometer.isAvailableAsync()`

Determine whether the pedometer is available.

#### Returns

- Returns a promise that resolves to a `Boolean`, indicating whether the pedometer is available on this device.

### `Expo.Pedometer.getStepCountAsync(start, end)`

Get the step count between two dates.

#### Arguments

- **start (_Date_)** -- A date indicating the start of the range over which to measure steps.
- **end (_Date_)** -- A date indicating the end of the range over which to measure steps.

#### Returns

- Returns a promise that resolves to an `Object` with a `steps` key, which is a `Number` indicating the number of steps taken between the given dates.

### `Expo.Pedometer.watchStepCount(callback)`

Subscribe to pedometer updates.

#### Arguments

- **callback (_function_)** A callback that is invoked when new step count data is available. The callback is provided a single argument that is an object with a `steps` key.

#### Returns

- An EventSubscription object that you can call remove() on when you would like to unsubscribe the listener.

## Standalone Applications
You'll need to configure an Android OAuth client for your app on the Google Play console for it to work as a standalone application on the Android platform. See https://developers.google.com/fit/android/get-api-key