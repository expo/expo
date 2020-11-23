---
title: LocalAuthentication
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-38/packages/expo-local-authentication'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-local-authentication`** allows you to use FaceID and TouchID (iOS) or the Biometric Prompt (Android) to authenticate the user with a face or fingerprint scan.

<PlatformsSection android emulator ios simulator web={{ pending: 'https://github.com/expo/expo/issues/4045' }} />

## Installation

<InstallSection packageName="expo-local-authentication" />

## API

```js
import * as LocalAuthentication from 'expo-local-authentication';
```

## Methods

### `LocalAuthentication.hasHardwareAsync()`

Determine whether a face or fingerprint scanner is available on the device.

#### Returns

Returns a promise resolving to boolean value indicating whether a face or fingerprint scanner is available on this device.

### `LocalAuthentication.supportedAuthenticationTypesAsync()`

Determine what kinds of authentications are available on the device.

#### Returns

Returns a promise resolving to an array containing `LocalAuthentication.AuthenticationType.{FINGERPRINT, FACIAL_RECOGNITION}`. A value of `1` indicates Fingerprint support and `2` indicates Facial Recognition support. Eg: `[1,2]` means the device has both types supported. If neither authentication type is supported, returns an empty array.

### `LocalAuthentication.isEnrolledAsync()`

Determine whether the device has saved fingerprints or facial data to use for authentication.

#### Returns

Returns a promise resolving to boolean value indicating whether the device has saved fingerprints or facial data for authentication.

### `LocalAuthentication.authenticateAsync(options)`

Attempts to authenticate via Fingerprint/TouchID (or FaceID if available on the device).

> **Note:** Apple requires apps which use FaceID to provide a description of why they use this API. If you try to use FaceID on an iPhone with FaceID without providing `infoPlist.NSFaceIDUsageDescription` in `app.json`, the module will authenticate using device passcode. For more information about usage descriptions on iOS, see [Deploying to App Stores](../../../distribution/app-stores.md#system-permissions-dialogs-on-ios).

#### Arguments

- **options (_object_)** -- An object of options.
  - **promptMessage (_string_)** -- A message that is shown alongside the TouchID or FaceID prompt.
  - **cancelLabel (_string_)** -- Allows to customize the default `Cancel` label shown.
  - **fallbackLabel (_string_)** -- Allows to customize the default `Use Passcode` label shown after several failed authentication attempts. Setting this option to an empty string disables this button from showing in the prompt. (**iOS only**)
  - **disableDeviceFallback (_boolean_)** -- After several failed attempts the system will fallback to the device passcode. This setting allows you to disable this option and instead handle the fallback yourself. This can be preferable in certain custom authentication workflows. This behaviour maps to using the iOS [LAPolicyDeviceOwnerAuthenticationWithBiometrics](https://developer.apple.com/documentation/localauthentication/lapolicy/lapolicydeviceownerauthenticationwithbiometrics?language=objc) policy rather than the [LAPolicyDeviceOwnerAuthentication](https://developer.apple.com/documentation/localauthentication/lapolicy/lapolicydeviceownerauthentication?language=objc) policy. Defaults to `false`.

#### Returns

Returns a promise resolving to an object containing `success`, a boolean indicating whether or not the authentication was successful, and `error` containing the error code in the case where authentication fails.

### `LocalAuthentication.cancelAuthenticate()`

**(Android Only)** Cancels authentication flow.
