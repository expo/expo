---
title: Upgrading Expo SDK Walkthrough
---

If you are a couple of versions behind, upgrading your projects Expo SDK version can be difficult because of the amount of breaking changes and deprecations in each upgrade. Don't worry, here are all the breaking changes in each SDK version upgrade.

Expo only provides support for the last 6 versions since the latest version.

## SDK 31

#### Upgrade from SDK 30

- `app.json`, change `sdkVersion` to `"31.0.0"`,
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-31.0.0.tar.gz",
  "expo": "^31.0.0",
  "react": "16.5.0"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- There are several small breaking API changes with this release. See the [changelog](https://github.com/expo/expo/blob/master/CHANGELOG.md#3100-partial-changelog) for the full list.

## SDK 30

#### Upgrade from SDK 29

- `app.json`, change `sdkVersion` to `"30.0.0"`,
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-30.0.0.tar.gz",
  "expo": "^30.0.0",
  "react": "16.3.1"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- `Fingerprint` has been renamed to `LocalAuthentication`

## SDK 29

#### Upgrade from SDK 28

- `app.json`, change `sdkVersion` to `"29.0.0"`,
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-29.0.0.tar.gz",
  "expo": "^29.0.0",
  "react": "16.3.1"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- Some field names in `Contacts` were changed. See the [documentation](../../sdk/contacts) for more information.

## SDK 28

#### Upgrade from SDK 27

- `app.json`, change `sdkVersion` to `"28.0.0"`,
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-28.0.0.tar.gz",
  "expo": "^28.0.0",
  "react": "16.3.1"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- Android apps on all SDK versions now require notification channels for push notifications. This may impact you even if you don’t yet use SDK 28. [Read this blog post](https://blog.expo.io/breaking-change-coming-to-android-apps-3116927f0424) for all of the necessary information.
- Android app icons are now coerced into adaptive icons. Be sure to test your app icon and supply an adaptive icon if needed. [Read this blog post](https://blog.expo.io/adaptive-launcher-icons-coming-to-expo-android-apps-7b9191eea6c1) for all of the necessary information.
- Print has been moved out of DangerZone; update your imports accordingly.

## SDK 27

#### Upgrade from SDK 26

- In app.json, change sdkVersion to `"27.0.0"`
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-27.0.0.tar.gz",
  "expo": "^27.0.0",
  "react": "16.3.1"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- `View.propTypes` has been removed from React Native, so if your code (or any of your dependent libraries) uses it, that will break. Use `ViewPropTypes` instead. We strongly recommend running your app with the dev flag disabled to test whether it’s affected by this change.
- We changed the format of `Constants.linkingUri` (see Linking changes above), so if your code makes assumptions about this, you should double check that.
- [Camera roll permissions](/versions/latest/sdk/permissions/#expopermissionscamera_roll) are now required to use ImagePicker.launchCameraAsync() and ImagePicker.launchImageLibraryAsync(). You can ask for them by calling `Permissions.askAsync(Permissions.CAMERA_ROLL)`.

## SDK 26

#### Upgrade from SDK 25

- In app.json, change sdkVersion to `"26.0.0"`
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-26.0.0.tar.gz",
  "expo": "^26.0.0",
  "react": "16.3.0-alpha.1"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- `Expo.Util` is deprecated, functionality has been moved out to `Expo.DangerZone.Localization` and `Expo.Updates`.
- `ios.loadJSInBackgroundExperimental` is now deprecated, use the new `Updates` API instead. The equivalent of this configuration is `updates.fallbackToCacheTimeout: 0`.
- `isRemoteJSEnabled` is also deprecated, use `updates.enabled` instead.
- React Native 0.54 depends on React 16.3.0-alpha.1. React 16.3 deprecates the usage of `componentWillMount`, `componentWillReceiveProps`, and `componentWillUpdate`. These have been replaced with static lifecycle methods: `getDerivedStateFromProps` and `getSnapshotBeforeUpdate`, but only `getDerivedStateFromProps` is available in 16.3.0-alpha.1.
- On iOS, `WebBrowser.dismissBrowser()` promise now resolves with `{type:'dismiss}` rather than `{type:'dismissed'}` to match Android
- AdMob [method name changes](https://github.com/expo/expo/commit/e3f021436785959d4b224859fe0343f88c4774d8). `requestAd` to `requestAdAsync`, `showAd` to `showAdAsync`, `isReady` to `getIsReadyAsync`.
- On iOS, Contacts `urls` was renamed to `urlAddresses` to match Android. [Related commit](https://github.com/expo/expo/commit/18f542f1de549d132438c53af1c955e7f1cf6286).
- On iOS, calling `Notifications.getExpoPushToken()` will throw an error if you don’t have permission to send notifications. We recommend call `Permissions.getAsync(Permissions.NOTIFICATIONS)` and, if needed and you haven’t asked before, `Permissions.askAsync(Permissions.NOTIFICATIONS)` before getting push token.
- React native 0.53.0 removed the TextInput autoGrow prop. [Commit](https://github.com/facebook/react-native/commit/dabb78b1278d922e18b2a84059460689da12578b#diff-b48972356bc8dca4a00747d002fc3dd5).

## SDK 25

#### Upgrade from SDK 24

- In app.json, change sdkVersion to `"25.0.0"`
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-25.0.0.tar.gz",
  "expo": "^25.0.0",
  "react": "16.2.0"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- If you have any scripts in your project that depend on `metro-bundler`, you will need to change those to `metro` ([related commit](https://github.com/facebook/metro/commit/0f7ad193c75183eeff1b356644ccf22b0813bb04)). A likely place for this is in `rn-cli.config.js`.
- Although not technically part of the SDK, React Navigation is commonly used by Expo users, and it’s worth mentioning that on Android React Navigation now properly accounts for the translucent status bar. This may require you to remove code that you have to workaround that (maybe a paddingTop somewhere to avoid the content from rendering underneath the status bar). [Read the React Navigation release notes for more information](https://github.com/react-navigation/react-navigation/releases/tag/v1.0.0-beta.26). Only applies to `react-navigation@1.0.0-beta.26` and higher.

## SDK 24

#### Upgrade from SDK 23

- In app.json, change sdkVersion to `"24.0.0"`
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-24.0.0.tar.gz",
  "expo": "^24.0.0",
  "react": "16.0.0"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

The following APIs have been removed after being deprecated for a minimum of 2 releases:

- `Expo.LegacyAsyncStorage`
- `Expo.Font.style`
- Passing an object into `Expo.SQLite.openDatabase()` instead of separate arguments is no longer supported.

## SDK 23

#### Upgrade from SDK 22

- In app.json, change sdkVersion to `"23.0.0"`
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-23.0.0.tar.gz",
  "expo": "^23.0.0",
  "react": "16.0.0"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

- React Native no longer supports nesting components inside of `<Image>` — some developers used this to use an image as a background behind other views. To fix this in your app, replace the `Image` component anywhere where you are nesting views inside of it with the `ImageBackground` component. [See a Snack example here](https://snack.expo.io/@notbrent/imagebackground-example).

- React Native now defaults `enableBabelRCLookup` (recursive) to false in Metro bundler (the packager used by React Native / Expo). This is unlikely to cause any problems for your application — in our case, this lets us remove a script to delete nested `.babelrc` files from `node_modules` in our postinstall. If you run into transform errors when updating your app, [read this commit message for more information](https://github.com/facebook/react-native/commit/023ac57337b351959d443133c3c09607c4ffc800) and to see how to opt-in to the old behavior.

## SDK 22

#### Upgrade from SDK 21

- In app.json, change sdkVersion to `"22.0.0"`
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-22.0.1.tar.gz",
  "expo": "^22.0.0",
  "react": "16.0.0-beta.5"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

Metro Bundler (the React Native packager) now errors (instead of silently ignoring) dynamic requires. In particular this breaks an older version of moment.js if you were using that (or indirectly depending on it).

- This is a known issue with Metro [which is being tracked on the proejct’s Github issues](https://github.com/facebook/metro-bundler/issues/65).
- If you use moment.js in your app, [you may have success with this fix](https://github.com/facebook/metro-bundler/issues/65#issuecomment-336838866).

Several deprecated APIs have been removed. All of these APIs printed warning messages in previous releases:

- `Expo.Notifications.getExponentPushToken` is now `Expo.Notifications.getExpoPushToken`.
- `Expo.AdMob.AdMobInterstitials.tryShowNewInterstitial` has been removed in favor of `requestAd` and `showAd`.
- `Expo.Segment.initializeAndroid` and `initializeIOS` have been removed in favor of `Expo.Segment.initialize`.
- The `tintEffect` prop of `Expo.BlurView` has been removed in favor of the tint prop.
- `Expo.SecureStore.setValueWithKeyAsync`, `getValueWithKeyAsync`, and `deleteValueWithKeyAsync` are now `setItemAsync`, `getItemAsync`, and `deleteItemAsync`. The order of arguments to `setValueWithKeyAsync` changed from `(value, key)` to `(key, value)`.
- The `callback` prop of `Expo.Video` and `Expo.Audio` is now `onPlaybackStatusUpdate`.
  This is not a breaking change yet but we plan to remove `LegacyAsyncStorage` in SDK 24.
  If you, or any libraries that you use. use `View.propTypes.style` you will need to change that to `ViewPropTypes.style`.

If you have not yet updated your imports of `PropTypes` as warned in deprecation warnings in previous releases, you will need to do this now. Install the `prop-types` package and `import PropTypes from 'prop-types'`; instead of `import { PropTypes } from React;`!
Similarly, if you depend on `React.createClass`, you will need to install the `create-react-class` package and `import createReactClass from 'create-react-class';` [as described in the React documentation](https://reactjs.org/docs/react-without-es6.html).

## SDK 21

#### Upgrade from SDK 20

- In app.json, change sdkVersion to `"21.0.0"`
- In package.json, change these dependencies:

```json
{
  "react-native": "https://github.com/expo/react-native/archive/sdk-21.0.2.tar.gz",
  "expo": "^21.0.0",
  "react": "16.0.0-alpha.12"
}
```

- Delete your project’s node_modules directory and run npm install again

#### Notes

Camera

- The takePicture function is now called `takePictureAsync` and now returns an object with many keys, instead of just returning the URI. The URI is available under the `uri` key of the returned object.

- Previously this function would return a value like: `"file://path/to/your/file.jpg"`

- And will now return an object like: `{ "uri": "file://path/to/your/file.jpg" }`

Secure Store

- `setValueWithKeyAsync` → `setItemAsync`: The order of the arguments has been reversed to match typical key-value store APIs. This function used to expect `(value, key)` and now expects `(key, value)`.
- `getValueWithKeyAsync` → `getItemAsync`: Trying to retrieve an entry that doesn’t exist returns `null` instead of throwing an error.
- `deleteValueWithKeyAsync` → `deleteItemAsync`

Payments

- We’d previously announced Stripe support on iOS as part of our experimental DangerZone APIs. The Payments API was using the Stripe SDK on iOS. We learned that Apple sometimes rejects apps which contain the Stripe SDK but don’t offer anything for sale. To help your App Review process go more smoothly, we’ve decided to remove the Stripe SDK and experimental Payments API from apps built with the Expo standalone builder. We’re still excited to give developers a way to let users pay for goods when they need to and we’ll announce more ways to do so shortly.
