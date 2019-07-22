---
title: Application
---

This module provides useful information about the native application, such the its ID, app name, and build version.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-device).

## API

```js
import * as Application from 'expo-application';
```

### Constants

- [`Application.applicationName`](#applicationapplicationname)
- [`Application.bundleId`](#applicationbundleid)
- [`Application.nativeAppVersion`](#applicationnativeappversion)
- [`Application.nativeBuildVersion`](#applicationnativebuildversion)
- [`Application.androidId`](#applicationandroidid) (Android only)

### Methods

- [`Application.getIosIdForVendorAsync()`](#applicationgetiosidforvendorasync) (iOS only)
- [`Application.getInstallReferrerAsync()`](#applicationgetinstallreferrerasync) (Android only)
- [`Application.getFirstInstallTimeAsync()`](#applicationgetfirstinstalltimeasync)
- [`Application.getLastUpdateTimeAsync()`](#applicationgetlastupdatetimeasync) (Android only)

## Constants

### `Application.applicationName`

The human-readable name of the application that is displayed with the app's icon on the device's home screen or desktop. On Android and iOS, this value is a `string` unless the name could not be retrieved, in which case this value will be `null`. On web this value is `null`.

- e.g., `Expo`, `Yelp`, `Instagram`

### `Application.bundleId`

The ID of the application. On Android, this is the application ID. On iOS, this is the bundle ID. On web, this is `null`.

- e.g., `com.cocoacasts.scribbles`, `com.apple.Pages`

### `Application.nativeApplicationVersion`

The human-readable version of the native application that may be displayed in the app store. This is the `Info.plist` value for `CFBundleShortVersionString` on iOS and the version name set by `version` in app.json on Android at the time the native app was built. On web, this value is `null`.


- e.g., `2.11.0`

### `Application.nativeBuildVersion`

The internal build version of the native application that the app store may use to distinguish between different binaries. This is the `Info.plist` value for `CFBundleVersion` on iOS (set with `ios.buildNumber` value in `app.json` in a standalone app) and the version code set by `android.versionCode` in app.json on Android at the time the native app was built. On web, this value is `null`.


- e.g., `2.11.0.16344`

### `Application.androidId`

**Android only.** The value of [`Settings.Secure.ANDROID_ID`](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID). This is a hexademical `string` unique to each combination of app-signing key, user, and device. The value may change if a factory reset is performed on the device or if an APK signing key changes. For more information about how the platform handles `ANDROID_ID` in Android 8.0 (API level 26) and higher, see [Android 8.0 Behavior Changes.](https://developer.android.com/about/versions/oreo/android-8.0-changes.html#privacy-all) On iOS and Web, this value is `null`.

Note: In versions of the platform lower than Android 8.0 (API level 26), this value remains constant for the lifetime of the user's device. See [Android_ID](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID) official docs for more information.

- e.g., `"dd96dec43fb81c97"`

## Methods

### `Application.getIosIdForVendorAsync()`

**iOS only.** Gets the iOS identifier for vender [(IDFV)](https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor) value, an alphanumeric string that uniquely identifies a device to the app’s vendor. If returned value is `nil`, wait and retrieve this value later. This might happen when the device has been restarted before the user has unlocked the device.

The OS will change the vendor identifier if all apps from the current apps vendor have been uninstalled.

#### Returns

A `Promise` that resolves to a `string` of the IDFV for the app.

**Examples**

```js
await Application.getIosIdForVendorAsync();
// "FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9"
```

### `Application.getInstallReferrerAsync()`

**Android only.** Gets the referrer URL of the installed app with the [`Install Referrer API`](https://developer.android.com/google/play/installreferrer) from the Google Play Store.

#### Returns

A `Promise` that resolves to a `string` of the referrer URL of the installed app.

**Examples**

```js
await Application.getInstallReferrerAsync();
// "utm_source=google-play&utm_medium=organic"
```

### `Application.getFirstInstallTimeAsync()`

Gets the time the app was first installed onto the device. The time would change to the reinstalled date if uninstall and reinstall the app.

On iOS, it depends on the [`NSFileCreationDate`](https://developer.apple.com/documentation/foundation/nsfilecreationdate?language=occ) of the app's document root directory. On Android, it depends on the [`PackageInfo.firstInstallTime`](https://developer.android.com/reference/android/content/pm/PackageInfo.html#firstInstallTime).

#### Returns

Returns a `Promise` that resolves to a `Date` object that represents the first time the app was installed on the device.

**Examples**

```js
await Application.getFirstInstallTimeAsync();
// 2019-07-18T18:08:26.121Z
```

### `Application.getLastUpdateTimeAsync()`

**Android only.** Gets the last time the app was updated from the Google Play Store.

#### Returns

Returns a `Promise` that resolves to a `Date` object that represents the last time the app was updated via the Google Play Store (Android).

**Examples**

```js
await Application.getLastUpdateTimeAsync();
// 2019-07-18T21:20:16.887Z
```

## Error Codes

| Code                                                | Description                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ERR_APPLICATION_PACKAGE_NAME_NOT_FOUND | Error code thrown for `firstInstallTimeAsync` and `lastUpdateTimeAsync`. This may be thrown if the package information or package name could not be retrieved. |
| ERR_APPLICATION_INSTALL_REFERRER_UNAVAILABLE | The current Play Store app doesn't provide the installation referrer API, or the Play Store may not be installed. This error code may come up when testing on an AVD that doesn't come with the Play Store pre-installed, such as the Google Pixel 3 and Nexus 6. |
| ERR_APPLICATION_INSTALL_REFERRER_CONNECTION | A connection could not be established to the Google Play Store |
| ERR_APPLICATION_INSTALL_REFERRER_REMOTE_EXCEPTION | A `RemoteException` was thrown after a connection was established to the Play Store. This may happen if the process hosting the remote object is no longer available, which usually means the process crashed. See https://stackoverflow.com/questions/3156389/android-remoteexceptions-and-services. |
| ERR_APPLICATION_INSTALL_REFERRER | General default case error code for the `getInstallReferrerAsync` method. This error code will be thrown if an exception occured for the install referrer, but the exception was none of the errors above.  |

