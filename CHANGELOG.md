# Changelog

This is the log of notable changes to the Expo client that are developer-facing.
Package-specific changes not released in any SDK will be added here just before the release. Until then, you can find them in changelogs of the individual packages (see [packages](./packages) directory).

## master

### 📚 3rd party library updates

### 🛠 Breaking changes

- `react-native-view-shot` is no longer installed by default, install it with `expo install react-native-view-shot`. ([#7950](https://github.com/expo/expo/pull/7950) by [@evanbacon](https://github.com/evanbacon))

### 🎉 New features

### 🐛 Bug fixes

- Fixed `androidNavigationBar.hidden` configuration not remaining applied after backgrounding & foregrounding the app. ([#7770](https://github.com/expo/expo/pull/7770) by [@cruzach](https://github.com/cruzach))

## 37.0.0

### 📚 3rd party library updates

- Updated `react-native-shared-element` from `0.5.1` to `0.5.6`. ([#7033](https://github.com/expo/expo/pull/7033) by [@IjzerenHein](https://github.com/IjzerenHein))
- Updated `@react-native-community/netinfo` from `4.6.0` to `5.5.0`. **Some deprecated methods have been removed in this version, make sure to check out [`NetInfo` docs](https://github.com/react-native-community/react-native-netinfo) for available API.** ([#7095](https://github.com/expo/expo/pull/7095) by [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-community/datetimepicker` from `2.1.0` to `2.2.2`. ([#7119](https://github.com/expo/expo/pull/7119) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-gesture-handler` from `1.5.1` to `1.6.0`. ([#7121](https://github.com/expo/expo/pull/7121) by [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-community/masked-view` from `0.1.5` to `0.1.6`.
- Updated `@react-native-community/viewpager` from `2.0.2` to `3.3.0`.
- Updated `react-native-reanimated` from `1.4.0` to `1.7.0`.
- Updated `react-native-svg` from `9.13.3` to `11.0.1`.
- Updated `react-native-view-shot` from `3.0.2` to `3.1.2`.
- Updated `react-native-webview` from `7.4.3` to `8.1.1`.
- Updated `react-native-appearance` from `0.2.1` to `0.3.3`. ([#7250](https://github.com/expo/expo/pull/7250) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-safe-area-context` from `0.6.0` to `0.7.3`.
- Updated `react-native-screens` from `2.0.0-alpha.12` to `2.2.0` 🎉. ([#7183](https://github.com/expo/expo/pull/7183) by [@tsapeta](https://github.com/tsapeta), ([#7201](https://github.com/expo/expo/pull/7201) [@bbarthec](https://github.com/bbarthec)), ([#7215](https://github.com/expo/expo/pull/7215) [@LinusU](https://github.com/LinusU))

### 🛠 Breaking changes

- **Android push notifications:** your Google API key specified in `google-services.json` must allow access to the Cloud Messaging API if you have restricted your API key to access only specific APIs. In the Google Cloud console, browse to [APIs & Services -> Credentials](https://console.cloud.google.com/apis/credentials). Find the API key that is associated with your app and click the pencil icon to edit it. Under "API restrictions", if the key is restricted, add "Firebase Installations API" and "Cloud Messaging" to the set of allowed APIs and save the changes. (Technical note: Google changed the underlying Firebase Cloud Messaging library in `com.google.firebase:firebase-messaging:20.1.2` to depend on the Firebase Installations API, which applies API key restrictions. See Google's notes [here](https://firebase.google.com/support/release-notes/android#2020-02-27) and [here](https://github.com/firebase/firebase-android-sdk/blob/master/firebase-installations/API_KEY_RESTRICTIONS.md).)
- `expo-app-auth` Remove SSL features from unsafe connection builder. ([#7187](https://github.com/expo/expo/pull/7187) by [@evanbacon](https://github.com/evanbacon))
- `expo-constants` `Constants.deviceName` now only returns the possible Browser name and doesn't fallback to engine or OS name. ([#6809](https://github.com/expo/expo/pull/6809) [@evanbacon](https://github.com/evanbacon))
- `expo-constants` `Constants.platform.web` now only returns the `ua` (user agent string). ([#6809](https://github.com/expo/expo/pull/6809) [@evanbacon](https://github.com/evanbacon))
- `expo-crypto` Removed support for the MD2 and MD4 hashing algorithms in the Expo client and standalone apps. ([#6464](https://github.com/expo/expo/pull/6464) [@sjchmiela](https://github.com/sjchmiela))
- Enriched `androidStatusBar` configuration in `app.json`. ([#6506](https://github.com/expo/expo/pull/6506) [@bbarthec](https://github.com/bbarthec))
- Extended `androidNavigationBar.visible` configuration in `app.json`. To keep the same behavior as before, change your `androidNavigationBar.visible` field from `false` to `leanback`. ([#7049](https://github.com/expo/expo/pull/7049) [@cruzach](https://github.com/cruzach))
- **`expo`**: Removed `AuthSession` from the `expo` package and extracted into `expo-auth-session` unimodule. ([#6989](https://github.com/expo/expo/pull/6989) by [@lukmccall](https://github.com/lukmccall))
- **`expo`**: Removed `ScreenOrientation` from the `expo` package and extracted into `expo-screen-orientation` unimodule. ([#6760](https://github.com/expo/expo/pull/6760) by [@lukmccall](https://github.com/lukmccall))
- **`expo`**: Updated `Linking.makeUrl` to create URLs that follow the [URI specification](https://tools.ietf.org/html/rfc3986#section-3). Making a hostless URL will result in the format `myapp:///path/into/app` ([#6781](https://github.com/expo/expo/pull/6781) by [@cruzach](https://github.com/cruzach))
- Removed `Orientation.PORTRAIT` and `Orientation.LANDSCAPE` from `ScreenOrientation` in favor of their more specific versions. ([#6760](https://github.com/expo/expo/pull/6760) by [@lukmccall](https://github.com/lukmccall))
- `LocalAuthentication.authenticateAsync` will now display Android's UI component to prompt the user to authenticate. ([#6846](https://github.com/expo/expo/pull/6846) by [@LinusU](https://github.com/LinusU))
- `StatusBar` on Android has `dark-content` by default to match iOS. ([#7317](https://github.com/expo/expo/pull/7317) [@bbarthec](https://github.com/bbarthec))
- All native Facebook API calls made in the Expo Client app on iOS are made with the Expo Client's own Facebook App ID. ([#7931](https://github.com/expo/expo/pull/7931) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Fixed loading images for manipulation in `expo-image-loader`. ([#7417](https://github.com/expo/expo/pull/7417) by [@mczernek](https://github.com/mczernek))
- Added support for video mirroring with `expo-camera`. ([#7016](https://github.com/expo/expo/pull/7016) by [@scandinaro](https://github.com/scandinaro))
- Added support for badge numbers. ([#4562](https://github.com/expo/expo/pull/4562) by [@jaulz](https://github.com/jaulz))
- `expo-task-manager` supports bare workflow. ([#6828](https://github.com/expo/expo/pull/6828) by [@mczernek](https://github.com/mczernek))
- Add support for `expo-firebase-core`. ([#7013](https://github.com/expo/expo/pull/7013) by [@IjzerenHein](https://github.com/IjzerenHein))
- Add support for `expo-firebase-analytics`. ([#7017](https://github.com/expo/expo/pull/7017) by [@evanbacon](https://github.com/evanbacon) and [@IjzerenHein](https://github.com/IjzerenHein))
- Add `MailComposer.isAvailableAsync` method. ([#6552](https://github.com/expo/expo/pull/6552) by [@evanbacon](https://github.com/EvanBacon))
- Add `showInRecents` option to the `AuthSessions.startAsync` determining whether a browsed website should be shown as a separate entry in Android recent/multitasking view. ([#6701](https://github.com/expo/expo/pull/6701) by [@esamelson](https://github.com/esamelson))
- Replaced `FingerprintManager` with `BiometricPrompt` from `AndroidX` in `LocalAuthentication`. ([#6846](https://github.com/expo/expo/pull/6846) by [@LinusU](https://github.com/LinusU))

### 🐛 Bug fixes

- Fixed parsing booleans in `SQLite` ([#7225](https://github.com/expo/expo/pull/7225) by [@mczernek](https://github.com/mczernek))
- Fixed value reported by `FileSystem.getFreeDiskStorageAsync` (was `2^53 - 1`, now is bytes available) ([#6465](https://github.com/expo/expo/pull/6465) by [@sjchmiela](https://github.com/sjchmiela))
- Added `setOnPlaybackStatusUpdate` to `Video.refs` ([#6213](https://github.com/expo/expo/pull/6213) by [@mczernek](https://github.com/mczernek))
- Updated underlying Facebook SDK on Android to v5.12.1 ([#6462](https://github.com/expo/expo/pull/6462) by [@sjchmiela](https://github.com/sjchmiela))
- Removed SpongyCastle (BouncyCastle repackaging) from among Android dependencies. ([#6464](https://github.com/expo/expo/pull/6464) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed fullscreen events on iOS for native controls. ([#6504](https://github.com/expo/expo/pull/6504) by [@mczernek](https://github.com/mczernek))
- Fixed `Camera.takePictureAsync()` not saving metadata on iOS. ([#6428](https://github.com/expo/expo/pull/6428) by [@lukmccall](https://github.com/lukmccall))
- Fixed `KeyboardAvoidingView` in standalone Android builds. ([#6506](https://github.com/expo/expo/pull/6506) [@bbarthec](https://github.com/bbarthec))
- Fixed a bug where `safariViewControllerDidFinish` is not called if you close the webview with the "Swipe to dismiss" gesture. ([#6581](https://github.com/expo/expo/pull/6581) by [@axeldelafosse](https://github.com/axeldelafosse))
- Fixed `FileSystem.downloadAsync()` throwing `NullPointerException` in rare failures on Android. ([#6819](https://github.com/expo/expo/pull/6819) by [@jsamr](https://github.com/jsamr/))
- `MediaLibrary.saveToLibraryAsync` and `MediaLibrary.createAssetAsync` will throw an error when provided path does not contain an extension. ([#7030](https://github.com/expo/expo/pull/7030) by [@lukmccall](https://github.com/lukmccall))
- Fixed `FileSystem.getTotalDiskCapacityAsync()` incorrectly returning `2^53 - 1` instead of the actual total disk capacity. ([#6978](https://github.com/expo/expo/pull/6978) by [@cruzach](https://github.com/cruzach/))
- Fixed `VideoThumbnails.getThumbnailAsync` crashing when the provided file is corrupted. ([#6877](https://github.com/expo/expo/pull/6877) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Linking.openSettings` is undefined. ([#7128](https://github.com/expo/expo/pull/7128) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Linking.sendIntent` is undefined. ([#7386](https://github.com/expo/expo/pull/7386) by [@brentvatne](https://github.com/brentvatne))
- Fixed `Camera.takePictureAsync` not resolving promise when native camera isn't ready on iOS. ([#7144](https://github.com/expo/expo/pull/7144) by [@bbarthec](https://github.com/bbarthec))
- Fixed [NPE crash in GeofencingTaskConsumer](https://github.com/expo/expo/issues/5191) when `mTask` is made null mid-execution. ([#7147](https://github.com/expo/expo/pull/7147) by [@briefjudofox](https://github.com/briefjudofox))
- Fixed `ImagePicker.launchCameraAsync` reloading the application on the OnePlus 7. ([#7162](https://github.com/expo/expo/pull/7162) by [@lukmccall](https://github.com/lukmccall))
- Fixed the bare React Native application not compiling with the `use_frameworks!` option. ([#6503](https://github.com/expo/expo/pull/6503) by [@lukmccall](https://github.com/lukmccall))
- Fixed `AppRegistry.setWrapperComponentProvider` in managed Expo apps. ([#6530](https://github.com/expo/expo/pull/6530) by [@serhiipalash](https://github.com/serhiipalash))
- Fixed `Facebook SDK` not being fully initialized. ([#6527](https://github.com/expo/expo/pull/6527) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed `Battery` import breaking on Web. ([#6545](https://github.com/expo/expo/pull/6545) by [@evanbacon](https://github.com/EvanBacon))
- Fixed the `RedBox` being covered by the notch on Android. ([#6644](https://github.com/expo/expo/pull/6644) by [@cruzach](https://github.com/cruzach))
- Fixed SSR support in `ErrorRecovery`. ([#6672](https://github.com/expo/expo/pull/6672) by [@evanbacon](https://github.com/EvanBacon))
- Fixed `Linking.makeUrl` and `Linking.parse` not matching. ([#6688](https://github.com/expo/expo/pull/6688) by [@cruzach](https://github.com/cruzach))
- Fixed `StoreReview.requestReview` throwing `NullPointerException` in the bare workflow. ([#6713](https://github.com/expo/expo/pull/6713) by [@cruzach](https://github.com/cruzach))
- Fixed NDK not installing when running `yarn setup:native`. ([#6685](https://github.com/expo/expo/pull/6685) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fixed `Linking` not decoding query parameters. ([#6774](https://github.com/expo/expo/pull/6774) by [@cruzach](https://github.com/cruzach))
- Fixed `Contacts` not saving the year correctly. ([#6744](https://github.com/expo/expo/pull/6744) by [@tasn](https://github.com/tasn))
- Fixed `Audio.setAudioModeAsync` parameter type. ([#6833](https://github.com/expo/expo/pull/6833) by [@mxhold](https://github.com/mxhold))
- Fixed `LocalAuthentication.authenticateAsync` resulting in the `user_cancel` error immediately on Android. ([#6962](https://github.com/expo/expo/pull/6962) by [@LinusU](https://github.com/LinusU))
- Fixed `Permissions.askAsync` crashing on devices with Android 21 and 22 in the bare workflow. ([#6736](https://github.com/expo/expo/pull/6736) by [@lukmccall](https://github.com/lukmccall))
- Fixed `HeadlessAppLoader` crashing after the activity is killed. ([#6879](https://github.com/expo/expo/pull/6879) by [@tasn](https://github.com/tasn))
- Fixed `fields` parameter type in `Contacts.getContactByIdAsync` method. ([#6910](https://github.com/expo/expo/pull/6910) by [AryanJ-NYC](https://github.com/AryanJ-NYC))
- Fixed `DocumentPicker.DocumentResult` type. ([#7064](https://github.com/expo/expo/pull/7064) by [@SimenB](https://github.com/SimenB))
- Fixed `Constants.installationId` being `null` in the bare workflow after ejecting. ([#6906](https://github.com/expo/expo/pull/6906) by [@cruzach](https://github.com/cruzach))
- Fixed `Facebook.logInWithReadPermissionsAsync` method throwing error (`undefined is not an object (evaluating '_ref.type')`). by ([#6527](https://github.com/expo/expo/pull/6527) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed some TypeScript types not being exported. ([#7120](https://github.com/expo/expo/pull/7120) by [@lukmccall](https://github.com/lukmccall))
- Fixed `TaskManager.defineTask` logging too many warnings and not working well with Fast Refresh. ([#7202](https://github.com/expo/expo/pull/7202) by [@tsapeta](https://github.com/tsapeta))
- Added doc comments to `TaskManager` and exported more types. ([#7202](https://github.com/expo/expo/pull/7202) by [@tsapeta](https://github.com/tsapeta))
- Fixed `Facebook.logInWithReadPermissionsAsync` redirecting to a blank white screen in the Expo Client app on iOS. ([#7931](https://github.com/expo/expo/pull/7931) by [@cruzach](https://github.com/cruzach))
- Fixed `Facebook.logInWithReadPermissionsAsync` resulting in the WebBrowser login modal remaining open after redirecting back to the app if selected "Sign in with Facebook app." ([#7931](https://github.com/expo/expo/pull/7931) by [@cruzach](https://github.com/cruzach))

## 36.0.0

### 📚 3rd party library updates

- `@react-native-community/netinfo` updated from `3.2.1` to `4.6.0`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-branch` updated from `3.1.1` to `4.2.1`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-gesture-handler` updated from `1.4.0` to `1.5.1`. ([#6127](https://github.com/expo/expo/pull/6127) by [@tsapeta](https://github.com/tsapeta) and [8b0e1b6](https://github.com/expo/expo/commit/8b0e1b6852bf631558d7b6b47d1db782c1c3d528) by [@esamelson](https://github.com/esamelson))
- `react-native-maps` updated from `0.25.0` to `0.26.1`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-reanimated` updated from `1.3.0` to `1.4.0`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-svg` updated from `9.9.5` to `9.13.3`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-view-shot` updated from `2.6.0` to `3.0.2`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-webview` updated from `7.0.5` to `7.4.3`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-safe-area-context` updated from `0.5.0` to `0.6.0`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-screens` updated from `1.0.0-alpha.23` to `2.0.0-alpha.12`. ([#6258](https://github.com/expo/expo/pull/6258) by [@sjchmiela](https://github.com/sjchmiela) and [#6357](https://github.com/expo/expo/pull/6357) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- **`CameraRoll`**: Removed `CameraRoll` from `react-native` core, developers are encouraged to use [`expo-media-library`](https://docs.expo.io/versions/latest/sdk/media-library/) instead
- **`ART`**: Removed `ART` from `react-native` core, developers are encouraged to use [`react-native-svg`](https://github.com/react-native-community/react-native-svg) instead
- **`jest-expo`**: Removed `mockPlatformIOS()`, `mockPlatformAndroid()`, `mockPlatformWeb()`, `describeCrossPlatform()` in favor of platform specific presets like `jest-expo/universal`. ([#5645](https://github.com/expo/expo/pull/5645) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo`**: Removed Branch export from `expo/Branch`. ([#6190](https://github.com/expo/expo/pull/6190) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo`**: Removed `ErrorRecovery` from the `expo` package and extracted into `expo-error-recovery` unimodule. ([#5357](https://github.com/expo/expo/pull/5357) by [@lukmccall](https://github.com/lukmccall))
- **`expo`**: Updated `Linking.parse` to better handle non-expo URLs. URLs like `myapp://hello/world` are now parsed so that `hello` is the hostname and `world` is the path, according to the URI specification; [more info here](https://github.com/expo/expo/issues/6497#issuecomment-574882448). ([#5179](https://github.com/expo/expo/pull/5179) by [@koenpunt](https://github.com/koenpunt))
- **`expo-analytics-segment`**: Fixed `enabled` behavior inverted on iOS. ([#6242](https://github.com/expo/expo/pull/6242) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-facebook`**: Disabled autoinitialization of the Facebook SDK and added an `initializeAsync` method and `autoinit` app.json setting. ([#5924] by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-keep-awake`**: Removed deprecated methods and components. ([#6006](https://github.com/expo/expo/pull/6006) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-location`**: `Location.requestPermissionsAsync()` is no longer being rejected when permissions were not granted. Instead it returns `PermissionsResponse` object, which is similar to the result of `Permissions.askAsync(Permissions.Location)`. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- **`expo-store-review`**: Replace `StoreReview.isSupported` method with `StoreReview.isAvailableAsync` returning promise instead of boolean. ([#6195](https://github.com/expo/expo/pull/6195) by [@danibonilha](https://github.com/danibonilha))
- **`expo-calendar`**: Methods creating or updating calendar events now reject when passed `timeZone` is invalid. ([#6326](https://github.com/expo/expo/pull/6326) by [@lukmccall](https://github.com/lukmccall))
- **`expo-screen-orientation`**: Removed deprecated methods `allow`, `allowAsync`, and `doesSupportAsync`. ([#6007](https://github.com/expo/expo/pull/6007) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added `MediaLibrary.saveToAssetsAsync` function that can work without `CAMERA_ROLL` permission. ([#5678](https://github.com/expo/expo/pull/5678) by [@lukmccall](https://github.com/lukmccall))
- Added `setTrackingOptions` to `expo-analytics-amplitude` to fine-tune what Amplitude can track. ([#5877](https://github.com/expo/expo/pull/5877) by [@amaurymartiny](https://github.com/amaurymartiny))
- Added support for `Speech.getAvailableVoicesAsync()` on Android. ([#5887](f0a9d8ce87451dbce8c0a309ff917c8b26472861) by [@Mitch528](https://github.com/Mitch528))
- Added `@react-native-community/masked-view` in version `0.1.5`. ([#6193](https://github.com/expo/expo/pull/6193) by [@brentvatne](https://github.com/brentvatne))
- Added `@react-native-community/viewpager` in version `2.0.2`. ([#6198](https://github.com/expo/expo/pull/6198) by [@brentvatne](https://github.com/brentvatne))
- Added `@react-native-community/datetimepicker` in version `2.1.0`. ([#6087](https://github.com/expo/expo/pull/6087) by [@tsapeta](https://github.com/tsapeta))
- Added `canAskAgain` and `granted` fields to `PermissionsResponse`. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- Added support for `react-native-appearance` on Android and Web. ([#6162](https://github.com/expo/expo/pull/6162) by [@bbarthec](https://github.com/bbarthec))
- Added `Location.getLastKnownPositionAsync` to get the last known position of the device. ([#6246](https://github.com/expo/expo/pull/6246) by [@lukmccall](https://github.com/lukmccall))
- Added support for complex recurrence rules for events and reminders on iOS. ([#6300](https://github.com/expo/expo/pull/6300) by [@tasn](https://github.com/tasn))
- Added `exif` and `base64` properties into the TypeScript definitions for `ImagePickerResult` in `expo-image-picker`. ([#6311](https://github.com/expo/expo/pull/6311) by [@kyletsang](https://github.com/kyletsang))
- Added a `videoExportPreset` field to `ImagePickerOptions`, which sets dimensions and compression algorithm for exported video on iOS. ([#6046](https://github.com/expo/expo/pull/6046) by [@lukmccall](https://github.com/lukmccall))
- Added `nonce` option to `expo-apple-authentication`. ([#6404](https://github.com/expo/expo/pull/6404) by [@brentvatne](https://github.com/brentvatne))
- Added support for more permissions on web. ([#6115](https://github.com/expo/expo/pull/6115) by [@EvanBacon](https://github.com/EvanBacon))
- Added better `Camera` support across web browsers. ([#6207](https://github.com/expo/expo/pull/6207) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed `MediaPlayer` not working on some Android devices ([#6320](https://github.com/expo/expo/pull/6320) by [@mczernek](https://github.com/mczernek))
- Fixed `Audio.setAudioModeAsync` to auto-fill with previously set values (falls back to default values) if not all fields are provided. ([#5593](https://github.com/expo/expo/pull/5593) by [@cruzach](https://github.com/cruzach))
- Fixed crash when `BarCodeScanner` was mounted more than 128 times. ([#5719](https://github.com/expo/expo/pull/5719) by [@geovannimp](https://github.com/geovannimp))
- Fixed URI parsing in `expo-video-thumbnails`. ([#5711](https://github.com/expo/expo/pull/5711) by [@lukmccall](https://github.com/lukmccall))
- Fixed `MediaLibrary` methods crashing on Android 10. ([#5905](https://github.com/expo/expo/pull/5905) by [@lukmccall](https://github.com/lukmccall))
- Fixed `MediaLibrary.getMomentsAsync` crashing if `locationNames` array is null. ([#5937](https://github.com/expo/expo/pull/5937) by [@lukmccall](https://github.com/lukmccall))
- Fixed `MediaLibrary.getAlbumsAsync()` not getting albums in folders on iOS. ([#5857](https://github.com/expo/expo/pull/5857) by [@lukmccall](https://github.com/lukmccall))
- Fixed unclosed http connections in `FileSystem.downloadAsync` method. ([#5840](https://github.com/expo/expo/pull/5840) by [@bbarthec](https://github.com/bbarthec))
- Fixed `ImagePicker` ignoring orientation of the application. ([#5946](https://github.com/expo/expo/pull/5946) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Calendar.getCalendarsAsync` rejecting on iOS 13, when `source.name` is null. ([#5994](https://github.com/expo/expo/pull/5994) by [@lukmccall](https://github.com/lukmccall))
- Fixed handling URI with no scheme in `ExpoFileSystem`. ([#5904](https://github.com/expo/expo/pull/5904) by [@bbarthec](https://github.com/bbarthec))
- Fixed `FileSystem#deleteAsync` in older Android SDKs. ([#5923](https://github.com/expo/expo/pull/5923) by [@bbarthec](https://github.com/bbarthec))
- Fixed image cropping on Android in `expo-image-manipulator`. ([#5828](https://github.com/expo/expo/pull/5828) by [@matiasmelendi](https://github.com/matiasmelendi))
- Fixed type problem with `EXiOSOperatingSystemVersion` struct in `expo-gl-cpp`. ([#6063](https://github.com/expo/expo/pull/6063) by [@crubier](https://github.com/crubier))
- Fixed blinking `Camera.Constants.FlashMode.torch` on iOS in `Camera`. ([#6128](https://github.com/expo/expo/pull/6128) by [@bbarthec](https://github.com/bbarthec))
- Fixed race condition in `GoogleSignIn` on iOS. ([#5872](https://github.com/expo/expo/pull/5872) by [@vonovak](https://github.com/vonovak)])
- Fixed `Contacts.presentFormAsync` pre-filling, when `bool` value was provided. ([#5522](https://github.com/expo/expo/pull/5522) by [@lukmccall](https://github.com/lukmccall))
- Fixed crashes when the user tries to download a file through `react-native-webview` without granted storage permission on Android. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Permissions.getAsync` result, which was inconsistent with iOS settings. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- Fixed scanning `PDF417` and `Code39` in `BarCodeScanner` on iOS. ([#5976](https://github.com/expo/expo/pull/5531) by [@bbarthec](https://github.com/bbarthec))
- Add missing `mute` property in `Camera.recordAsync` in the TypeScript definition. ([#6192](https://github.com/expo/expo/pull/6192) by [@wcandillon](https://github.com/wcandillon))
- Warn when `Linking.makeUrl` is called in Expo client and no scheme is present in `app.json` in order to prevent standalone builds from crashing due to missing scheme. ([#6277](https://github.com/expo/expo/pull/6277) by [@brentvatne](https://github.com/brentvatne))
- Fixed `keychainAccessible` option not having any effect on iOS (`SecureStore` module) ([#6291](https://github.com/expo/expo/pull/6291)) by [@sjchmiela](https://github.com/sjchmiela)
- Fixed presentation style of `WebBrowser` modal on iOS 13+ (it is now presented fullscreen instead of a modal). ([#6345](https://github.com/expo/expo/pull/6345)) by [@roothybrid7](https://github.com/roothybrid7)
- Fixed `expo-gl` crashing an app when context initialization happens on remote JS context. ([#6381](https://github.com/expo/expo/pull/6381) by [@tsapeta](https://github.com/tsapeta))
- Fixed memory leaks caused by `ImagePicker` module. ([#6303](https://github.com/expo/expo/pull/6303) by [@lukmccall](https://github.com/lukmccall))
- Fixed Android scoped `FileSystem` migration. ([#6367](https://github.com/expo/expo/pull/6367))
- Fixed `ScreenOrientation` crashing on Edge. ([#5913](https://github.com/expo/expo/pull/5913) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `LinearGradient` colors on web. ([#5843](https://github.com/expo/expo/pull/5843) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `MediaLibrary.getAssetInfoAsync()` not returning `localUri` for videos. ([#5806](https://github.com/expo/expo/pull/5806) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Localization` constants export in iOS simulator. ([#5740](https://github.com/expo/expo/pull/5740) by [@lukmccall](https://github.com/lukmccall))
- Removed unnecessary `CameraRoll` permissions check in `ImagePicker` on iOS 11+. ([#5822](https://github.com/expo/expo/pull/5822) by [@lukmccall](https://github.com/lukmccall))
- Fixed default value for `fallbackLabel` in `LocalAuthentication.authenticateAsync`. ([#5844](https://github.com/expo/expo/pull/5844) by [@cruzach](https://github.com/cruzach))
- Fixed getting `Contacts` containers without specifying a predicate. ([#6016](https://github.com/expo/expo/pull/6016) by [@tasn](https://github.com/tasn))
- Fixed vector icons in MS Edge by disabling font face observer. ([#5961](https://github.com/expo/expo/pull/5961) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed typings for `Calendar.getRemindersAsync()`. ([#6055](https://github.com/expo/expo/pull/6055) by [@tasn](https://github.com/tasn))
- Fixed `Camera` continuing to run after being unmounted on web. ([#6117](https://github.com/expo/expo/pull/6117) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed exceptions logged in the `AV` module on Android. ([#6099](https://github.com/expo/expo/pull/6099) by [@danmaas](https://github.com/danmaas))
- Fixed crash when calling `Amplitude.setUserProperties()` on Android. ([#6174](https://github.com/expo/expo/pull/6174) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed methods for scheduling Notifications. ([#5470](https://github.com/expo/expo/pull/5470) by [@Szymon20000](https://github.com/Szymon20000))
- Fixed unloading sounds in the `AV` module on web. ([#6214](https://github.com/expo/expo/pull/6214) by [@rickiesmooth](https://github.com/rickiesmooth))
- Add parital onFullscreenUpdate support to `AV` module on web. ([#6610](https://github.com/expo/expo/pull/6610) by [@awinograd](https://github.com/awinograd))

## 35.0.0

### 📚 3rd party library updates

- `react-native-maps` updated from `0.24.0` to `0.25.0`
- `react-native-reanimated` updated from `1.1.0` to `1.2.0`
- `react-native-screens` updated from `1.0.0-alpha.22` to `1.0.0-alpha.23`
- `react-native-svg` updated from `9.5.1` to `9.9.2`
- `react-native-webview` updated from `5.12.0` to `7.0.5`

### 🛠 Breaking changes

- `FileSystem.documentDirectory` is under a new directory. If upgrading from SDK 32 or below, you must upgrade your app to SDK 33 or 34 first, before upgrading to SDK 35 and above in order to migrate app files. ([#5381](https://github.com/expo/expo/pull/5381) by [@Szymon20000](https://github.com/Szymon20000))
- `Google.logInAsync()` now accepts a `redirectUrl` value for apps running in the Expo Client. Previously, it would ignore this, so if you are passing a value, make sure to [follow the guidelines](https://docs.expo.io/versions/latest/sdk/google/#loginasync). ([#4904](https://github.com/expo/expo/pull/4904) by [@cruzach](https://github.com/cruzach))
- Google Mobile Ads now require `expo.[platform].config.googleMobileAdsAppId` configuration value present in `app.json`. The value can be found by following the guide in [this Google Support answer](https://support.google.com/admob/answer/7356431). ([#5447](https://github.com/expo/expo/pull/5447) by [@sjchmiela](https://github.com/sjchmiela))
- Replace `Localization.country` constants with `Localization.region` and make it only available on iOS and Web ([#4921](https://github.com/expo/expo/pull/4921) by [@lukmccall](https://github.com/lukmccall))
- Upgraded `FBSDK*Kit` to `v5.4.1`. This upgrade removed support for all login behaviors other than `browser`. Possible motivations behind this change may be found [here](https://stackoverflow.com/a/32659545/1123156), [here](https://github.com/facebook/facebook-objc-sdk/commit/95e67c98f0b53adc8a8ea610fdfd0457be3d4d2b) and [here](https://github.com/facebook/facebook-objc-sdk/pull/964). `behavior` parameter has been removed from TS type declaration and will not have any effect anymore ([#5499](https://github.com/expo/expo/pull/5499) by [@sjchmiela](https://github.com/sjchmiela))
- Removed contact's `note` field from being requested if requested fields are not provided. ([#5601](https://github.com/expo/expo/pull/5601) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added `expo-network` unimodule that provides device's network information such as its IP address or airplane mode status. ([#5533](https://github.com/expo/expo/pull/5074) by [@ninjaachibi](https://github.com/ninjaachibi))
- Added `expo-cellular` unimodule that provides information about the user's cellular service provider. ([#5098](https://github.com/expo/expo/pull/5098) by [@vivianzzhu91](https://github.com/vivianzzhu91]))
- Added `expo-battery` unimodule providing informations about the physical device's battery. ([#4804](https://github.com/expo/expo/pull/4804) by [@ninjaachibi](https://github.com/ninjaachibi) and [@vivianzzhu91](https://github.com/vivianzzhu91]))
- Added `expo-apple-authentication` unimodule providing "Sign In with Apple" functionality. ([#5421](https://github.com/expo/expo/pull/5421) by [@matt-oakes](https://github.com/matt-oakes), [@vonovak](https://github.com/vonovak), [@bbarthec](https://github.com/bbarthec), [@esamelson](https://github.com/esamelson) and [@tsapeta](https://github.com/tsapeta))
- Added [`react-native-shared-element`](https://github.com/IjzerenHein/react-native-shared-element) to Expo client and standalone apps. ([#5533](https://github.com/expo/expo/pull/5533) by [@brentvatne](https://github.com/brentvatne))
- Added an option which allows displaying notifications in foreground on iOS. ([#4802](https://github.com/expo/expo/pull/4802) by [@hesyifei](https://github.com/hesyifei))
- Added `lazyImports` option in `babel-preset-expo` which allows lazy-initializing/inline-requiring packages. ([#4685](https://github.com/expo/expo/pull/4685) by [@hesyifei](https://github.com/hesyifei))
- Added the possibility to get MediaLibrary assets from specific time range. ([#5166](https://github.com/expo/expo/pull/5166) by [@tsapeta](https://github.com/tsapeta))
- Added Next.js supports with Expo for Web. ([#5275](https://github.com/expo/expo/pull/5275) by [@hesyifei](https://github.com/hesyifei))
- Added support for serving non-personalized Google AdMob Ads. ([#5323](https://github.com/expo/expo/pull/5323) by [@sjchmiela](https://github.com/sjchmiela))
- Added [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context) to Expo client and standalone apps. ([#5446](https://github.com/expo/expo/pull/5446) by [@sjchmiela](https://github.com/sjchmiela))
- Added supports for push notification in Expo for Web. ([#4963](https://github.com/expo/expo/pull/4963) by [@hesyifei](https://github.com/hesyifei))
- Added `Calendar.getDefaultCalendarAsync` method on iOS. ([#5485](https://github.com/expo/expo/pull/5485) by [@lukmccall](https://github.com/lukmccall))
- Added `react-native-appearance@0.0.8`.

### 🐛 Bug fixes

- Fixed MediaLibrary assets' width and height were sometimes equal to 0. ([#4935](https://github.com/expo/expo/pull/4935) by [@lukmccall](https://github.com/lukmccall))
- Fixed location background mode was required to use geofencing. ([#5198](https://github.com/expo/expo/pull/5198) by [@tsapeta](https://github.com/tsapeta))
- Fixed `Calendar.createEventAsync` crashing with relativeOffSet due to invalid type conversion from double to integer. ([#5134](https://github.com/expo/expo/pull/5134) by [@vivianzzhu91](https://github.com/vivianzzhu91))
- Fixed `AppAuthModule.createOAuthServiceConfiguration` typo resulting in crashes when `registrationEndpoint` is not specified in config.
- Fixed occasional `"ViewManagerAdapter_*" was not found in the UIManager` bugs. ([#5066](https://github.com/expo/expo/pull/5066) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed crashes when adding attachments with `MailComposer`. ([#5449](https://github.com/expo/expo/pull/5449) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed `ImagePicker.launchImageLibraryAsync` not working on iOS 13. ([#5434](https://github.com/expo/expo/pull/5434) by [@tsapeta](https://github.com/tsapeta))
- Fixed `ImageManipulator.manipulateAsync` not working with local paths. ([#5531](https://github.com/expo/expo/pull/5531) by [@bbarthec](https://github.com/bbarthec))
- Fixed `Camera#onBarCodeScanned` not firing when added at first rendering ([#5606](https://github.com/expo/expo/pull/5606) by [@bbarthec](https://github.com/bbarthec))
- Fixed background fetch calls throwing exceptions about mutating an array while being enumerated. ([#5612](https://github.com/expo/expo/pull/5612) by [@tsapeta](https://github.com/tsapeta))

## 34.0.0

### 📚 3rd party library updates

- `react-native-gesture-handler` updated from `1.2.1` to `1.3.0`
- `react-native-branch` updated from `2.2.5` to `3.1.1`
- `react-native-reanimated` updated from `1.0.1` to `1.1.0`
- `react-native-svg` updated from `9.4.0` to `9.5.1`
- `react-native-webview` updated from `5.8.0` to `5.12.0`
- `@react-native-community/netinfo` updated from `2.0.10` to `3.2.1`

### 🛠 Breaking changes

- Removed `promptMessageIOS` string argument from `LocalAuthentication.authenticateAsync` in favor of options object. ([#4631](https://github.com/expo/expo/pull/4631) by [@tsapeta](https://github.com/tsapeta))
- Removed `Calendar.DEFAULT` and replaced it with `null`. ([#4836](https://github.com/expo/expo/pull/4836) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Added `fallbackLabel` option to `LocalAuthentication.authenticateAsync` on iOS which allows to customize a title of the fallback button when the system doesn't recognize the user and asks to authenticate via device passcode. ([#4612](https://github.com/expo/expo/pull/4612) by [@changLiuUNSW](https://github.com/changLiuUNSW))
- added `native` mode for Android SplashScreen on standalone apps by [@bbarthec](https://github.com/bbarthec) ([#4567](https://github.com/expo/expo/pull/4567))
- added support for video recording in `ImagePicker.launchCameraAsync`. ([#4903](https://github.com/expo/expo/pull/4903) by [@lukmccall](https://github.com/lukmccall))
- added support for `ph://` URLs to `expo-file-system` ([#5195](https://github.com/expo/expo/pull/5195) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- fixed `BarCodeScanner` blocking UI when defining custom `barCodeTypes` on iOS by [@sjchmiela](https://github.com/sjchmiela)
- fixed picking images over 2000px on Android by [@bbarthec](https://github.com/bbarthec) ([#4731](https://github.com/expo/expo/pull/4731))
- fixed `Calendar.getEventsAsync` crashing if `calendarId` is SQL keyword by [@lukmccall](https://github.com/lukmccall) ([#4836](https://github.com/expo/expo/pull/4836))
- fixed `BOOL` interpretation on 32-bit iOS devices by [@lukmccall](https://github.com/lukmccall) ([#4862](https://github.com/expo/expo/pull/4862))
- fixed AV rejecting to further load an asset once any loading error occured ([#5105](https://github.com/expo/expo/pull/5105)) by [@sjchmiela](https://github.com/sjchmiela))
- fixed AV resetting player whenever props changed ([#5106](https://github.com/expo/expo/pull/5106)) by [@sjchmiela](https://github.com/sjchmiela))
- fixed bar code scanning crash if the result couldn't be converted to string ([#5183](https://github.com/expo/expo/pull/5183)) by [@sjchmiela](https://github.com/sjchmiela))
- fixed camera crash in standalone apps ([#5194](https://github.com/expo/expo/pull/5194)) by [@sjchmiela](https://github.com/sjchmiela))

## 33.0.0

### 🛠 Breaking changes

- updated `react-native-gesture-handler` to `1.2.1` by [@mczernek](https://github.com/mczernek) ([#4159](https://github.com/expo/expo/pull/4159))
- updated `react-native-svg` to `9.4.0` by [@Szymon20000](https://github.com/Szymon20000) and [@mczernek](https://github.com/mczernek) ([#3860](https://github.com/expo/expo/pull/3860), [#4159](https://github.com/expo/expo/pull/4159))
- updated `@react-native-community/netinfo` to `2.0.10` by [@sjchmiela](https://github.com/sjchmiela) ([#4153](https://github.com/expo/expo/pull/4153))
- updated `react-native-reanimated` to `1.0.1` by [@dsokal](https://github.com/dsokal) ([#4023](https://github.com/expo/expo/pull/4023))
- removed deprecated `MediaView` and `TriggerView` from `expo-ads-facebook` by [@EvanBacon](https://github.com/EvanBacon) ([#3539](https://github.com/expo/expo/pull/3603)). You should use `AdMediaView` & `AdTriggerView` instead.
- deprecated `Expo.Util` by [@EvanBacon](https://github.com/EvanBacon) ([#3539](https://github.com/expo/expo/pull/3577)). You should use `Expo.Updates` & `Expo.Localization` instead.
- removed use of `expolib_v1.okhttp` in favor of regular `okhttp` dependency by [@Szymon20000](https://github.com/Szymon20000) ([#3539](https://github.com/expo/expo/pull/3539)) (an update to `MainApplication.getOkHttpBuilder` may be required when upgrading)
- corrected behavior of splash screen image based on `resizeMode` in Android standalone apps (`contain` and `cover` were handled contrary to what docs state) by [@bbarthec](https://github.com/bbarthec) ([#3029](https://github.com/expo/expo/pull/3029))
- `Speech.speak` changed option name from `voiceIOS` to `voice`. [@Szymon20000](https://github.com/Szymon20000) ([#3423](https://github.com/expo/expo/pull/3423))
- renamed `Haptic` to `Haptics` and deprecated `Haptics.{notification, impact, selection}` in favour of `Haptics.{notificationAsync, impactAsync, selectionAsync}` [@bbarthec](https://github.com/bbarthec) ([#3330](https://github.com/expo/expo/pull/3330))
- `ImageManipulator.manipulateAsync` is now accepting `ImageManipulator.FlipType.{Vertical, Horizontal}` as flipping action parameter and `ImageManipulator.SaveFormat.{JPEG, PNG}` as saving option [@bbarthec](https://github.com/bbarthec) ([#3245](https://github.com/expo/expo/pull/3245))
- removed `devKernel` and `prodKernel` build flavors from Android ExpoKit projects (all Gradle commands become simply `[verb](Debug|Release)`, e.g. `installDebug` or `assembleRelease`) by [@esamelson](https://github.com/esamelson) ([#3386](https://github.com/expo/expo/pull/3386))
- renamed `IntentLauncherAndroid` to `IntentLauncher` and changed signature of `startActivityAsync` method by [@tsapeta](https://github.com/tsapeta) ([#3427](https://github.com/expo/expo/pull/3427))
- fixed crash in `WebBrowser.openBrowserAsync` when there is no browser supporting `customtabs` on Android by [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- `WebBrowser.openBrowserAsync` on Android resolves promise on opening Custom Tabs instead of on closing by [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- `WebBrowser.dismissBrowser` throws `UnavailabilityError` [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- added `staysActiveInBackground` audio mode option that selects whether audio playback or recording should continue when the app is in background by [@sjchmiela](https://github.com/sjchmiela) and [@redpandatronicsuk](https://github.com/redpandatronicsuk) ([#3498](https://github.com/expo/expo/pull/3498))
- renamed the `EncodingTypes` attribute to `EncodingType` in the FileSystem module docs to match changes in the source code by [@sergeichestakov](https://github.com/sergeichestakov) ([#3997](https://github.com/expo/expo/pull/3997))
- added a warning printed when attempting to store a value longer than 2048 bytes in the `SecureStore`. (Since SDK35 it will throw an error.) [@dsokal](https://github.com/dsokal) ([#4084](https://github.com/expo/expo/pull/4084))
- added `UMAppDelegateWrapper` which allows easy integration between unimodules and `AppDelegate` callbacks by [@Szymon20000](https://github.com/Szymon20000) ([#3917](https://github.com/expo/expo/pull/3917))
- changed `Constants.platform.ios.buildNumber` and `Constants.platform.android.versionCode` to `null` when running an app in Expo Client by [@dsokal](https://github.com/dsokal) ([#4203](https://github.com/expo/expo/pull/4203))
- upgraded `react-native-maps` to `0.24.2` by [@sjchmiela](https://github.com/sjchmiela) ([#3389](https://github.com/expo/expo/pull/3389), [#4158](https://github.com/expo/expo/pull/4158), ejected projects will need to add `HAVE_GOOGLE_MAPS=1` preprocessor definition to `Podfile`)
- removed option `sortBy.id` in `expo-media-library` by [@jkhales](https://github.com/jkhales) ([#4221](https://github.com/expo/expo/pull/4221))

### 🎉 New features

- updated `react-native-view-shot` to `2.6.0` by [@sjchmiela](https://github.com/sjchmiela) ([#4175](https://github.com/expo/expo/pull/4175))
- added `VideoThumbnails` API allowing you to thumbnail videos by [@graszka22](https://github.com/graszka22) ([#3980](https://github.com/expo/expo/pull/3980))
- upgraded `react-native-lottie` to `2.6.1` by [@sjchmiela](https://github.com/sjchmiela) ([#4147](https://github.com/expo/expo/pull/4147))
- `BarCodeScanner` is now returning barcode's bounding box [@Szymon20000](https://github.com/Szymon20000) ([#2904](https://github.com/expo/expo/pull/2904))
- added method `Speech.getAvailableVoicesAsync()` [@Szymon20000](https://github.com/Szymon20000) ([#3423](https://github.com/expo/expo/pull/3423))
- added `BackgroundFetch` support for Android by [@tsapeta](https://github.com/tsapeta) ([#3281](https://github.com/expo/expo/pull/3281))
- incorporated `react-native-webview@5.4.6` into Expo SDK by [@sjchmiela](https://github.com/sjchmiela) ([#3748](https://github.com/expo/expo/pull/3748))
- added support for overriding MIME type in `IntentLauncherAndroid.startActivityAsync` for Android by [@rhunt4675](https://github.com/rhunt4675) ([#3300](https://github.com/expo/expo/pull/3300))
- added `Location.enableNetworkProviderAsync` method to ask the user to turn on high accuracy location services by [@tsapeta](https://github.com/tsapeta) ([#3273](https://github.com/expo/expo/pull/3273))
- upgraded Facebook Audience Network SDK dependency to 5.1.1 (iOS) by [@sjchmiela](https://github.com/sjchmiela) ([#3394](https://github.com/expo/expo/pull/3394))
- upgraded Facebook Core- and LoginKit dependency to 4.40.0 by [@sjchmiela](https://github.com/sjchmiela) ([#3394](https://github.com/expo/expo/pull/3394))
- upgraded Facebook SDK dependency to 5.0.1 (Android) by [@sjchmiela](https://github.com/sjchmiela)
- upgraded `react-native-webview` to `5.8.1` by [@sjchmiela](https://github.com/sjchmiela) ([#4146](https://github.com/expo/expo/pull/4146))
- added Firebase integration to `expo-analytics-segment` by [@sjchmiela](https://github.com/sjchmiela) ([#3615](https://github.com/expo/expo/pull/3615))
- added support for new arguments in `WebBrowser.openBrowserAsync` as described in [the documentation](https://docs.expo.io/versions/latest/sdk/webbrowser/) by [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- added tags support in `KeepAwake.activate` and `KeepAwake.deactivate` by [@mczernek](https://github.com/mczernek) [#3747](https://github.com/expo/expo/pull/3747)
- added `deferredUpdatesInterval` and `deferredUpdatesDistance` options that defer background location updates by [@tsapeta](https://github.com/tsapeta) ([#3548](https://github.com/expo/expo/pull/3548))
- added `foregroundService` option to background location (Android Oreo and newer) by [@tsapeta](https://github.com/tsapeta) ([#3837](https://github.com/expo/expo/pull/3837))
- added support for picking animated GIFs with `ImagePicker` by [@sjchmiela](https://github.com/sjchmiela) ([#3844](https://github.com/expo/expo/pull/3844))
- added support for headers in `downloadAsync` method in `FileSystem` by [@mczernek](https://github.com/mczernek) ([#3911](https://github.com/expo/expo/pull/3911))
- added support for custom poster styles in `Video` by [@sjchmiela](https://github.com/sjchmiela) ([#4165](https://github.com/expo/expo/issues/4165))
- added `pausesUpdatesAutomatically` option to automatically pause background location updates based on the `activityType` by [@tsapeta](https://github.com/tsapeta) ([#4167](https://github.com/expo/expo/pull/4167))
- added ability to load fonts by remote URI by [@seekshiva](https://github.com/seekshiva) ([#2745](https://github.com/expo/expo/pull/2745))
- added support for 64 bit platforms by [@wkozyra95](https://github.com/wkozyra95) ([#4565](https://github.com/expo/expo/pull/4565))

### 🐛 Bug fixes

- fixed several windows compatibility issues with `expo-yarn-workspaces` by [@nattyrice](https://github.com/nattyrice)
- fixed several issues related to `expo-av` by [@Szymon20000](https://github.com/Szymon20000) ([#3539](https://github.com/expo/expo/pull/3539))
- `Location.getCurrentPositionAsync` and `Location.watchPositionAsync` are now automatically asking for high accuracy location services by [@tsapeta](https://github.com/tsapeta) ([#3273](https://github.com/expo/expo/pull/3273))
- fix `Location.getCurrentPositionAsync` hanging on simultaneous calls by [@tsapeta](https://github.com/tsapeta) ([#3273](https://github.com/expo/expo/pull/3273))
- fix `ImagePicker.launchImageLibraryAsync` and `ImageManipulator.manipulateAsync` in SDKs lower than 32 [@bbarthec](https://github.com/bbarthec) ([#3159](https://github.com/expo/expo/pull/3159))
- fix app crash when attempting to `console.log(Object.create(null))` by [@juangl](https://github.com/juangl) ([#3143](https://github.com/expo/expo/pull/3143))
- `GoogleSignInOptions.offlineAccess` is now corrected `GoogleSignInOptions.isOfflineEnabled`
- fix `SMS.sendSMSAsync` crash on android for empty addresses list. Promise won't be rejected when there is no TELEPHONY feature on Android device, only when there is no SMS app by [@mczernek](https://github.com/mczernek) ([#3656](https://github.com/expo/expo/pull/3656))
- fix MediaPlayer not working on Android. by [@mczernek](https://github.com/mczernek) ([#3768](https://github.com/expo/expo/pull/3768))
- fix big `OkHttpClient` memory usage on Android (reuse instances) by [@sjchmiela](https://github.com/sjchmiela) ([#4264](https://github.com/expo/expo/pull/4264))
- fixed `Localization.isRTL` always being `true` on iOS by [@sjchmiela](https://github.com/sjchmiela) ([#3792](https://github.com/expo/expo/pull/3792))
- fixed adding/removing react children to `Camera` preview on Android by [@bbarthec](https://github.com/bbarthec) ([#3904](https://github.com/expo/expo/pull/3904))
- changed `FileSystem` requests timeout for downloading resumables from 10 seconds to 60 seconds on Android (now the timeout is 60s on both platforms) by [@Szymon20000](https://github.com/Szymon20000) ([#3872](https://github.com/expo/expo/pull/3872))
- removed unwanted downsampling of big images when using `ImageManipulator` on Android by [@bbarthec](https://github.com/bbarthec) ([#3928](https://github.com/expo/expo/pull/3928))
- fixed tablet splash always being shown in Expo Client if specified by [@GfxKai](https://github.com/GfxKai) ([#3538](https://github.com/expo/expo/pull/3538))
- the `properties` parameter of `Segment.screenWithProperties` is now a `{ [key: string]: any }`, instead of a `string` by [@juampi92](https://github.com/juampi92) ([#4053](https://github.com/expo/expo/pull/4053))
- allow manipulating `http://` and `https://` files using `ImageManipulator` on iOS by [@bbarthec](https://github.com/bbarthec) ([#3982](https://github.com/expo/expo/pull/3982))
- providing `onPlaybackStatusUpdate` property to `Video` doesn't show a warning anymore by [@sjchmiela](https://github.com/sjchmiela) ([#4130](https://github.com/expo/expo/pull/4130))
- calling `FileSystem.downloadAsync` will now raise an error when a target local directory doesn't exist by [@dsokal](https://github.com/dsokal) ([#4142](https://github.com/expo/expo/pull/4142))
- flush UI blocks when needed, which fixes eg. `Camera.takePicture` not resolving on iOS by [@sjchmiela](https://github.com/sjchmiela) ([#4125](https://github.com/expo/expo/pull/4125))
- fixed `MediaLibrary.createAssetAsync` crashing when supplying local asset URIs without `file://` protocol by [@tsapeta](https://github.com/tsapeta) ([#4189](https://github.com/expo/expo/pull/4189))
- fixed `EXC_BAD_ACCESS` crashes on startup on iOS below 12.0 by [@tsapeta](https://github.com/tsapeta) ([#4227](https://github.com/expo/expo/pull/4227))
- fix `jest-expo` Jest executable not starting Node on Windows by [@Artorp](https://github.com/Artorp) ([#3477](https://github.com/expo/expo/pull/3477))
- fixed crashes in `TaskManager` due to jobs queue being full by [@tsapeta](https://github.com/tsapeta) ([#4247](https://github.com/expo/expo/pull/4247))
- allow console.log() function to log truncated large files instead of reporting a PayloadTooLargeError. [@vivianzzhu91](https://github.com/vivianzzhu91) ([#4419](https://github.com/expo/expo/pull/4419))
- fixed sorting in `MediaLibrary.getAssetsAsync` by [@ninjaachibi](https://github.com/ninjaachibi) ([#4420](https://github.com/expo/expo/pull/4420))

## 32.0.0

### 🛠 Breaking changes

- deprecated `import { Font } from 'expo-font'` in favor of individually named exports (`import * as Font from expo-font`) for better dead-export elimination potential. Upgrade `@expo/vector-icons` if you get a warning about this. By [@ide](https://github.com/ide) ([`264c17cd`](https://github.com/expo/expo/commit/264c17cdb175021c7fd16bb461652b8ab6cb2fda))
- removed deprecated internal Expo modules (`Crypto`, `Fabric`, and `ImageCropper`), which were never part of the Expo API by [@ide](https://github.com/ide) ([#2880](https://github.com/expo/expo/pull/2880))
- removed deprecated `Expo.Fingerprint` API, which has been renamed to `Expo.LocalAuthentication` to reflect other forms of authentication (ex: FaceID) by [@ide](https://github.com/ide) ([`24e94d5`](https://github.com/expo/expo/commit/24e94d5c3c268793ec751ef07dbd31a2e41e6a8c))
- removed deprecated default export from the `expo` package. Instead of `import Expo from 'expo'`, write `import { A, B, C } from 'expo'` or `import * as Expo from 'expo'`. By [@ide](https://github.com/ide) ([#2865](https://github.com/expo/expo/pull/2865))
- removed deprecated support for passing an array into `Font.loadAsync`. This feature displayed a deprecation warning for several SDK versions so if you didn't see it, this change shouldn't affect you.
- deprecated `enableHighAccuracy` option in `Location` module in favor of `accuracy` which gives much more options by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- removed support for deprecated `onBarCodeRead` prop on `Camera` component by [@Szymon20000](https://github.com/Szymon20000) ([#2820](https://github.com/expo/expo/pull/2820)) (use `onBarCodeScanned` property)
- updated underlying Stripe dependency to 8.1.0 on Android and 13.2.0 on iOS and updated `expo-payments-stripe` with latest updates to `tipsi-stripe` (up to 6.1.2) by [@sjchmiela](https://github.com/sjchmiela) ([#2766](https://github.com/expo/expo/pull/2766)). This change dropped support for Bitcoin payments in SDK31.
- removed `READ_SMS` use of permission on Android, `SMS.sendSMSAsync` will now always resolve with `{ result: 'unknown' }` by [@esamelson](https://github.com/esamelson) ([#2982](https://github.com/expo/expo/pull/2982))
- upgraded Android build tools — Gradle to 4.10.2, Gradle plugin to 3.2.1 by [@sjchmiela](https://github.com/sjchmiela) ([`7292c27`](https://github.com/expo/expo/commit/7292c27), [`d0c8b8d`](https://github.com/expo/expo/commit/d0c8b8d))
- removed `run.sh` script from `android` directory in favor of `fastlane android start` command by [@nicknovitski](https://github.com/nicknovitski) ([`9301e95`](https://github.com/expo/expo/commit/9301e95533d4ed81a42955f64addb5001a32a236))
- removed `minSdk` application flavor from Android project (all Gradle commands in format `[verb][minSdkFlavor]minSdk[remoteKernelFlavor]Kernel[buildType]`, eg. `assembleDevMinSdkDevKernelDebug` become `[verb][remoteKernelFlavor]Kernel[buildType]`, eg. `assembleDevKernelDebug`) by [@sjchmiela](https://github.com/sjchmiela) ([`3b5e158`](https://github.com/expo/expo/commit/3b5e1583ecc210ee36b9d5772d2d7c35a6315500))
- calling `Haptic` methods on Android will now raise an error instead of a warning by [@EvanBacon](https://github.com/EvanBacon) ([#2787](https://github.com/expo/expo/pull/2787))

### 🎉 New features

- added locales on Android (`[ar, cs, de, es-rGT, fr, he, jt, ja, ko, nb, nl, pl, pt-rBR, ru-rRU, vi, zh, zh-rCN, zh-rTW]`) in `ImagePicker.{launchImageLibraryAsync, launchCameraAsync}` when using `{ allowsEditing: true }` option by [@bbarthec](https://github.com/bbarthec) ([#2955](https://github.com/expo/expo/pull/2955))
- added support for passing refs created by `React.createRef` to `takeSnapshotAsync` by [@sjchmiela](https://github.com/sjchmiela) ([#2771](https://github.com/expo/expo/pull/2771))
- upgraded Gradle plugin (to 3.2.1) and its wrapper (to 4.10.2) by [@sjchmiela](https://github.com/sjchmiela) ([#2716](https://github.com/expo/expo/pull/2716))
- added new `TaskManager` module that paves the way to background code execution by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- added API for background location updates by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- added geofencing to `Location` module by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- added new `BackgroundFetch` module (iOS only) by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- allowed Expo Jest preset to use TypeScript files by [@dalcib](https://github.com/dalcib) ([#2810](https://github.com/expo/expo/pull/2810))
- allowed selecting voice used by `Speech` on iOS by [@pyankoff](https://github.com/pyankoff) ([#2833](https://github.com/expo/expo/pull/2833))
- removed obsolete assets from standalone apps by [@sjchmiela](https://github.com/sjchmiela) ([#2850](https://github.com/expo/expo/pull/2850))
- added support for notifications categories by [@Szymon20000](https://github.com/Szymon20000) and [@sjchmiela](https://github.com/sjchmiela) ([#2316](https://github.com/expo/expo/pull/2316), [#2557](https://github.com/expo/expo/pull/2557))
- upgraded libraries: `react-native-gesture-handler` to `1.0.12`, `react-native-screens` to `1.0.0-alpha.22`, `react-native-reanimated` to `1.0.0-alpha.11` by [@tsapeta](https://github.com/tsapeta) and [@sjchmiela](https://github.com/sjchmiela) ([#2977](https://github.com/expo/expo/pull/2977), [#3078](https://github.com/expo/expo/pull/3078), [#3172](https://github.com/expo/expo/pull/3172), [#3232](https://github.com/expo/expo/pull/3232))

### 🐛 Bug fixes

- fixed problem with rerendering SVG (updated `react-native-svg` to `8.0.10`) by [@Szymon20000](https://github.com/Szymon20000) ([#3019](https://github.com/expo/expo/pull/3019))
- fixed wrong type casting in SQLite result [@Szymon20000](https://github.com/Szymon20000) ([#3005](https://github.com/expo/expo/pull/3005))
- fixed sending multiple consecutive SMS messages on iOS [@bbarthec](https://github.com/bbarthec) ([#2939](https://github.com/expo/expo/pull/2939))
- fixed GLView initialization with texture of size 0 on Android by [@bbarthec](https://github.com/bbarthec) ([#2907](https://github.com/expo/expo/pull/2907))
- fixed app cache size blowing up when using `ImagePicker` by [@sjchmiela](https://github.com/sjchmiela) ([#2750](https://github.com/expo/expo/pull/2750))
- fixed compression in ImagePicker by [@Szymon20000](https://github.com/Szymon20000) ([#2746](https://github.com/expo/expo/pull/2746))
- fixed `FileSystem` forbidding access to external directories by [@Szymon20000](https://github.com/Szymon20000) ([#2748](https://github.com/expo/expo/pull/2748), [#2808](https://github.com/expo/expo/pull/2808))
- upgraded Facebook SDK dependency to 4.39 by [@Szymon20000](https://github.com/Szymon20000) and [@sjchmiela](https://github.com/sjchmiela) ([#2710](https://github.com/expo/expo/pull/2710), [#3243](https://github.com/expo/expo/pull/3243))
- fixed object not beign decycled when sending logs to remote console by [@sjchmiela](https://github.com/sjchmiela) ([#2598](https://github.com/expo/expo/pull/2598))
- unified linear gradient behavior across platforms by [@sjchmiela](https://github.com/sjchmiela) ([#2624](https://github.com/expo/expo/pull/2624))
- fixed device orientation not being used when recording videos by [@flippinjoe](https://github.com/flippinjoe) ([expo-camera#2](https://github.com/expo/expo-camera/pull/2))
- fixed handling `quality` option passed to `Camera.takePictureAsync` on Android properly by [@Szymon20000](https://github.com/Szymon20000) ([#2692](https://github.com/expo/expo/pull/2692))
- fixed resumable downloads on iOS by base64-encoding `resumeData` by [@Szymon20000](https://github.com/Szymon20000) ([#2698](https://github.com/expo/expo/pull/2698))
- fixed `Permissions.LOCATION` issue that wouldn't allow asking for it in a multi-permission call by [@sjchmiela](https://github.com/sjchmiela) ([304fe560](https://github.com/expo/expo/commit/304fe560500b662be53be2c1d5a06445ad9d3702))
- fixed `onActivityResult` not being called on listeners registered to `ReactContext` by [@sjchmiela](https://github.com/sjchmiela) ([#2768](https://github.com/expo/expo/pull/2768))
- fixed fatal exception being thrown sometimes on Android when detecting barcodes by [@sjchmiela](https://github.com/sjchmiela) ([#2772](https://github.com/expo/expo/pull/2772))
- fixed `GLView.takeSnapshotAsync` crashing on Android if `framebuffer` option is specified by [@tsapeta](https://github.com/tsapeta) ([#2888](https://github.com/expo/expo/pull/2888))
- fixed `onPlaybackStatusUpdate` not being called with `didJustFinish: true` when playing with looping enabled on Android by [@sjchmiela](https://github.com/sjchmiela) ([#2923](https://github.com/expo/expo/pull/2923))
- fixed bundle building/downloading progress indicator not showing in ejected apps by [@sjchmiela](https://github.com/sjchmiela) ([#2951](https://github.com/expo/expo/pull/2951), [#2954](https://github.com/expo/expo/pull/2954))
- fixed `subscription.remove()` not calling native `stopObserving()` for universal modules by [@ide](https://github.com/ide) ([#2897](https://github.com/expo/expo/pull/2897))
- fixed calendar ID being returned as integer instead of a string on Android (when calling eg. `Calendar.createCalendarAsync`) by [@Szymon20000](https://github.com/Szymon20000) ([#3004](https://github.com/expo/expo/pull/3004))
- fixed wrong fling direction for inverted `ScrollView`s on Android by [@mandrigin](https://github.com/mandrigin) (pulled in from React Native [facebook/react-native@b971c5b](https://github.com/facebook/react-native/commit/b971c5beb8c7f90543ea037194790142f4f57c80))
- fixed snapping Android `ScrollView`s with `pagingEnabled` by [@olegbl](https://github.com/olegbl) (pulled in from React Native [facebook/react-native@0869e54](https://github.com/facebook/react-native/commit/0869e546fe1448f6c56b4ae97e41e8a67278d7dd))
- fixed `Contacts` failing to add and remove contacts on Android by [@tsapeta](https://github.com/tsapeta) ([#3017](https://github.com/expo/expo/pull/3017))
- fixed `Permissions.CONTACTS` not asking for Android's `WRITE_CONTACTS` permission by [@tsapeta](https://github.com/tsapeta) ([#3017](https://github.com/expo/expo/pull/3017))

## 31.0.6

- fixed `expo-cli` wrapper failing on Windows by [@fson](https://github.com/fson) ([#2853](https://github.com/expo/expo/pull/2853))

## 31.0.5

- updated `react-native-maps` JS dependency to `0.22.1` by [@sjchmiela](https://github.com/sjchmiela) ([`ebb536c`](https://github.com/expo/expo/commit/ebb536c82f2b64fd6c71f37d589a028cf04b85c8))

## 31.0.4

- upgraded `react-native-gesture-handler` JS dependency to `1.0.9` by [@brentvatne](https://github.com/brentvatne) ([`ebb5cec`](https://github.com/expo/expo/commit/ebb5cecf3f74da1bd7868f66b9c0ba8717a70cf1))

## 31.0.3

- fix filtering out warnings about `require` cycles in `node_modules` by [@serhiipalash](https://github.com/serhiipalash) ([`aaf72bf`](https://github.com/expo/expo/commit/aaf72bf42e197e5cc300a3f722103ad5cedc3a90))
- fix `resizeMode` prop of `Video` component by [@ide](https://github.com/ide) ([`886b67d`](https://github.com/expo/expo/commit/886b67d0967c0f3d55a561fe7766e3df414c80bf))

## 31.0.2

- pass `undefined` through for `startPoint` and `endPoint` rather than `null` in `LinearGradient` by [@brentvatne](https://github.com/brentvatne) ([`643969`](https://github.com/expo/expo/commit/6439691431dbb9b443bb69d788129cf3ff25ae3b))
- remove require cycle in AV by [@ide](https://github.com/ide) ([`18d54da`](https://github.com/expo/expo/commit/18d54daad814ae7e8e6e359daf274f80ece8352d))

## 31.0.1

- filter out warnings about `require` cycles in `node_modules` by [@ide](https://github.com/ide) ([`68d130d`](https://github.com/expo/expo/commit/68d130d4b0e58c8faa050bfe7bd7c56ffa05e2ef))

## 31.0.0 (Partial Changelog)

### 🛠 Breaking changes

- The default export from the expo package is deprecated in favor of named exports to pave the way for static analysis tools by [@ide](https://github.com/ide) ([#2387](https://github.com/expo/expo/pull/2387))
- remove default `user_friends` permission when authenticating with `Facebook` module by [@EvanBacon](https://github.com/EvanBacon) ([`2ad86fad`](https://github.com/expo/expo/commit/2ad86fada7aacfa8fa0d50910e6d0c6130ca4840))
- dropped iOS 9 support by [@Szymon20000](https://github.com/Szymon20000) ([#2324](https://github.com/expo/expo/pull/2324))
- upgrade `react-native-svg` to `8.0.8` by [@sjchmiela](https://github.com/sjchmiela) and [@esamelson](https://github.com/esamelson) ([#2492](https://github.com/expo/expo/pull/2492))
- upgrade React Native to `v0.57.1` by [@ide](https://github.com/ide) (series of commits, eg. [`250589`](https://github.com/expo/expo/commit/250589c452902e27f6981c79a72390c4bf6c9b31))
- change `translation` field to `adTranslation` in an ad object returned by `FacebookAds.NativeAdView` by [@ide](https://github.com/ide) ([`ece59aa`](https://github.com/expo/expo/commit/ece59aa35daf769073373141c248239c967ccafd))
- refreshed, bug-free `Localization` API by [@EvanBacon](https://github.com/EvanBacon) ([#2327](https://github.com/expo/expo/pull/2327))
- drop Android 4.4 support by [@bbarthec](https://github.com/bbarthec) ([#2367](https://github.com/expo/expo/pull/2367))
- upgrade underyling Facebook SDK native dependencies to `4.37.0` by [@sjchmiela](https://github.com/sjchmiela) ([#2508](https://github.com/expo/expo/pull/2508))
- upgrade `react-native-view-shot` to `2.5.0` by [@sjchmiela](https://github.com/sjchmiela) ([#2518](https://github.com/expo/expo/pull/2518))
- upgrade `react-native-maps` to `0.22.1` by [@tsapeta](https://github.com/tsapeta) and [@sjchmiela](https://github.com/sjchmiela) ([#2496](https://github.com/expo/expo/pull/2496), [#2680](https://github.com/expo/expo/pull/2680))
- `FacebookAds.TriggerableView` is now `FacebookAds.AdTriggerView`
- `FacebookAds.MediaView` is now `FacebookAds.AdMediaView`
- The Speech API’s "onError" function is passed an `Error` instead of a string
- Flow types have been removed as we begin to migrate to TypeScript over the next few SDK releases
- Several Haptic enum types have been renamed: NotificationTypes → NotificationFeedbackType, ImpactStyles → ImpactFeedbackStyle
- Several AR enum types have been renamed: BlendShapes → BlendShape, FaceAnchorProps → FaceAnchorProp, PlaneDetectionTypes → PlaneDetection, WorldAlignmentTypes → WorldAlignment, EventTypes → EventType, AnchorTypes → AnchorType, AnchorEventTypes → AnchorEventType, FrameAttributes → FrameAttribute, TrackingStates → TrackingState, TrackingStateReasons → TrackingStateReason, TrackingConfigurations → TrackingConfiguration
- `Audio.Sound.create` has been renamed to `createAsync`
- Upgrade Babel to `7.0.0` by [@ide](https://github.com/ide) ([#2373](https://github.com/expo/expo/pull/2373))

### 🎉 New features

- return permitted/declined permissions arrays when authenticating with `Facebook` module by [@EvanBacon](https://github.com/EvanBacon) ([`2ad86fad`](https://github.com/expo/expo/commit/2ad86fada7aacfa8fa0d50910e6d0c6130ca4840))
- Base64 encoding support for `FileSystem` by [@EvanBacon](https://github.com/EvanBacon) ([#2328](https://github.com/expo/expo/pull/2328))
- video stabilization support in `Camera` by [@n8](https://github.com/n8) ([#2241](https://github.com/expo/expo/pull/2241))
- add support for asking for an authorization to always access location data by [@sjchmiela](https://github.com/sjchmiela) ([#2343](https://github.com/expo/expo/pull/2343))
- upgrade `react-native-gesture-handler` to `1.0.8`, `react-native-reanimated` to `1.0.0-alpha.10`, `react-native-screens` to `1.0.0-alpha.15` by [@brentvatne](https://github.com/brentvatne) ([`eb2a463`](https://github.com/expo/expo/commit/eb2a463304aefc798bd8fab29e9c89507e0710af), [`9bf1754`](https://github.com/expo/expo/commit/9bf17547f857865ffa01f4bacd7fc0b18e4f7ffa))
- add `Segment.{get,set}EnabledAsync` feature by [@sjchmiela](https://github.com/sjchmiela) ([#2412](https://github.com/expo/expo/pull/2412))
- add an Android-only `timeout` option to `Location.getCurrentPositionAsync` by [@bbarthec](https://github.com/bbarthec) ([#2369](https://github.com/expo/expo/pull/2369))
- add support for providing custom headers to send when requesting media source by [@sjchmiela](https://github.com/sjchmiela) ([#2431](https://github.com/expo/expo/pull/2431))
- add `Segment.alias` support by [@sjchmiela](https://github.com/sjchmiela) ([#2440](https://github.com/expo/expo/pull/2440))
- upgrade Android JSC to `r224109` by [@esamelson](https://github.com/esamelson) and [@Kmakinator](https://github.com/Kmakinator) ([#2437](https://github.com/expo/expo/pull/2437))
- add `LocalAuthentication.supportedAuthenticationTypes` method by [@bbarthec](https://github.com/bbarthec) ([#2450](https://github.com/expo/expo/pull/2450))
- add support for new Apple devices to `Constants` by [@tsapeta](https://github.com/tsapeta) ([#2410](https://github.com/expo/expo/pull/2410))

### 🐛 Bug fixes

- fix `react-native-svg` `toDataURL()` method throwing error (`undefined is not an object (evaluating 'RNSVGSvgViewManager.toDataURL')`) on Android by [@sjchmiela](https://github.com/sjchmiela) ([#2492](https://github.com/expo/expo/pull/2492/files#diff-e7d5853f05c039302116a6f919672972))
- fix nested traits and properties being stringified on Android in the Segment module, instead of being reported as objects by [@sjchmiela](https://github.com/sjchmiela) ([expo-analytics-segment#2](https://github.com/expo/expo-analytics-segment/issues/2), [#2517](https://github.com/expo/expo/pull/2517))
- handle specified `behavior` on Android when authenticating with `Facebook` by [@EvanBacon](https://github.com/EvanBacon) ([`2ad86fad`](https://github.com/expo/expo/commit/2ad86fada7aacfa8fa0d50910e6d0c6130ca4840))
- fix `MediaLibrary` returning stale assets from `getAssetsAsync` by [@Aasfga](https://github.com/Aasfga) ([#2106](https://github.com/expo/expo/issues/2106), [`09cba8d`](https://github.com/expo/expo/commit/09cba8d1cc271a526e20c4c0f817a8370b7e1a56))
- fix `Pedometer.watchStepCount` erroring on Android by [@Szymon20000](https://github.com/Szymon20000) ([#2147](https://github.com/expo/expo/issues/2147), [`dea2967`](https://github.com/expo/expo/commit/dea2967c19ac948f84decedf311212b468b61945))
- fix Branch links not working when first opened on iOS by [@AdamPD](https://github.com/AdamPD) ([#2158](https://github.com/expo/expo/pull/2158))
- asking for `Permissions.BRIGHTNESS` no longer throws `AbstractMethodError` exception on some Android devices by [@bbarthec](https://github.com/bbarthec) ([#2342](https://github.com/expo/expo/pull/2342))
- properly handle some screen orientation configurations (on iPhone X `PortraitUpsideDown` is not supported) by changing sync `ScreenOrientation.allow` method to async `ScreenOrientation.allowAsync` throwing an error when trying to set an unsupported screen orientation configuration by [@bbarthec](https://github.com/bbarthec) ([`af2d7e3`](https://github.com/expo/expo/commit/af2d7e3c848cf49a47378970f23e080e1ada6755))
- fix `Linking.getInitialURL` returning a `customschemed://` URL instead of the one that really redirected to the application by [@schneidmaster](https://github.com/schneidmaster) ([#2352](https://github.com/expo/expo/pull/2352))
- fix `FaceDetector` settings not being applied on the first run by [@sjchmiela](https://github.com/sjchmiela) ([#2308](https://github.com/expo/expo/pull/2308))
- update `cameraview` AAR for it to contain `getCameraId()` method by [@sjchmiela](https://github.com/sjchmiela) ([expo-camera#4](https://github.com/expo/expo-camera/issues/4), [#2323](https://github.com/expo/expo/pull/2323))
- fix rerendering of ads provided by `FacebookAds` module by [@ide](https://github.com/ide) ([`85f2014`](https://github.com/expo/expo/commit/85f2014c2aa767892a37f194ec2c86f8f36d61d4))
- fix a fatal exception being thrown when pausing a resumable download on iOS 12 by [@sjchmiela](https://github.com/sjchmiela) ([#2404](https://github.com/expo/expo/pull/2404))
- fix universal modules being initialized twice by [@sjchmiela](https://github.com/sjchmiela) ([#2417](https://github.com/expo/expo/pull/2417))
- fix media players refusing to redirect from a HTTPS URL to another HTTPS URL on Android by [@sjchmiela](https://github.com/sjchmiela) ([#2403](https://github.com/expo/expo/pull/2403))
- fix `SMS.sendSMSAsync` not returning correct result on Android by [@bbarthec](https://github.com/bbarthec) ([#2452](https://github.com/expo/expo/pull/2452))
- fix barcode scanner not working on Pixel 2 by [@alexshikov](https://github.com/alexshikov) ([#2081](https://github.com/expo/expo/pull/2081))
- fix “Font doesn't support automatic scaling” errors on iOS < 12 by [@sjchmiela](https://github.com/sjchmiela) ([#2480](https://github.com/expo/expo/pull/2480))
- fix missing “Orientation” tag in `ImagePicker` EXIF data by [@bbarthec](https://github.com/bbarthec) ([#2432](https://github.com/expo/expo/pull/2432))
- fix `react-native-screens` compatibility with Expo by [@tsapeta](https://github.com/tsapeta) ([#2509](https://github.com/expo/expo/pull/2509))
