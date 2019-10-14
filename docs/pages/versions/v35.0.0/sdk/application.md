---
title: Application
---

This module provides useful information about the native application, such as the its ID, app name, and build version.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-application`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-application).

## API

```js
import * as Application from 'expo-application';
```

### Constants

- [`Application.applicationName`](#applicationapplicationname)
- [`Application.applicationId`](#applicationapplicationid)
- [`Application.nativeApplicationVersion`](#applicationnativeapplicationversion)
- [`Application.nativeBuildVersion`](#applicationnativebuildversion)
- [`Application.androidId`](#applicationandroidid) (Android only)

### Methods

- [`Application.getIosIdForVendorAsync()`](#applicationgetiosidforvendorasync) (iOS only)
- [`Application.getInstallReferrerAsync()`](#applicationgetinstallreferrerasync) (Android only)
- [`Application.getInstallationTimeAsync()`](#applicationgetinstallationtimeasync)
- [`Application.getLastUpdateTimeAsync()`](#applicationgetlastupdatetimeasync) (Android only)

## Constants

### `Application.applicationName`

The human-readable name of the application that is displayed with the app's icon on the device's home screen or desktop. On Android and iOS, this value is a `string` unless the name could not be retrieved, in which case this value will be `null`. On web this value is `null`.

- E.g., `"Expo"`, `"Yelp"`, `"Instagram"`

### `Application.applicationId`

The ID of the application. On Android, this is the application ID. On iOS, this is the bundle ID. On web, this is `null`.

- E.g., `"com.cocoacasts.scribbles"`, `"com.apple.Pages"`

### `Application.nativeApplicationVersion`

The human-readable version of the native application that may be displayed in the app store. This is the `Info.plist` value for `CFBundleShortVersionString` on iOS and the version name set by `version` in app.json on Android at the time the native app was built. On web, this value is `null`.

- E.g., `"2.11.0"`

### `Application.nativeBuildVersion`

The internal build version of the native application that the app store may use to distinguish between different binaries. This is the `Info.plist` value for `CFBundleVersion` on iOS (set with `ios.buildNumber` value in `app.json` in a standalone app) and the version code set by `android.versionCode` in app.json on Android at the time the native app was built. On web, this value is `null`. The return type on Android and iOS is `string`.

- E.g., iOS: `"2.11.0"`, Android: `"114"`

### `Application.androidId`

**Android only.** The value of [`Settings.Secure.ANDROID_ID`](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID). This is a hexademical `string` unique to each combination of app-signing key, user, and device. The value may change if a factory reset is performed on the device or if an APK signing key changes. For more information about how the platform handles `ANDROID_ID` in Android 8.0 (API level 26) and higher, see [Android 8.0 Behavior Changes](https://developer.android.com/about/versions/oreo/android-8.0-changes.html#privacy-all). On iOS and web, this value is `null`.

Note: In versions of the platform lower than Android 8.0 (API level 26), this value remains constant for the lifetime of the user's device. See the [Android_ID](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID) official docs for more information.

- E.g., `"dd96dec43fb81c97"`

## Methods

### `Application.getIosIdForVendorAsync()`

**iOS only.** Gets the iOS "identifier for vendor" [(IDFV)](https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor) value, a string ID that uniquely identifies a device to the app’s vendor. This method may sometimes return `nil`, in which case wait and call the method again later. This might happen when the device has been restarted before the user has unlocked the device.

The OS will change the vendor identifier if all apps from the current app's vendor have been uninstalled.

#### Returns

A `Promise` that resolves to a `string` specifying the app's vendor ID. Apps from the same vendor will return the same ID. See Apple's documentation for more information about the vendor ID's semantics.

**Examples**

```js
await Application.getIosIdForVendorAsync();
// "68753A44-4D6F-1226-9C60-0050E4C00067"
```

### `Application.getInstallReferrerAsync()`

**Android only.** Gets the referrer URL of the installed app with the [`Install Referrer API`](https://developer.android.com/google/play/installreferrer) from the Google Play Store. In practice, the referrer URL may not be a complete, absolute URL.

#### Returns

A `Promise` that resolves to a `string` of the referrer URL of the installed app.

**Examples**

```js
await Application.getInstallReferrerAsync();
// "utm_source=google-play&utm_medium=organic"
```

### `Application.getInstallationTimeAsync()`

Gets the time the app was installed onto the device, not counting subsequent updates. If the app is uninstalled and reinstalled, this method returns the time the app was reinstalled.

On iOS, this method uses the [`NSFileCreationDate`](https://developer.apple.com/documentation/foundation/nsfilecreationdate?language=occ) of the app's document root directory. On Android, this method uses [`PackageInfo.firstInstallTime`](https://developer.android.com/reference/android/content/pm/PackageInfo.html#firstInstallTime). On web, this method returns `null`.

#### Returns

Returns a `Promise` that resolves to a `Date` object that specifies the time the app was installed on the device.

**Examples**

```js
await Application.getInstallationTimeAsync();
// 2019-07-18T18:08:26.121Z
```

### `Application.getLastUpdateTimeAsync()`

**Android only.** Gets the last time the app was updated from the Google Play Store.

#### Returns

Returns a `Promise` that resolves to a `Date` object that specifies the last time the app was updated via the Google Play Store (Android).

**Examples**

```js
await Application.getLastUpdateTimeAsync();
// 2019-07-18T21:20:16.887Z
```

## Error Codes

| Code                                              | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ERR_APPLICATION_PACKAGE_NAME_NOT_FOUND            | Error code thrown by `getInstallationTimeAsync` and `getLastUpdateTimeAsync`. This may be thrown if the package information or package name could not be retrieved.                                                                                                                                                                                                                                |
| ERR_APPLICATION_INSTALL_REFERRER_UNAVAILABLE      | The current Play Store app doesn't provide the installation referrer API, or the Play Store may not be installed. This error code may come up when testing on an AVD that doesn't come with the Play Store pre-installed, such as the Google Pixel 3 and Nexus 6.                                                                                                                             |
| ERR_APPLICATION_INSTALL_REFERRER_CONNECTION       | A connection could not be established to the Google Play Store.                                                                                                                                                                                 |
| ERR_APPLICATION_INSTALL_REFERRER_REMOTE_EXCEPTION | A `RemoteException` was thrown after a connection was established to the Play Store. This may happen if the process hosting the remote object is no longer available, which usually means the process crashed. See https://stackoverflow.com/questions/3156389/android-remoteexceptions-and-services.                                                                                         |
| ERR_APPLICATION_INSTALL_REFERRER                  | General default case error code for the `getInstallReferrerAsync` method. This error code will be thrown if an exception occurred when getting the install referrer, but the exception was none of the more precise errors. The [`responseCode`](https://developer.android.com/reference/com/android/installreferrer/api/InstallReferrerClient.InstallReferrerResponse.html) is provided along with the error. |
| ERR_APPLICATION_INSTALL_REFERRER_SERVICE_DISCONNECTED | Connection to the install referrer service was lost. This error is thrown when an attempt was made to connect and set up the install referrer service, but the connection was lost. See the [Android documentation](https://developer.android.com/reference/com/android/installreferrer/api/InstallReferrerStateListener) for more information. |
