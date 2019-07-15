---
title: Device
---

Provides access to system information about the physical device, such as its manufacturer and model.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-device).

## API

```js
import * as Device from 'expo-device';
```

### Constants

- `Device.brand: string`

  Gets the device brand. The consumer-visible brand of the product/hardware.

  - iOS: `"Apple"`
  - Android: e.g., `"Xiaomi"`

- `Device.manufacturer: string`

  Gets the actual device manufacturer of the product/hardware.

  - iOS: `"Apple"`
  - Android: e.g., `"HTC"`

  Click [here](https://developer.android.com/reference/android/os/Build) to view Android official documentation about the difference between `brand` and `manufacturer`.

- `Device.modelName: string`

  The human-friendly name of the device model. This is the name that people would typically use to refer to the device rather than a programmatic model identifier.

  - iOS: e.g., `"iPhone XS Max"`
  - Android: e.g., `"Pixel 2"`

  **Note for iOS**: The list of model names is manually maintained because iOS does not programmatically expose model names. This manual list may not always have all of the latest devices. Depending on your use case, it may be better to use `Device.modelId`, which is always defined, even for the latest devices.

- `Device.osName: string`

  The name of the OS running on the device.

  - iOS: e.g., `"iOS"` or `"iPadOS"`
  - Android: e.g., `"Android"`

- `Device.modelId: string | null` (iOS only)

  The internal model ID of the device. This is useful for programmatically identifying the type of device and is not a human-friendly string.

  - iOS: e.g., `"iPhone7,2"`

- `Device.totalMemory: number`

  Gets the device's total memory, in bytes. This is the total memory accessible to the kernel, but not necessarily to a single app. This is basically the amount of RAM the device has, not including below-kernel fixed allocations like DMA buffers, RAM for the baseband CPU, etc…

- `Device.isDevice: boolean`

  `true` if the app is running on a real device, `false` if running in a simulator or emulator.

- `Device.supportedCpuArchitectures: string[]`

  Returns a list of supported processor architecture versions. The device expects the binaries it runs to be compiled for one of these architectures. The returned list will be `null` if the supported architectures could not be determined.

  **--**Examples**

  ```js
  Device.supportedCpuArchitectures; // [ "arm64 v8", "Intel x86-64h Haswell", "arm64-v8a", "armeabi-v7a", "armeabi" ]
  ```

- `Device.designName: string | null` (Android only)

  Gets the specific configuration or name of the industrial design. It represents the device's name when it was designed during manufacturing into mass production. On Android, it corresponds to `Build.DESIGN`.

  - Android: e.g., `"kminilte"`

- `Device.productName: string` (Android only)

  The device's overall product name chosen by the device implementer containing the development name or code name of the device. Corresponds to [`Build.PRODUCT`](https://developer.android.com/reference/android/os/Build#PRODUCT).


  - Android: e.g., `"kminiltexx"`

- `Device.osBuildId: string`

  The build ID of the OS that more precisely identifies the version of the OS. On Android, this corresponds to `Build.DISPLAY` (not `Build.ID`) and currently is a string as described [here](https://source.android.com/setup/start/build-numbers). On iOS, this corresponds to `kern.osversion` and is the detailed OS version sometimes displayed next to the more human-readable version.

  - Android: e.g., `"PSR1.180720.075"`
  - iOS: e.g., `"16F203"`

- `Device.osInternalBuildId: string`

  The internal build ID of the OS running on the device. On Android, this corresponds to `Build.ID`. On iOS, this is the same value as [`Device.osBuildId`](#deviceosbuildid).

  - Android: e.g., `"MMB29K"`
  - iOS: e.g., `"16F203"`

- `Device.platformApiLevel: number | null` (Android only)

  The SDK version of the software currently running on this hardware device. This value never changes while a device is booted, but it may increase when the hardware manufacturer provides an OS update. See [here](https://developer.android.com/reference/android/os/Build.VERSION_CODES.html) to see all possible version codes and corresponding versions.

  - Android: e.g., `19`

- `Device.osVersion: string`

  The human-readable OS version string. Note that the version string may not always contain three numbers separated by dots.

  - iOS: e.g., `12.3.1`
  - Android: e.g., `4.0.3`

- `Device.deviceName: string`

  The human-readable name of the device, which may be set by the device's user.

  - e.g., `"Vivian's iPhone XS"`

- `Device.osBuildFingerprint: string | null` (Android only)

  A string that uniquely identifies the build of the currently running system OS. On Android, it follows this template:

  `$(BRAND)/$(PRODUCT)/$(DEVICE)/$(BOARD):$(VERSION.RELEASE)/$(ID)/$(VERSION.INCREMENTAL):$(TYPE)/\$(TAGS)`

  - e.g., `"google/sdk_gphone_x86/generic_x86:9/PSR1.180720.075/5124027:user/release-keys"`

- `Device.deviceYearClass: numer`

  The [device year class](https://github.com/facebook/device-year-class) of this device.

## Methods

### `Device.getPlatformFeaturesAsync()` (Android only)

Get a list of features that are available on the system. The feature names are platform-specific.

#### Returns

A Promise that resolves to an array of strings, each of which is a platform-specific name of a feature available on the current device.

**Examples**

```js
await Device.getPlatformFeaturesAsync();
  // Array [
  // "android.software.adoptable_storage",
  // "android.hardware.sensor.accelerometer",
  // "android.software.backup",
  // "android.hardware.touchscreen"
  // ]
```

### `Device.hasPlatformFeatureAsync(feature: string)` (Android only)

Tells if the device has a specific system feature. Can get all available system features in `Device.getSystemFeatureAsync()`.

#### Arguments

- **feature (_string_)** -- A string of the feature we want to know that the device has.

#### Returns

Returns a `Promise<boolean>` that resolves to a `boolean` value indicating whether the device has the specified system feature.

**Examples**

```js
await Device.hasPlatformFeatureAsync('amazon.hardware.fire_tv'); // true or false
```

### `Device.getMaxMemoryAsync()` (Android only)

Returns the maximum amount of memory that the Java virtual machine will attempt to use. If there is no inherent limit then `Number.MAX_SAFE_INTEGER` is returned.

#### Returns

Returns a Promise that resolves the maximum available memory that the Java vm will use, in bytes.

**Examples**

```js
await Device.getMaxMemoryAsync();
  // 402653184
```

### `Device.isSideLoadingEnabled()` (Android only)

Returns whether applications can be installed for this user via the system's [Intent#ACTION_INSTALL_PACKAGE](https://developer.android.com/reference/android/content/Intent.html#ACTION_INSTALL_PACKAGE) mechanism rather than through the OS's default app store, like Google Play.

#### Returns

Returns a Promise that resolves to a boolean that represents whether the calling package is allowed to request package installation.

**Examples**

```js
await Device.isSideLoadingEnabled();
  // true or false
```

### `Device.getUptimeAsync()`

Gets the uptime since the last reboot of the device, in milliseconds.

#### Returns

Returns a promise that resolves to a number that represents the milliseconds since last reboot. Android devices does not count time spent in deep sleep.

**Examples**

```js
await Device.getUptimeAsync();
  // 4371054
```

### `Device.isRootedExperimentalAsync()`

Checks whether the device has been rooted (Android) or jailbroken (iOS). This is not completely reliable because there exist solutions to bypass root-detection on both [iOS](https://www.theiphonewiki.com/wiki/XCon) and [Android](https://tweakerlinks.com/how-to-bypass-apps-root-detection-in-android-device/). Further, many root-detection checks can be bypassed via reverse engineering.

In Android, it's implemented in a way to find all possible files paths that contain the `"su"` executable but some devices that are not rooted may also have this executable. Therefore, there's no guarantee that this method will always return correctly.

On iOS, the jailbreak checks outlined on (https://www.theiphonewiki.com/wiki/Bypassing_Jailbreak_Detection) are used to detect if a device is rooted/jailbroken. However, since there are closed-sourced solutions such as [xCon](https://www.theiphonewiki.com/wiki/XCon) that aim to hook every known method and function responsible for informing an application of a jailbroken device, this method may not reliable to detect devices that have xCon or similar packages installed.  

#### Returns

Returns a promise that resolves to a boolean that specifies whether this device is rooted. On web, the boolean is always `false`.

**Examples**

```js
await Device.isRootedExperimentalAsync();
  // false/true
```

### `Device.getDeviceTypeAsync()`

Checks the type of the device as a [`Device.DeviceType`](#devicedevicetype) enum value.

#### Returns

Returns the type of the device as a [`Device.DeviceType`](#devicedevicetype) enum value.

**Examples**

```js
await Device.getDeviceTypeAsync();
  // DeviceType.PHONE
```

## Enums

### `Device.DeviceType`

An enum of the different types of devices supported by Expo, with these values:

- **`PHONE`** -- Mobile phone handsets, typically with a touch screen and held in one hand
- **`TABLET`** -- Tablet computers, typically with a touch screen that is larger than a phone's
- **`DESKTOP`** -- Desktop or laptop computers, typically with a keyboard and mouse
- **`TV`** -- TV-based interfaces
- **`UNKNOWN`** -- An unrecognized device type
