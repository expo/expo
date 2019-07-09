---
title: LocalAuthentication
---

Use FaceID and TouchID (iOS) or the Fingerprint API (Android) to authenticate the user with a face or fingerprint scan.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-local-authentication`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-local-authentication).

## API

```js
import * as LocalAuthentication from 'expo-local-authentication';
```

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

> **Note:** When using the fingerprint module on Android, you need to provide a UI component to prompt the user to scan their fingerprint, as the OS has no default alert for it.

> **Note:** Apple requires apps which use FaceID to provide a description of why they use this API. If you try to use FaceID on an iPhone with FaceID without providing `infoPlist.NSFaceIDUsageDescription` in `app.json`, the module will authenticate using device passcode. For more information about usage descriptions on iOS, see [Deploying to App Stores](../../distribution/app-stores#system-permissions-dialogs-on-ios).

#### Arguments

- **options (_object_)** -- An object of options.
  - **promptMessage (_string_)** -- A message that is shown alongside the TouchID or FaceID prompt. (**iOS only**)
  - **fallbackLabel (_string_)** -- Allows to customize the default `Use Passcode` label shown after several failed authentication attempts. Setting this option to an empty string disables fallback to device passcode. (**iOS only**)

#### Returns

Returns a promise resolving to an object containing `success`, a boolean indicating whether or not the authentication was successful, and `error` containing the error code in the case where authentication fails.

### `LocalAuthentication.cancelAuthenticate() - (Android Only)`

Cancels the fingerprint authentication flow.
