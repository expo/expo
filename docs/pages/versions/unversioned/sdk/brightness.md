---
title: Brightness
---

An API to get and set screen brightness.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-brightness`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-brightness).

## API

```js
import * as Brightness from 'expo-brightness';
```

### `Brightness.setBrightnessAsync(brightnessValue)`

Sets screen brightness.

#### Arguments

- **brightnessValue (_number_)** -- A number between 0 and 1, representing the desired screen brightness.

### `Brightness.getBrightnessAsync()`

Gets screen brightness.

#### Returns

A `Promise` that is resolved with a number between 0 and 1, representing the current screen brightness.

### `Brightness.setSystemBrightnessAsync(brightnessValue)`

> **WARNING:** this method is experimental.

Sets global system screen brightness, requires `WRITE_SETTINGS` permissions on Android.

#### Arguments

- **brightnessValue (_number_)** -- A number between 0 and 1, representing the desired screen brightness.

#### Example

```javascript
await Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS);

const { status } = await Permissions.getAsync(Permissions.SYSTEM_BRIGHTNESS);
if (status === 'granted') {
  Brightness.setSystemBrightnessAsync(0.5);
}
...
```

### `Brightness.getSystemBrightnessAsync()`

> **WARNING:** this method is experimental.

Gets global system screen brightness.

#### Returns

A `Promise` that is resolved with a number between 0 and 1, representing the current system screen brightness.
