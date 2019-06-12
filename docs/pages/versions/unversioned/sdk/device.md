---
title: Device
---

Provide information of devices on the application.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. It is not yet available for [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native apps.

## API

```js
import { Device } from 'expo';
```

### Constants

#### `Device.brand: string`

Gets the device brand.

#### `Device.carrier: string`

Gets the carrier name (network operator).

#### `Device.manufacturer: string`

Gets the device manufacturer.

#### `Device.model: string`

**iOS warning**: The list with device names is maintained by the community and could lag new devices. It is recommended to use `getDeviceId()` since it's more reliable and always up-to-date with new iOS devices. We do accept pull requests that add new iOS devices to the list with device names.

Gets the device model.

#### `Device.phoneNumber: string` (Android Only)

Gets the device phone number.

#### `Device.serialNumber: string` (Android Only)

Gets the device serial number.

#### `Device.systemName: string`

Gets the device OS name.

#### `Device.deviceId: string`

Gets the device ID.

#### `Device.totalDiskCapacity: number`

Gets full disk storage size, in bytes.

#### `Device.totalMemory: number`

Gets the device total memory, in bytes.

#### `Device.uniqueId: string`

Gets the device unique ID.

#### `Device.isTablet: boolean`

Tells if the device is a tablet.

#### `Device.deviceType: string`

Returns the device's type as a string, which will be one of:

- `Handset`
- `Tablet`
- `Tv`
- `Unknown`

#### `Device.supportedABIs: string[]`

Returns a list of supported processor architecture version

**Examples**

```js
Device.supportedABIs; // [ "arm64 v8", "Intel x86-64h Haswell", "arm64-v8a", "armeabi-v7a", "armeabi" ]
```

### Methods

- `Device.hasNotch()`
- `Device.hasSystemFeatureAsync(feature)` (Android only)
- `Device.getIPAddressAsync()`
- `Device.getMACAddressAsync()`
- `Device.isAirplaneModeAsync()` (Android only)
- `Device.isPinOrFingerprintSet()`
- `Device.getFreeDiskStorageAsync()`
- `Device.getUserAgentAsync()`

## Methods

### `Device.hasNotch()`

Tells if the device has a notch.

#### Returns

A boolean that represents the support for notch display.

**Examples**

```js
const hasNotch = Device.hasNotch();
```

### `Device.getUserAgentAsync()`

Gets the device User Agent.

#### Returns

A Promise that resolves to a string of User Agent.

**Examples**

```js
Device.getUserAgentAsync().then(userAgent => {
  //Dalvik/2.1.0 (Linux; U; Android 9; Pixel 2 Build/PQ3A.190505.001)
});
```

### `Device.getFreeDiskStorageAsync()`

Gets available storage size, in bytes.

#### Returns

A promise of string that represents the storage size.

**Examples**

```js
Device.getFreeDiskStorageAsync().then(storage => {
  //'5608296448'
});
```

### `Device.getIPAddressAsync()`

Gets the device current IP address.

#### Returns

A Promise that resolves to a string of IP address.

**Examples**

```js
Device.getIPAddressAsync().then(ip => {
  // "92.168.32.44"
});
```

### `Device.getMACAddressAsync()`

Gets the network adapter MAC address.

#### Returns

A Promise that resolves to a string of the network adapter MAC address.

**Examples**

```js
Device.getMACAddressAsync().then(mac => {
  // "E5:12:D8:E5:69:97"
});
```

### `Device.isAirplaneModeAsync()` (Android Only)

Tells if the device is in AirPlaneMode.

#### Returns

Returns a `Promise<boolean>` that resolves to the `boolean` value for whether the device is in airplane mode or not.

**Examples**

```js
Device.isAirPlaneModeAsync().then(airPlaneModeOn => {
  // false
});
```

### `Device.hasSystemFeatureAsync(feature)` (Android Only)

Tells if the device has a specific system feature.

#### Arguments

- **feature (_string_)** -- A string of the feature we want to know that the device has.

#### Returns

Returns a `Promise<boolean>` that resolves the `boolean` value for whether the device has the system feature passed to the function.

**Examples**

```js
Device.hasSystemFeatureAsync('amazon.hardware.fire_tv').then(hasFeature => {
  // true or false
});
```

### `Device.isPinOrFingerprintSet()`

Tells if a PIN number or a fingerprint was set for the device.

#### Returns

Returns a `Promise<boolean>` that resolves the `boolean` value for whether the device has set a Pin or Fingerprint.

**Examples**

```js
Device.isPinOrFingerprintSet()(isPinOrFingerprintSet => {
    // true or false
  }
});
```
