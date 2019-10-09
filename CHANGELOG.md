# Changelog

This is the log of notable changes to the Expo client that are developer-facing.

## master

### 📚 3rd party library updates

### 🛠 Breaking changes

- **`jest-expo`**: Removed `mockPlatformIOS()`, `mockPlatformAndroid()`, `mockPlatformWeb()`, `describeCrossPlatform()` in favor of platform specific presets like `jest-expo/universal`.

### 🎉 New features

- Added rich content supports for push notifications. ([#4787](https://github.com/expo/expo/pull/4787) by [@hesyifei](https://github.com/hesyifei))
- Added `MediaLibrary.saveToAssetsAsync` function that can work without `CAMERA_ROLL` permission. ([#5678](https://github.com/expo/expo/pull/5678) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed crash when `BarCodeScanner` was mounted more than 128 times. ([#5719](https://github.com/expo/expo/pull/5719) by [@geovannimp](https://github.com/geovannimp))
- Fixed URI parsing in `expo-video-thumbnails`. ([#5711](https://github.com/expo/expo/pull/5711) by [@lukmccall](https://github.com/lukmccall))

## 35.0.0

### 📚 3rd party library updates

- `react-native-maps` updated from `0.24.0` to `0.25.0`
- `react-native-reanimated` updated from `1.1.0` to `1.2.0`
- `react-native-screens` updated from `1.0.0-alpha.22` to `1.0.0-alpha.23`
- `react-native-svg` updated from `9.5.1` to `9.9.2`
- `react-native-webview` updated from `5.12.0` to `7.0.5`

### 🛠 Breaking changes

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
