---
title: Brightness
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

An API to get and set screen brightness.

### `Expo.Brightness.setBrightness(brightnessValue)`
Sets screen brightness.

#### Arguments

-   **brightnessValue : `number`** -- A number between 0 and 1, representing the desired screen brightness.

### `Expo.Brightness.getBrightnessAsync()`
Gets screen brightness.

#### Returns
A `Promise` that is resolved with a number between 0 and 1, representing the current screen brightness. 

### `Expo.Brightness.setSystemBrightness(brightnessValue)`
> **WARNING:** this method is experimental.

Sets global system screen brightness, requires `WRITE_SETTINGS` permissions on Android.

#### Arguments

-   **brightnessValue : `number`** -- A number between 0 and 1, representing the desired screen brightness.

#### Example

```javascript
await Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS);

const { status } = await Permissions.getAsync(Permissions.SYSTEM_BRIGHTNESS);
if (status === 'granted') {
  Expo.Brightness.setSystemBrightness(100);
}
...
```
### `Expo.Brightness.getSystemBrightnessAsync()`
> **WARNING:** this method is experimental.

Gets global system screen brightness.

#### Returns
A `Promise` that is resolved with a number between 0 and 1, representing the current system screen brightness.
