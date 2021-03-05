---
title: ScreenOrientation
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo/src/ScreenOrientation'
---

Screen Orientation is defined as the orientation in which graphics are painted on the device. For example, the figure below has a device in a vertical and horizontal physical orientation, but a portrait screen orientation. For physical device orientation, see the orientation section of [Device Motion](devicemotion.md).

![Portrait orientation in different physical orientations](/static/images/screen-orientation-portrait.png)

`ScreenOrientation` from **`expo`** allows changing supported screen orientations at runtime, and subscribing to orientation changes. This will take priority over the `orientation` key in `app.json`.

On both iOS and Android platforms, changes to the screen orientation will override any system settings or user preferences. On Android, it is possible to change the screen orientation while taking the user's preferred orientation into account. On iOS, user and system settings are not accessible by the application and any changes to the screen orientation will override existing settings.

> Web support has [limited support](https://caniuse.com/#feat=deviceorientation). For improved resize detection on mobile Safari, check out the docs on using [Resize Observer in Expo web](../../../guides/customizing-webpack.md#resizeobserver).

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator | Web |
| -------------- | ---------------- | ---------- | ------------- | --- |
| ✅             | ✅               | ✅         | ✅            | ✅  |

## Installation

This API is pre-installed in [managed](../../../introduction/managed-vs-bare.md#managed-workflow) apps. It is not yet available for [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native apps.

## API

```js
import { ScreenOrientation } from 'expo';
```

### Methods

- [`ScreenOrientation.allowAsync(orientationLock)`](#screenorientationallowasyncorientationlock)
- [`ScreenOrientation.lockAsync(orientationLock)`](#screenorientationlockasyncorientationlock)
- [`ScreenOrientation.lockPlatformAsync(platformInfo)`](#screenorientationlockplatformasyncplatforminfo)
- [`ScreenOrientation.unlockAsync()`](#screenorientationunlockasync)
- [`ScreenOrientation.getOrientationAsync()`](#screenorientationgetorientationasync)
- [`ScreenOrientation.getOrientationLockAsync()`](#screenorientationgetorientationlockasync)
- [`ScreenOrientation.getPlatformOrientationLockAsync()`](#screenorientationgetplatformorientationlockasync)
- [`ScreenOrientation.supportsOrientationLockAsync(orientationLock)`](#screenorientationsupportsorientationlockasyncorientationlock)
- [`ScreenOrientation.addOrientationChangeListener(listener)`](#screenorientationaddorientationchangelistenerlistener)
- [`ScreenOrientation.removeOrientationChangeListeners()`](#screenorientationremoveorientationchangelisteners)
- [`ScreenOrientation.removeOrientationChangeListener(subscription)`](#screenorientationremoveorientationchangelistenersubscription)

### Enum Types

- [`ScreenOrientation.Orientation`](#screenorientationorientation)
- [`ScreenOrientation.OrientationLock`](#screenorientationorientationlock)
- [`ScreenOrientation.SizeClassIOS`](#screenorientationsizeclassios)
- [`ScreenOrientation.WebOrientationLock`](#screenorientationweborientationlock)

### Object Types

- [`ScreenOrientation.PlatformOrientationInfo`](#screenorientationplatformorientationinfo)
- [`ScreenOrientation.OrientationInfo`](#screenorientationorientationinfo)
- [`ScreenOrientation.OrientationChangeEvent`](#screenorientationorientationchangeevent)
- [`Subscription`](#subscription)

### Function Types

- [`ScreenOrientation.OrientationChangeListener`](#screenorientationorientationchangelistener)

### Errors

- [Error Codes](#error-codes)

## Methods

### `ScreenOrientation.allowAsync(orientationLock)`

Deprecated in favor of `ScreenOrientation.lockAsync`. Allow a screen orientation.

#### Arguments

- **orientation (_OrientationLock_)** -- The orientation lock to apply. See the [`OrientationLock`](#screenorientationorientationlock) enum for possible values.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set.

#### Example

```javascript
function changeScreenOrientation() {
  await ScreenOrientation.allowAsync(ScreenOrientation.Orientation.LANDSCAPE);
}
```

### `ScreenOrientation.lockAsync(orientationLock)`

Lock the screen orientation to a particular OrientationLock.

#### Arguments

- **orientationLock (_OrientationLock_)** -- The orientation lock to apply. See the [`OrientationLock`](#screenorientationorientationlock) enum for possible values.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set.

#### Error Codes

- `ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK` - an invalid [`OrientationLock`](#screenorientationorientationlock) was passed in.
- `ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK` - the platform does not support the orientation lock policy.

#### Example

```javascript
async function changeScreenOrientation() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
}
```

### `ScreenOrientation.lockPlatformAsync(platformInfo)`

#### Arguments

- **platformInfo (_PlatformOrientationInfo_)** -- The platform specific lock to apply. See the [`PlatformOrientationInfo`](#screenorientationplatformorientationinfo) object type for the different platform formats.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set and rejecting if an invalid option or value is passed.

#### Error Codes

- `ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK` - an invalid [`OrientationLock`](#screenorientationorientationlock) was passed in.
- `ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK` - the platform does not support the orientation lock policy.

### `ScreenOrientation.unlockAsync()`

Sets the screen orientation back to the `OrientationLock.DEFAULT` policy.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set.

### `ScreenOrientation.getOrientationAsync()`

Gets the current screen orientation.

#### Returns

Returns a promise that resolves to an [`OrientationInfo`](#screenorientationorientationinfo) object value that reflects the current screen orientation.

### `ScreenOrientation.getOrientationLockAsync()`

Gets the current screen orientation lock type.

#### Returns

Returns a promise with an [`OrientationLock`](#screenorientationorientationlock) value.

### `ScreenOrientation.getPlatformOrientationLockAsync()`

Gets the platform specific screen orientation lock type.

#### Returns

Returns a promise with a [`PlatformOrientationInfo`](#screenorientationplatformorientationinfo) value.

### `ScreenOrientation.supportsOrientationLockAsync(orientationLock)`

Returns whether the [`OrientationLock`](#screenorientationorientationlock) policy is supported on the device.

#### Returns

Returns a promise that resolves to a `boolean` value that reflects whether or not the orientationLock is supported.

### `ScreenOrientation.addOrientationChangeListener(listener)`

Invokes the `listener` function when the screen orientation changes.

#### Arguments

- **listener (_OrientationChangeListener_)**
  - Each orientation update will pass an object with the new [`OrientationChangeEvent`](#screenorientationorientationchangeevent) to the listener.

#### Returns

Returns an [`Subscription`](#subscription) object that can later be used to unsuscribe updates to the listener.

### `ScreenOrientation.removeOrientationChangeListeners()`

Removes all listeners subscribed to orientation change updates.

### `ScreenOrientation.removeOrientationChangeListener(subscription)`

Unsubscribes the listener associated with the `subscription` object from all orientation change updates.

#### Arguments

- **subscription (_Subscription_)**
  - A subscription object that manages the updates passed to a listener function on an orientation change.

## Enum types

### `ScreenOrientation.Orientation`

- **`Orientation.UNKNOWN`** - An unknown screen orientation. For example, the device is flat, perhaps on a table.
- **`Orientation.PORTRAIT`** - Portrait interface orientation (right side up or upside down).
- **`Orientation.PORTRAIT_UP`** - Right-side up portrait interface orientation.
- **`Orientation.PORTRAIT_DOWN`** - Upside down portrait interface orientation.
- **`Orientation.LANDSCAPE`** - Landscape interface orientation (right or left).
- **`Orientation.LANDSCAPE_LEFT`** - Left landscape interface orientation.
- **`Orientation.LANDSCAPE_RIGHT`** - Right landscape interface orientation.

### `ScreenOrientation.OrientationLock`

An enum whose values can be passed to the [`lockAsync`](#screenorientationlockasyncorientationlock) method.

- **`OrientationLock.DEFAULT`** -- The default orientation. On iOS, this will allow all orientations except `Orientation.PORTRAIT_DOWN`. On Android, this lets the system decide the best orientation.
- **`OrientationLock.ALL`** -- All four possible orientations
- **`OrientationLock.ALL_BUT_UPSIDE_DOWN`** -- ALL, excluding PORTRAIT_DOWN.
- **`OrientationLock.PORTRAIT`** -- Any portrait orientation.
- **`OrientationLock.PORTRAIT_UP`** -- Right-side up portrait only.
- **`OrientationLock.PORTRAIT_DOWN`** -- Upside down portrait only.
- **`OrientationLock.LANDSCAPE`** -- Any landscape orientation.
- **`OrientationLock.LANDSCAPE_LEFT`** -- Left landscape only.
- **`OrientationLock.LANDSCAPE_RIGHT`** -- Right landscape only.
- **`OrientationLock.OTHER`** -- A platform specific orientation. This is not a valid policy that can be applied in [`lockAsync`](#screenorientationlockasyncorientationlock).
- **`OrientationLock.UNKNOWN`** -- An unknown screen orientation lock. This is not a valid policy that can be applied in [`lockAsync`](#screenorientationlockasyncorientationlock).

### `ScreenOrientation.SizeClassIOS`

Each iOS device has a default set of [size classes](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html) that you can use as a guide when designing your interface.

- **`SizeClassIOS.REGULAR`**
- **`SizeClassIOS.COMPACT`**
- **`SizeClassIOS.UNKNOWN`**

### `ScreenOrientation.WebOrientationLock`

An enum representing the lock policies that can be applied on the web platform, modelled after the [W3C specification](https://w3c.github.io/screen-orientation/#dom-orientationlocktype). These values can be applied through the [`lockPlatformAsync`](#screenorientationlockplatformasyncplatforminfo) method.

- **`PORTRAIT_PRIMARY`**
- **`PORTRAIT_SECONDARY`**
- **`PORTRAIT`**
- **`LANDSCAPE_PRIMARY`**
- **`LANDSCAPE_SECONDARY`**
- **`LANDSCAPE`**
- **`ANY`**
- **`UNKNOWN`**

## Object Types

### `ScreenOrientation.PlatformOrientationInfo`

    - screenOrientationConstantAndroid (_integer_): A constant to set using the Android native [API](https://developer.android.com/reference/android/R.attr.html#screenOrientation). For example, in order to set the lock policy to [unspecified](https://developer.android.com/reference/android/content/pm/ActivityInfo.html#SCREEN_ORIENTATION_UNSPECIFIED), -1 should be passed in. (Android only)
    - screenOrientationArrayIOS (Array[Orientation]): An array of orientations to allow on the iOS platform (iOS only)
    - screenOrientationLockWebOrientation (_WebOrientationLock_): A web orientation lock to apply in the browser (web only)

### `ScreenOrientation.OrientationInfo`

    - orientation (_Orientation_): The current orientation of the device
    - verticalSizeClass (_SizeClassIOS_): The [vertical size class](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html) of the device (iOS only)
    - horizontalSizeClass (_SizeClassIOS_): The [horizontal size class](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html) of the device (iOS only)

### `ScreenOrientation.OrientationChangeEvent`

    - orientationLock (_OrientationLock_): The current OrientationLock of the device.
    - orientationInfo (_OrientationInfo_): The current OrientationInfo of the device.

### `Subscription`

A [subscription object](https://github.com/expo/expo/blob/master/packages/%40unimodules/react-native-adapter/src/EventEmitter.ts#L13).

## Function Types

### `ScreenOrientation.OrientationChangeListener`

#### Args

    - event (_OrientationChangeEvent_): An update with the most recent OrientationChangeEvent.

#### Returns

`void`

## Error Codes

| Code                                                | Description                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK | The platform does not support the [`OrientationLock`](#screenorientationorientationlock) policy. |
| ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK     | An invalid [`OrientationLock`](#screenorientationorientationlock) was passed in.                 |
