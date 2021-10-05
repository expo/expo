---
title: Device
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-device'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-device`** provides access to system information about the physical device, such as its manufacturer and model.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-device" />

## API

```js
import * as Device from 'expo-device';
```

## Constants

### `Device.isDevice`

`true` if the app is running on a real device and `false` if running in a simulator or emulator. On web, this always returns `true`.

### `Device.brand`

The device brand. The consumer-visible brand of the product/hardware. On web, this value is `null`.

#### Examples

```js
Device.brand; // Android: "google", "xiaomi"; iOS: "Apple"; web: null
```

### `Device.manufacturer`

The actual device manufacturer of the product or hardware. This value of this field may be `null` if it cannot be determined.

#### Examples

```js
Device.manufacturer; // Android: "Google", "xiaomi"; iOS: "Apple"; web: "Google", null
```

Click [here](https://developer.android.com/reference/android/os/Build) to view the Android documentation about the difference between `brand` and `manufacturer`.

### `Device.modelName`

The human-friendly name of the device model. This is the name that people would typically use to refer to the device rather than a programmatic model identifier. This value of this field may be `null` if it cannot be determined.

#### Examples

```js
Device.modelName; // Android: "Pixel 2"; iOS: "iPhone XS Max"; web: "iPhone", null
```

### `Device.modelId`

**iOS only.** The internal model ID of the device. This is useful for programmatically identifying the type of device and is not a human-friendly string. On web and Android, this value is `null`.

#### Examples

```js
Device.modelId; // iOS: "iPhone7,2"; Android: null; web: null
```

### `Device.designName`

**Android only.** The specific configuration or name of the industrial design. It represents the device's name when it was designed during manufacturing into mass production. On Android, it corresponds to [`Build.DEVICE`](https://developer.android.com/reference/android/os/Build#DEVICE). On web and iOS, this value is `null`.

#### Examples

```js
Device.designName; // Android: "kminilte"; iOS: null; web: null
```

### `Device.productName`

**Android only.** The device's overall product name chosen by the device implementer containing the development name or code name of the device. Corresponds to [`Build.PRODUCT`](https://developer.android.com/reference/android/os/Build#PRODUCT). On web and iOS, this value is `null`.

#### Examples

```js
Device.productName; // Android: "kminiltexx"; iOS: null; web: null
```

### `Device.deviceYearClass`

The [device year class](https://github.com/facebook/device-year-class) of this device. On web, this value is `null`.

### `Device.totalMemory`

The device's total memory, in bytes. This is the total memory accessible to the kernel, but not necessarily to a single app. This is basically the amount of RAM the device has, not including below-kernel fixed allocations like DMA buffers, RAM for the baseband CPU, etc… On web, this value is `null`.

#### Examples

```js
Device.totalMemory; // 17179869184
```

### `Device.supportedCpuArchitectures`

A list of supported processor architecture versions. The device expects the binaries it runs to be compiled for one of these architectures. This value is `null` if the supported architectures could not be determined, particularly on web.

#### Examples

```js
Device.supportedCpuArchitectures; // ['arm64 v8', 'Intel x86-64h Haswell', 'arm64-v8a', 'armeabi-v7a", 'armeabi']
```

### `Device.osName`

The name of the OS running on the device.

#### Examples

```js
Device.osName; // Android: "Android"; iOS: "iOS" or "iPadOS"; web: "iOS", "Android", "Windows"
```

### `Device.osVersion`

The human-readable OS version string. Note that the version string may not always contain three numbers separated by dots.

#### Examples

```js
Device.osVersion; // Android: "4.0.3"; iOS: "12.3.1"; web: "11.0", "8.1.0"
```

### `Device.osBuildId`

The build ID of the OS that more precisely identifies the version of the OS. On Android, this corresponds to `Build.DISPLAY` (not `Build.ID`) and currently is a string as described [here](https://source.android.com/setup/start/build-numbers). On iOS, this corresponds to `kern.osversion` and is the detailed OS version sometimes displayed next to the more human-readable version. On web, this value is `null`.

#### Examples

```js
Device.osBuildId; // Android: "PSR1.180720.075"; iOS: "16F203"; web: null
```

### `Device.osInternalBuildId`

The internal build ID of the OS running on the device. On Android, this corresponds to `Build.ID`. On iOS, this is the same value as [`Device.osBuildId`](#deviceosbuildid). On web, this value is `null`.

#### Examples

```js
Device.osInternalBuildId; // Android: "MMB29K"; iOS: "16F203"; web: null,
```

### `Device.osBuildFingerprint`

**Android only.** A string that uniquely identifies the build of the currently running system OS. On web and iOS, this value is `null`. On Android, it follows this template:

`$(BRAND)/$(PRODUCT)/$(DEVICE)/$(BOARD):$(VERSION.RELEASE)/$(ID)/$(VERSION.INCREMENTAL):$(TYPE)/\$(TAGS)`

#### Examples

```js
Device.osBuildFingerprint;
// Android: "google/sdk_gphone_x86/generic_x86:9/PSR1.180720.075/5124027:user/release-keys";
// iOS: null; web: null
```

### `Device.platformApiLevel`

**Android only.** The Android SDK version of the software currently running on this hardware device. This value never changes while a device is booted, but it may increase when the hardware manufacturer provides an OS update. See [here](https://developer.android.com/reference/android/os/Build.VERSION_CODES.html) to see all possible version codes and corresponding versions. On web and iOS, this value is `null`.

#### Examples

```js
Device.platformApiLevel; // Android: 19; iOS: null; web: null
```

### `Device.deviceName`

The human-readable name of the device, which may be set by the device's user. If the device name is unavailable, particularly on web, this value is `null`.

#### Examples

```js
Device.deviceName; // "Vivian's iPhone XS"
```

## Methods

### `Device.getDeviceTypeAsync()`

Checks the type of the device as a [`Device.DeviceType`](#devicedevicetype) enum value.

On Android, for devices other than TVs, the device type is determined by the screen resolution (screen diagonal size), so the result may not be completely accurate. If the screen diagonal length is between 3" and 6.9", the method returns `DeviceType.PHONE`. For lengths between 7" and 18", the method returns `DeviceType.TABLET`. Otherwise, the method returns `DeviceType.UNKNOWN`.

#### Returns

Returns a promise that resolves to a [`Device.DeviceType`](#devicedevicetype) enum value.

**Examples**

```js
await Device.getDeviceTypeAsync();
// DeviceType.PHONE
```

### `Device.getUptimeAsync()`

Gets the uptime since the last reboot of the device, in milliseconds.

#### Returns

Returns a promise that resolves to a `number` that represents the milliseconds since last reboot. Android devices dp not count time spent in deep sleep. On web, this throws an `UnavailabilityError`.

**Examples**

```js
await Device.getUptimeAsync();
// 4371054
```

### `Device.getMaxMemoryAsync()`

**Android only.** Returns the maximum amount of memory that the Java VM will attempt to use. If there is no inherent limit then `Number.MAX_SAFE_INTEGER` is returned.

#### Returns

Returns a promise that resolves to the maximum available memory that the Java vm will use, in bytes. On iOS and web, this throws an `UnavailabilityError`.

**Examples**

```js
await Device.getMaxMemoryAsync();
// 402653184
```

### `Device.isRootedExperimentalAsync()`

**WARNING:** This method is experimental and is not completely reliable. See description below.

Checks whether the device has been rooted (Android) or jailbroken (iOS). This is not completely reliable because there exist solutions to bypass root-detection on both [iOS](https://www.theiphonewiki.com/wiki/XCon) and [Android](https://tweakerlinks.com/how-to-bypass-apps-root-detection-in-android-device/). Further, many root-detection checks can be bypassed via reverse engineering.

On Android, it's implemented in a way to find all possible files paths that contain the `"su"` executable but some devices that are not rooted may also have this executable. Therefore, there's no guarantee that this method will always return correctly.

On iOS, [these jailbreak checks](https://www.theiphonewiki.com/wiki/Bypassing_Jailbreak_Detection) are used to detect if a device is rooted/jailbroken. However, since there are closed-sourced solutions such as [xCon](https://www.theiphonewiki.com/wiki/XCon) that aim to hook every known method and function responsible for informing an application of a jailbroken device, this method may not reliably detect devices that have xCon or similar packages installed.

On web, this always resolves to `false` even if the device is rooted.

#### Returns

Returns a promise that resolves to a `boolean` that specifies whether this device is rooted.
**Examples**

```js
await Device.isRootedExperimentalAsync();
// true or false
```

### `Device.isSideLoadingEnabledAsync()`

**Android only. Using this method requires you to [add the `REQUEST_INSTALL_PACKAGES` permission](../config/app.md#permissions).**

Returns whether applications can be installed for this user via the system's [Intent#ACTION_INSTALL_PACKAGE](https://developer.android.com/reference/android/content/Intent.html#ACTION_INSTALL_PACKAGE) mechanism rather than through the OS's default app store, like Google Play.

#### Returns

Returns a promise that resolves to a `boolean` that represents whether the calling package is allowed to request package installation. On iOS and web, this throws an `UnavailabilityError`.

**Examples**

```js
await Device.isSideLoadingEnabledAsync();
// true or false
```

### `Device.getPlatformFeaturesAsync()`

**Android only.** Gets a list of features that are available on the system. The feature names are platform-specific. See [here](<https://developer.android.com/reference/android/content/pm/PackageManager#getSystemAvailableFeatures()>) to view Android official docs about this implementation.

#### Returns

Returns a promise that resolves to an array of strings, each of which is a platform-specific name of a feature available on the current device. On iOS and web, this always resolves to an empty array.

**Examples**

```js
await Device.getPlatformFeaturesAsync();
// [
//   'android.software.adoptable_storage',
//   'android.hardware.sensor.accelerometer',
//   'android.software.backup',
//   'android.hardware.touchscreen',
// ]
```

### `Device.hasPlatformFeatureAsync(feature)`

**Android only.** Tells if the device has a specific system feature.

#### Arguments

- **feature (_string_)** -- The platform-specific name of the feature to check for on the device. You can get all available system features with `Device.getSystemFeatureAsync()`. See [here](<https://developer.android.com/reference/android/content/pm/PackageManager#hasSystemFeature(java.lang.String)>) to view acceptable feature strings.

#### Returns

Returns a promise that resolves to a boolean value indicating whether the device has the specified system feature. On iOS and web, this always resolves to `false`.

**Examples**

```js
await Device.hasPlatformFeatureAsync('amazon.hardware.fire_tv');
// true or false
```

## Enums

### `Device.DeviceType`

An enum of the different types of devices supported by Expo, with these values:

- **`UNKNOWN`** -- An unrecognized device type
- **`PHONE`** -- Mobile phone handsets, typically with a touch screen and held in one hand
- **`TABLET`** -- Tablet computers, typically with a touch screen that is larger than a phone's
- **`DESKTOP`** -- Desktop or laptop computers, typically with a keyboard and mouse
- **`TV`** -- TV-based interfaces

## Error Codes

| Code                      | Description                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ERR_DEVICE_ROOT_DETECTION | Error code thrown for `isRootedExperimentalAsync`. This may be thrown if there's no read access to certain system files. |
