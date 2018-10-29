# Changelog

This is the log of notable changes to the Expo client that are developer-facing.

## 31.0.0

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
- upgrade `react-native-maps` to `0.22.0` by [@tsapeta](https://github.com/tsapeta) ([#2496](https://github.com/expo/expo/pull/2496))

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
