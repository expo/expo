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

  Gets the device brand. The consumer-visible brand with which the product/hardware will be associated, if any.

  - iOS: `"Apple"`
  - Android: e.g., `"Xiaomi"`

- `Device.manufacturer: string`

  Gets the actual device manufacturer of the product/hardware.

  - iOS: `"Apple"`
  - Android: e.g., `"HTC"`

  Click [Here](https://developer.android.com/reference/android/os/Build) to view Android official documentation about the difference between `brand` and `manufacturer`.

- `Device.modelName: string`

  **iOS warning**: The list of the model name is maintained by the community and could miss latest devices, so it is better to use `modelId` since it unique identifies new iOS devices and are always up-to-date. We accept new pull request that helps to update the device modelName list.

  Gets the device model.

  - iOS: e.g., `"iPhone XS Max"`
  - Android: e.g., `"Pixel 2"`

- `Device.osName: string`

  Gets the device OS name.

  - iOS: e.g., `"iOS"`
  - Android: e.g., `"Android"`

- `Device.modelId: string` (iOS only)

  Gets the device's mobile device codes types (machine id).

  - iOS: e.g., `"iPhone7,2"`

- `Device.totalMemory: number`

  Gets the device's total memory, in bytes. It means the total memory accessible by the kernel. This is basically the RAM size of the device, not including below-kernel fixed allocations like DMA buffers, RAM for the baseband CPU, etc.

- `Device.isDevice: boolean`

  `true` if the app is running on a device, `false` if running in a simulator or emulator.

- `Device.deviceType: string`

  Returns the device's type as a `Device.deviceType` enum.

- `Device.supportedCPUArchitectures: string[]`

  Returns a list of supported processor architecture versions.

  **Examples**

  ```js
  Device.supportedCPUArchitectures; // [ "arm64 v8", "Intel x86-64h Haswell", "arm64-v8a", "armeabi-v7a", "armeabi" ]
  ```

- `Device.designName: string` (Android only)

  Gets the specific configuration or revision of the industrial design.

  - Android: e.g., `"kminilte"`

- `Device.systemBuildId: string` (Android only)

  Gets the build ID string meant for displaying to the user

  - Android: e.g., `"PSR1.180720.075"`

- `Device.productName: string` (Android only)

  Gets the device's overall product name. Chosen by the device implementer containing the development name or code name of the device.

  - Android: e.g., `"kminiltexx"`

- `Device.platformApiLevel: number` (Android only)

  Gets the SDK version of the software currently running on this hardware device. This value never changes while a device is booted, but it may increase when the hardware manufacturer provides an OTA update. Click [here](https://developer.android.com/reference/android/os/Build.VERSION_CODES.html) to see all possible version codes and corresponding versions.

  - Android: e.g., `19`

- `Device.osVersion: string`

  Gets the user-visible os version number.

  - iOS: e.g., `12.3.1`
  - Android: e.g., `4.0.3`

- `Device.deviceName: string`

  A human-readable name for the device type.

  - eg., `"Vivian's iPhone XS"`

- `Device.osBuildFingerprint: string` (Android only)

  A string that uniquely identifies this build. It must follow the template:

  $(BRAND)/$(PRODUCT)/$(DEVICE)/$(BOARD):$(VERSION.RELEASE)/$(ID)/$(VERSION.INCREMENTAL):$(TYPE)/\$(TAGS)

  - `"google/sdk_gphone_x86/generic_x86:9/PSR1.180720.075/5124027:user/release-keys"`

- `Device.osBuildId: string`

  A string that identifies the build number of the operating system.

  - `"MMB29K"`

## Methods

### `Device.getPlatformFeaturesAsync()` (Android Only)

Get a list of features that are available on the system.

#### Returns

A Promise that resolves to an array of strings, each containing the name of the available feature on the current device system.

**Examples**

```js
await Device.getPlatformFeaturesAsync().then(allFeatures => {
  // Array [
  // "android.software.adoptable_storage",
  // "android.hardware.sensor.accelerometer",
  // "android.software.backup",
  // "android.hardware.touchscreen"
  // ]
});
```

### `Device.hasPlatformFeatureAsync(feature)` (Android Only)

Tells if the device has a specific system feature. Can get all available system features in `Device.getSystemFeatureAsync()`.

#### Arguments

- **feature (_string_)** -- A string of the feature we want to know that the device has.

#### Returns

Returns a `Promise<boolean>` that resolves the `boolean` value for whether the device has the system feature passed to the function.

**Examples**

```js
await Device.hasPlatformFeatureAsync('amazon.hardware.fire_tv'); // true or false
```

### `Device.getMaxMemoryAsync()` (Android Only)

Returns the maximum amount of memory that the Java virtual machine will attempt to use. If there is no inherent limit then the value [Long.MAX_VALUE](https://developer.android.com/reference/java/lang/Long.html#MAX_VALUE) will be returned.

#### Returns

Returns a Promise that resolves the maximum available memory that the Java vm will use, in bytes.

**Examples**

```js
Device.getMaxMemoryAsync().then(maxMemory => {
  // 402653184
});
```

### `Device.isSideLoadingEnabled()` (Android Only)

Whether applications can be installed for this user via the system's [Intent#ACTION_INSTALL_PACKAGE](https://developer.android.com/reference/android/content/Intent.html#ACTION_INSTALL_PACKAGE) mechanism.

#### Returns

Returns a Promise that resolves to a boolean that represents whether the calling package is allowed to request package installation.

**Examples**

```js
Device.isSideLoadingEnabled().then({
  // true or false
});
```

### `Device.getUptimeAsync()`

Gets the uptime since the last reboot of the device, in milliseconds.

#### Returns

Returns a promise that resolves to a number that represents the milliseconds since last reboot, not counting time spent in deep sleep.

**Examples**

```js
Device.getUptimeAsync().then(uptime => {
  // 4371054
});
```

## Enums

### `Device.deviceType`

`deviceType` is a device's type enum. Cross platform values for `deviceType`:

- `Handset` - wired or mobile telephones
- `Tablet` - tablet computers
- `Tv` - televisions
- `Unknown` - unrecognized device type
