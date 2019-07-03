---
title: Device
---

Provide an API to play with the device's system physical information that uniquely associated with the device's hardware and software properties.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-device).

## API

```js
import * as Device from 'expo-device';
```

### Constants

- `Device.brand: string`

  Gets the device brand.

  - iOS: `"Apple"`
  - Android: e.g., `"Xiaomi"`

- `Device.carrier: string`

  Gets the carrier's name (network operator).

- `Device.manufacturer: string`

  Gets the device manufacturer.

  - iOS: `"Apple"`
  - Android: e.g., `"Google"`

- `Device.model: string`

  **iOS warning**: The list with device names is maintained by the community and could lag new devices. It is recommended to use `deviceId` since it's more reliable and always up-to-date with new iOS devices. We do accept pull requests that add new iOS devices to the list with device names.

  Gets the device model.

  - iOS: e.g., `"iPhone XS Max"`
  - Android: e.g., `"Pixel 2"`

- `Device.systemName: string`

  Gets the device OS name.

  - iOS: e.g., `"iOS"`
  - Android: e.g., `"Android"`

- `Device.deviceId: string` (iOS only)

  Gets the device's mobile device codes types (machine id).

  - iOS: e.g., `"iPhone7,2"`

* `Device.totalMemory: number`

  Gets the device's total memory, in bytes.

* `Device.uniqueId: string`

  Gets the device unique ID.

  **iOS**: This is IDFV or a random string if IDFV is unavaliable. UIS is stored in the iOS Keychain and NSUserDefaults. It can be carefully considered as constant cross-install unique identifier. But it could be manually changed if people override the value or Apple changed their implementationin iOS Keychain and NSUserDefaults.

  **Android**: Prior to Oreo, this 64-bit number should remain constant for the lifetime of a device. It's a randomly generated value on the device's first boot.

  - iOS: e.g., `"FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9"`
  - Android: e.g., `"dd96dec43fb81c97"`

* `Device.isTablet: boolean`

  Tells if the device is a tablet.

* `Device.deviceType: string`

  Returns the device's type as a string, which will be one of:

  - `Handset`
  - `Tablet`
  - `Tv`
  - `Unknown`

* `Device.supportedABIs: string[]`

  Returns a list of supported processor architecture versions.

  **Examples**

  ```js
  Device.supportedABIs; // [ "arm64 v8", "Intel x86-64h Haswell", "arm64-v8a", "armeabi-v7a", "armeabi" ]
  ```

## Methods

### `Device.hasNotch()`

Tells if the device has a notch.

#### Returns

A boolean value that specifies whether the device's main display has a notch.

**Examples**

```js
import { hasNotch } from 'expo-device';

hasNotch(); // true or false
```

### `Device.getUserAgentAsync()`

Gets the device User Agent.

#### Returns

A Promise of string that represents the device user agent.

**Examples**

```js
Device.getUserAgentAsync().then(userAgent => {
  //Dalvik/2.1.0 (Linux; U; Android 9; Pixel 2 Build/PQ3A.190505.001)
});
```

### `Device.getIpAddressAsync()`

Gets the device's current IP address.

#### Returns

A Promise that resolves the current IP address of the device's main network interface, as a string. Can only be IPv4 address.

**Examples**

```js
Device.getIpAddressAsync().then(ip => {
  // "92.168.32.44"
});
```

### `Device.getMACAddressAsync(interfaceName?: string)`

Gets the specified network interface's MAC address.

#### Arguments (Android Only)

- **interfaceName (_string_)** -- A string representing interface name (`eth0`, `wlan0`) or `null`, meaning the method should fetch the MAC address of the first available interface. (On iOS this argument is ignored.) If undefined interface name passed in, the method would reject the promise with corresponding message.

#### Returns

A Promise that resolves to a string of the network adapter MAC address or return `null` if there's no such address matching the interface.

**Examples**

```js
//iOS
Device.getMACAddressAsync().then(mac => {
  // "E5:12:D8:E5:69:97"
});

//Android
Device.getMACAddressAsync('wlan0').then(mac => {
  // "E5:12:D8:E5:69:97"
});
```

### `Device.isAirplaneModeEnabledAsync()` (Android Only)

Tells if the device is in airplane mode.

#### Returns

Returns a Promise that resolves to the `boolean` value for whether the device is in airplane mode or not.

**Examples**

```js
Device.isAirplaneModeEnabledAsync().then(airplaneModeOn => {
  // false
});
```

### `Device.getSystemAvailableFeaturesAsync()` (Android Only)

Get a list of features that are available on the system.

#### Returns

A Promise that resolves to an array of strings, each containing the name of the available feature on the current device system.

**Examples**

```js
await Device.getSystemAvailableFeaturesAsync().then(allFeatures => {
  // Array [
  // "android.software.adoptable_storage",
  // "android.hardware.sensor.accelerometer",
  // "android.software.backup",
  // "android.hardware.touchscreen"
  // ]
});
```

### `Device.hasSystemFeatureAsync(feature)` (Android Only)

Tells if the device has a specific system feature. Can get all available system features in `Device.getSystemAvailableFeaturesAsync()`.

#### Arguments

- **feature (_string_)** -- A string of the feature we want to know that the device has.

#### Returns

Returns a `Promise<boolean>` that resolves the `boolean` value for whether the device has the system feature passed to the function.

**Examples**

```js
await Device.hasSystemFeatureAsync('amazon.hardware.fire_tv'); // true or false
```

### `Device.hasLocalAuthenticationAsync()`

Tells if the device is secured by a PIN, pattern or password or a SIM card is currently locked. Can be used to check locked screen or payments.

#### Returns

Returns a Promise that resolves the `boolean` value for whether the device has set a PIN, pattern or password or a SIM card is currently locked.

**Examples**

```js
Device.hasLocalAuthenticationAsync()(hasLocalAuthentication => {
    // true or false
  }
});
```
