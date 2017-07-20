---
title: Util
---

Helpful utility functions that don't fit anywhere else, including some localization / i18n methods.

### `Expo.Util.getCurrentDeviceCountryAsync()`

Returns the current device country code.

### `Expo.Util.getCurrentLocaleAsync()`

Returns the current device locale as a string.

### `Expo.Util.getCurrentTimeZoneAsync()`

Returns the current device time zone name.

### `Expo.Util.reload()`

Reloads the current experience. This will fetch and load the newest available JS supported by the device's Expo environment. This is useful for triggering an update of your experience if you have published a new version.

> **Note:** On an iOS standalone app, `Util.reload()` will check to see if you've published changes to your app, and reload only if you have.