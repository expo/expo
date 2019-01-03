---
title: Constants
---

System information that remains constant throughout the lifetime of your app.

### `Expo.Constants.appOwnership`

Returns `expo`, `standalone`, or `guest`. If `expo`, the experience is running inside of the Expo client. If `standalone`, it is a [standalone app](../guides/building-standalone-apps.html#building-standalone-apps). If `guest`, it has been opened through a link from a standalone app.

### `Expo.Constants.expoVersion`

The version string of the Expo client currently running.

### `Expo.Constants.deviceId`

An identifier that is unique to this particular device and installation of the Expo client.

### `Expo.Constants.deviceName`

A human-readable name for the device type.

### `Expo.Constants.deviceYearClass`

The [device year class](https://github.com/facebook/device-year-class) of this device.

### `Expo.Constants.getWebViewUserAgentAsync()`

Gets the user agent string which would be included in requests sent by a web view running on this device. This is probably not the same user agent you might be providing in your JS `fetch` requests.

### `Expo.Constants.isDevice`

`true` if the app is running on a device, `false` if running in a simulator or emulator.

### `Expo.Constants.platform`

- `ios`

  - `buildNumber`

    The build number specified in the embedded `Info.plist` value for `CFBundleVersion` in this app.
    In a standalone app, you can set this with the `ios.buildNumber` value in `app.json`. This
    may differ from the value in `Expo.Constants.manifest.ios.buildNumber` because the manifest
    can be updated over the air, whereas this value will never change for a given native binary.

  - `platform`

    The Apple internal model identifier for this device, e.g. `iPhone1,1`.

  -  `model`

    The human-readable model name of this device, e.g. `iPhone 7 Plus`.

  -  `userInterfaceIdiom`

    The user interface idiom of this device, i.e. whether the app is running on an iPhone or an iPad. Current supported values are `handset` and `tablet`. Apple TV and CarPlay will show up as `unsupported`.

  -  `systemVersion`

    The version of iOS running on this device, e.g. `10.3`.

- `android`

  - `versionCode`

    The version code set by `android.versionCode` in app.json.

### `Expo.Constants.sessionId`

A string that is unique to the current session of your app. It is different across apps and across multiple launches of the same app.

### `Expo.Constants.statusBarHeight`

The default status bar height for the device. Does not factor in changes when location tracking is in use or a phone call is active.

### `Expo.Constants.systemFonts`

A list of the system font names available on the current device.

### `Expo.Constants.manifest`

The [manifest](../guides/how-expo-works.html#expo-manifest) object for the app.

### `Expo.Constants.linkingUri`

When an app is opened due to a deep link, the prefix of the URI without the deep link part. This value depends on `Expo.Constants.appOwnership`: it may be different if your app is running standalone vs. in the Expo client.
