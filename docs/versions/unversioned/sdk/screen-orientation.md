---
title: ScreenOrientation
---

Allows changing supported screen orientations at runtime. This will take priority over the `orientation` key in `app.json`.

On both iOS and Android platforms, changes to the screen orientation will override any system settings or user preferences. On Android, it is possible to change the screen orientation while taking the user's preferred orientation into account. On iOS, user and system settings are not accessible by the application and any changes to the screen orientation will override existing settings.

// TODO(quin): Add some notes here about screen orientation vs physical device orientation w/ diagrams

### Methods

- [`Expo.ScreenOrientation.allowAsync(orientation)`](#exposcreenorientationallowasync)
- [`Expo.ScreenOrientation.lockAsync(orientationLock)`](#exposcreenorientationlockasync)
- [`Expo.ScreenOrientation.unlockAsync()`](#exposcreenorientationunlockasync)
- [`Expo.ScreenOrientation.getOrientationAsync()`](#exposcreenorientationgetorientationasync)
- [`Expo.ScreenOrientation.getOrientationLockAsync()`](#exposcreenorientationgetorientationlockasync)
- [`Expo.ScreenOrientation.getPlatformOrientationLockAsync()`](#exposcreenorientationgetplatformorientationlockasync)
- [`Expo.ScreenOrientation.supportsOrientationLockAsync(orientationLock)`](#exposcreenorientationsupportsOrientationLockAsync)
- [`Expo.ScreenOrientation.lockPlatformAsync()`](#exposcreenorientationlockplatformAsync)
- [`Expo.ScreenOrientation.removeOrientationChangeListeners()`](#exposcreenorientationremoveorientationchangelisteners)
- [`Expo.ScreenOrientation.removeOrientationChangeListener(subscription)`](#exposcreenorientationremoveorientationchangelistener)

### Enum Types

- [`Expo.ScreenOrientation.Orientation`](#exposcreenorientationorientation)
- [`Expo.ScreenOrientation.OrientationLock`](#exposcreenorientationorientationlock)
- [`Expo.ScreenOrientation.iOSSizeClass`](#exposcreenorientationiossizeclass)

### Object Types

- [`Expo.ScreenOrientation.PlatformInfo`](#exposcreenorientationplatforminfo)
- [`Expo.ScreenOrientation.OrientationInfo`](#exposcreenorientationorientationinfo)
- [`EmitterSubscription`](#exposcreenorientationemittersubscription)

### Errors

- [Error Codes](#error-codes)

## Methods

### `Expo.ScreenOrientation.allowAsync(orientationLock)`

Deprecated in favor of `Expo.ScreenOrientation.lockAsync`. Allow a screen orientation.

#### Arguments

- **orientation (_OrientationLock_)** -- The orientation lock to apply. See the `OrientationLock` enum for possible values.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set.

#### Example

```javascript
function changeScreenOrientation() {
  Expo.ScreenOrientation.allowAsync(Expo.ScreenOrientation.Orientation.LANDSCAPE);
}
```

### `Expo.ScreenOrientation.lockAsync(orientationLock)`

Lock the screen orientation to a particular OrientationLock.

#### Arguments

- **orientationLock (_OrientationLock_)** -- The orientation lock to apply. See the `OrientationLock` enum for possible values.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set.

#### Error Codes

- `ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK` - an invalid `OrientationLock` was passed in.
- `ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK` - the platform does not support the orientation lock policy.

#### Example

```javascript
async function changeScreenOrientation() {
  await Expo.ScreenOrientation.lockAsync(Expo.ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
}
```

### `Expo.ScreenOrientation.unlockAsync()`

Sets the screen orientation back to the `OrientationLock.DEFAULT` policy.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set.

### `Expo.ScreenOrientation.getOrientationAsync()`

Gets the current screen orientation.

#### Returns

Returns a promise that resolves to an `OrientationInfo` object value that reflects the current screen orientation.

### `Expo.ScreenOrientation.getOrientationLockAsync()`

Gets the current screen orientation lock type.

#### Returns

Returns a promise with an `OrientationLock` value.

### `Expo.ScreenOrientation.getPlatformOrientationLockAsync()`

Gets the platform specific screen orientation lock type.

#### Returns

Returns a promise with a `PlatformInfo` value.

### `Expo.ScreenOrientation.supportsOrientationLockAsync(orientationLock)`

Returns whether the `OrientationLock` policy is supported on the device.

#### Returns

Returns a promise that resolves to a `boolean` value that reflects whether or not the orientationLock is supported.

### `Expo.ScreenOrientation.lockPlatformAsync(platformInfo)`

#### Arguments

- **platformInfo (_PlatformInfo_)** -- The platform specific lock to apply. See the `PlatformInfo` object type for the different platform formats.

#### Returns

Returns a promise with `void` value, resolving when the orientation is set and rejecting if an invalid option or value is passed.

#### Error Codes

- `ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK` - an invalid `OrientationLock` was passed in.
- `ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK` - the platform does not support the orientation lock policy.

### `Expo.ScreenOrientation.addOrientationChangeListener(listener)`

Invokes the `listener` function when the screen orientation changes.

#### Arguments

- **listener (_Function_)**
  - Object: { orientationInfo: OrientationInfo, orientationLock: OrientationLock }: Each orientation change event will pass an object with the new `OrientationInfo` and `OrientationLock` to the listener.

#### Returns

Returns an `EmitterSubscription` object that can later be used to unsuscribe updates to the listener.

### `Expo.ScreenOrientation.removeOrientationChangeListeners()`

Removes all listeners subscribed to orientation change updates.

### `Expo.ScreenOrientation.removeOrientationChangeListener(subscription)`

Unsuscribes the listener associated with the `subscription` object from all orientation change updates.

#### Arguments

- **subscription (_EmitterSubscription_)**
  - A subscription object that manages the updates passed to a listener function on an orientation change.

## Enum types

### `Orientation`

- **`Orientation.UNKNOWN`** - An unknown screen orientation. For example, the device is flat, perhaps on a table.
- **`Orientation.PORTRAIT`** - Portrait interface orientation (right side up or upside down).
- **`Orientation.PORTRAIT_UP`** - Right-side up portrait interface orientation.
- **`Orientation.PORTRAIT_DOWN`** - Upside down portrait interface orientation.
- **`Orientation.LANDSCAPE`** - Landscape interface orientation (right or left).
- **`Orientation.LANDSCAPE_LEFT`** - Left landscape interface orientation.
- **`Orientation.LANDSCAPE_RIGHT`** - Right landscape interface orientation.

### `OrientationLock`

An enum whose values can be passed to the `lockAsync` method.

- **`OrientationLock.DEFAULT`** -- The default orientation. On iOS, this will allow all orientations except `Orientation.PORTRAIT_DOWN`. On Android, this lets the system decide the best orientation.
- **`OrientationLock.ALL`** -- All four possible orientations
- **`OrientationLock.PORTRAIT`** -- Any portrait orientation.
- **`OrientationLock.PORTRAIT_UP`** -- Right-side up portrait only.
- **`OrientationLock.PORTRAIT_DOWN`** -- Upside down portrait only.
- **`OrientationLock.LANDSCAPE`** -- Any landscape orientation.
- **`OrientationLock.LANDSCAPE_LEFT`** -- Left landscape only.
- **`OrientationLock.LANDSCAPE_RIGHT`** -- Right landscape only.
- **`OrientationLock.OTHER`** -- A platform specific orientation.

### `iOSSizeClass`

Each iOS device has a default set of [size classes](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html) that you can use as a guide when designing your interface.

- **`iOSSizeClass.VERTICAL`**
- **`iOSSizeClass.HORIZONTAL`**
- **`iOSSizeClass.UNKNOWN`**

## Object types

### `PlatformInfo`

    - screenOrientationConstantAndroid (_integer_): A constant to set using the Android native [API](https://developer.android.com/reference/android/R.attr.html#screenOrientation). For example, in order to set the lock policy to [unspecified](https://developer.android.com/reference/android/content/pm/ActivityInfo.html#SCREEN_ORIENTATION_UNSPECIFIED), -1 should be passed in. (Android only)
    - screenOrientationArrayIOS (Array[Orientation]): An array of orientations to allow on the iOS platform (iOS only)

### `OrientationInfo`

    - orientation (_Orientation_): The current orientation of the device
    - verticalSizeClass (_iOSSizeClass_): The [vertical size class](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html) of the device (iOS only)
    - horizontalSizeClass (_iOSSizeClass_): The [horizontal size class](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html) of the device (iOS only)

### `EmitterSubscription`

A React Native [subscription object](https://github.com/facebook/react-native/blob/master/Libraries/vendor/emitter/EmitterSubscription.js).

## Error Codes

| Code                                                | Description                                                 |
| --------------------------------------------------- | ----------------------------------------------------------- |
| ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK | The platform does not support the `OrientationLock` policy. |
| ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK     | An invalid `OrientationLock` was passed in.                 |
