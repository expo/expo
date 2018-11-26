# Changelog

This is the log of notable changes to the Expo client that are developer-facing.

## master

### 🛠 Breaking changes

- deprecated `import { Font } from 'expo-font'` in favor of individually named exports (`import * as Font from expo-font`) for better dead-export elimination potential. Upgrade `@expo/vector-icons` if you get a warning about this.
- removed deprecated internal Expo modules (`Crypto`, `Fabric`, and `ImageCropper`), which were never part of the Expo API ([#2880](https://github.com/expo/expo/pull/2880))
- removed deprecated `Expo.Fingerprint` API, which has been renamed to `Expo.LocalAuthentication` to reflect other forms of authentication (ex: FaceID)
- removed deprecated default export from the `expo` package. Instead of `import Expo from 'expo'`, write `import { A, B, C } from 'expo'` or `import * as Expo from 'expo'`. ([#2865](https://github.com/expo/expo/pull/2865))
- removed deprecated support for passing an array into `Font.loadAsync`. This feature displayed a deprecation warning for several SDK versions so if you didn't see it, this change shouldn't affect you.
- updated underlying Stripe dependency to 8.1.0 on Android and 13.2.0 on iOS and updated `expo-payments-stripe` with latest updates to `tipsi-stripe` (up to 6.1.2) by [@sjchmiela](https://github.com/sjchmiela) ([#2766](https://github.com/expo/expo/pull/2766)). This change dropped support for Bitcoin payments in SDK31.
- removed `minSdk` application flavor from Android project (all Gradle commands in format `[verb][minSdkFlavor]minSdk[remoteKernelFlavor]Kernel[buildType]`, eg. `assembleDevMinSdkDevKernelDebug` become `[verb][remoteKernelFlavor]Kernel[buildType]`, eg. `assembleDevKernelDebug`) by [@sjchmiela](https://github.com/sjchmiela) ([`3b5e158`](https://github.com/expo/expo/commit/3b5e1583ecc210ee36b9d5772d2d7c35a6315500))

### 🎉 New features

- added support for passing refs created by `React.createRef` to `takeSnapshotAsync` by [@sjchmiela](https://github.com/sjchmiela) ([#2771](https://github.com/expo/expo/pull/2771))
- upgraded Gradle plugin (to 3.2.1) and its wrapper (to 4.10.2) by [@sjchmiela](https://github.com/sjchmiela) ([#2716](https://github.com/expo/expo/pull/2716))

### 🐛 Bug fixes

- fix sending multiple consecutive SMS messages on iOS [@bbarthec](https://github.com/bbarthec) ([#2939](https://github.com/expo/expo/pull/2939))
- fix GLView initialization with texture of size 0 on Android by [@bbarthec](https://github.com/bbarthec) ([#2907](https://github.com/expo/expo/pull/2907))
- fix app cache size blowing up when using `ImagePicker` by [@sjchmiela](https://github.com/sjchmiela) ([#2750](https://github.com/expo/expo/pull/2750))
- [iOS] Relaxed file system permissions when in Expokit by [@Szymon20000](https://github.com/Szymon20000)
([#2808](https://github.com/expo/expo/pull/2808))
- fix compression in ImagePicker by [@Szymon20000](https://github.com/Szymon20000) ([#2746](https://github.com/expo/expo/pull/2746))
- fix `FileSystem` forbidding access to external directories by [@Szymon20000](https://github.com/Szymon20000)
([#2748](https://github.com/expo/expo/pull/2748))
- upgrade Facebook SDK dependency to 4.38.1 by [@Szymon20000](https://github.com/Szymon20000)
([#2710](https://github.com/expo/expo/pull/2710))
- decycle objects when sending logs to remote console by [@sjchmiela](https://github.com/sjchmiela) ([#2598](https://github.com/expo/expo/pull/2598))
- unify linear gradient behavior across platforms by [@sjchmiela](https://github.com/sjchmiela) ([#2624](https://github.com/expo/expo/pull/2624))
- use device orientation for recorded videos by [@flippinjoe](https://github.com/flippinjoe) ([expo-camera#2](https://github.com/expo/expo-camera/pull/2))
- handle `quality` option passed to `Camera.takePictureAsync` on Android properly by [@Szymon20000](https://github.com/Szymon20000) ([#2683](https://github.com/expo/expo/pull/2683))
- fix resumable downloads on iOS by base64-encoding `resumeData` by [@Szymon20000](https://github.com/Szymon20000) ([#2698](https://github.com/expo/expo/pull/2698))
- fix `Permissions.LOCATION` issue that wouldn't allow asking for it in a multi-permission call by [@sjchmiela](https://github.com/sjchmiela) ([304fe560](https://github.com/expo/expo/commit/304fe560500b662be53be2c1d5a06445ad9d3702))
- fix `onActivityResult` not being called on listeners registered to `ReactContext` by [@sjchmiela](https://github.com/sjchmiela) ([#2768](https://github.com/expo/expo/pull/2768))
- fix fatal exception being thrown sometimes on Android when detecting barcodes by [@sjchmiela](https://github.com/sjchmiela) ([#2772](https://github.com/expo/expo/pull/2772))
- fix GLView.takeSnapshotAsync crashing on Android if `framebuffer` option is specified by [@tsapeta](https://github.com/tsapeta) ([#2888](https://github.com/expo/expo/pull/2888))
- fix `onPlaybackStatusUpdate` not being called with `didJustFinish: true` when playing with looping enabled on Android by [@sjchmiela](https://github.com/sjchmiela) ([#2923](https://github.com/expo/expo/pull/2923))

## 31.0.3

- fix filtering out warnings about `require` cycles in `node_modules` by [@serhiipalash](https://github.com/serhiipalash) ([`aaf72bf`](https://github.com/expo/expo/commit/aaf72bf42e197e5cc300a3f722103ad5cedc3a90))
- fix `resizeMode` prop of `Video` component by [@ide](https://github.com/ide) ([`886b67d`](https://github.com/expo/expo/commit/886b67d0967c0f3d55a561fe7766e3df414c80bf))

## 31.0.2

- pass `undefined` through for `startPoint` and `endPoint` rather than `null` in `LinearGradient` by [@brentvatne](https://github.com/brentvatne) ([`643969`](https://github.com/expo/expo/commit/6439691431dbb9b443bb69d788129cf3ff25ae3b))
- remove require cycle in AV by [@ide](https://github.com/ide) ([`18d54da`](https://github.com/expo/expo/commit/18d54daad814ae7e8e6e359daf274f80ece8352d))

## 31.0.1

- filter out warnings about `require` cycles in `node_modules` by [@ide](https://github.com/ide) ([`68d130d`](https://github.com/expo/expo/commit/68d130d4b0e58c8faa050bfe7bd7c56ffa05e2ef))

## 31.0.0  (Partial Changelog)

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
