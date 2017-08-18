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

## Subscribing to App Updates

### `Expo.Util.addNewVersionListenerExperimental(listener)`

_Android only_. Invokes a callback when a new version of your app is successfully downloaded in the background.

#### Arguments

-   **listener (_function_)** -- A callback that is invoked when a new version of your app is successfully downloaded in the background.

#### Returns

An [EventSubscription](#eventsubscription) object that you can call remove() on when you would like to unsubscribe from the listener.

### Related types

### `EventSubscription`

Returned from `addNewVersionListenerExperimental`.

-   **remove() (_function_)** -- Unsubscribe the listener from future updates.

### `Event`

An object that is passed into each event listener when a new version is available.

-   **manifest (_object_)** -- Manifest object of the new version of the app.
