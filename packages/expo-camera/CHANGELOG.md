# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.4.4 — 2023-09-11

### 🐛 Bug fixes

- Remove @koale/useworker. ([#23967](https://github.com/expo/expo/pull/23967) by [@marklawlor](https://github.com/marklawlor))

## 13.4.3 — 2023-08-29

### 🐛 Bug fixes

- On iOS, fix dead frames when starting a video recording. ([#23834](https://github.com/expo/expo/pull/23834) by [@alanjhughes](https://github.com/alanjhughes))

## 13.4.2 — 2023-07-04

### 🐛 Bug fixes

- Fix crash when onBarCodeScanned or onFacesDetected callback is removed. ([#23223](https://github.com/expo/expo/pull/23223) by [@thespacemanatee](https://github.com/thespacemanatee))

## 13.4.1 — 2023-06-28

### 🐛 Bug fixes

- Resolved an issue on Android where recording a video, even with the mute: true option, would still result in an audio permission exception. Furthermore, the mute flag was incorrectly referred to as muteValue, causing it to be consistently ignored ([#23145](https://github.com/expo/expo/pull/23145) by [@hirbod](https://github.com/hirbod))

## 13.4.0 — 2023-06-13

- Fixed `Expo camera - Cannot take landscape photos if screen orientation is locked'` on iOS. ([#21938](https://github.com/expo/expo/issues/21938) by [@chalenascholl](https://github.com/chalenascholl)) ([#21956](https://github.com/expo/expo/pull/21956) by [@chalenascholl](https://github.com/chalenascholl))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 13.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 13.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 13.2.0 — 2023-02-03

### 🐛 Bug fixes

- Fix path where simulator saves photos ([#20872](https://github.com/expo/expo/pull/20872) by [@pettomartino](https://github.com/pettomartino))
- Fixed `Cannot set prop 'barCodeScannerSettings' on view 'class expo.modules.camera.ExpoCameraView'` on Android. ([#21033](https://github.com/expo/expo/pull/21033) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 13.1.0 - 2022-11-23

### 🐛 Bug fixes

- Fix import issue on case-sensitive file systems ([#20141](https://github.com/expo/expo/pull/20141) by [@hirbod](https://github.com/hirbod))

### 💡 Others

- Use correct type for `videoStabilizationMode` option. ([#20130](https://github.com/expo/expo/pull/20130) by [@simek](https://github.com/simek))

## 13.0.0 — 2022-10-25

### 🐛 Bug fixes

- Added `bounds` property to the `BarCodeScanningResult`. ([#19519](https://github.com/expo/expo/pull/19519) by [@lukmccall](https://github.com/lukmccall))

## 13.0.0-beta.1 — 2022-10-06

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- On iOS and Android, added new `additionalExif` parameter to `takePictureAsync()` method so that users can add extra information to the photos, such as GPS coordinates. ([#18469](https://github.com/expo/expo/pull/18469) by [@alexyangjie](https://github.com/alexyangjie))
- Native module for camera view is now written in Swift using the new API. ([#18703](https://github.com/expo/expo/pull/18703) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix error when calling `takePictureAsync()` on Android emulator. ([#18704](https://github.com/expo/expo/pull/18704)) by [@keith-kurak](https://github.com/keith-kurak))
- Add `cornerPoints` to `onBarCodeScanned` on Android. ([#19357](https://github.com/expo/expo/pull/19357) by [@igoro00](https://github.com/igoro00))
- Fix error where `takePictureAsync()` saved the photo to a global cache directory that was inaccessible in Expo Go. ([#19205](https://github.com/expo/expo/pull/19205) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))
- Refactored inline Android emulator checks to use enhanced checking in `EmulatorUtilities.isRunningOnEmulator()`. ([#16177](https://github.com/expo/expo/pull/16177)) by [@kbrandwijk](https://github.com/kbrandwijk), [@keith-kurak](https://github.com/keith-kurak))

## 12.3.0 — 2022-07-07

### 🐛 Bug fixes

- On Web prevent the QR worker to be immediately cleaned up after finishing it's job to allow reusing it later (e.g. do not re-download every script upon repetitive worker launch). ([#15369](https://github.com/expo/expo/pull/15369) by [@jer-sen](https://github.com/jer-sen) and [#17833](https://github.com/expo/expo/pull/17833) by [@bbarthec](https://github.com/bbarthec))
- Fix bug on Android that would only allow you to scan one bar code. ([#17655](https://github.com/expo/expo/pull/17655) by [@witheroux](https://github.com/witheroux))

## 12.2.0 — 2022-04-18

### 🎉 New features

- Update `useWebQRScanner` to allow scanning QR codes with inverted colors (light foreground and dark background). ([#16106](https://github.com/expo/expo/pull/16106) by [@rissois](https://github.com/rissois))

### 🐛 Bug fixes

- Fix crash on Android when app is restored from background by check for null value of `pendingFaceDetectorSettings`. ([#16543](https://github.com/expo/expo/pull/16543) by [@giautm](https://github.com/giautm))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))
- Replace `CapturedPicture` type with `CameraCapturedPicture` in events callback to avoid duplicated types. ([#15936](https://github.com/expo/expo/pull/15936) by [@Simek](https://github.com/Simek))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.1.2 - 2022-02-04

### 🐛 Bug fixes

- Fix null pointer exception when barcode scanner or face detector are not installed. ([#16167](https://github.com/expo/expo/pull/16167) by [@tsapeta](https://github.com/tsapeta))

## 12.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.1.0 — 2021-12-03

### 🐛 Bug fixes

- Fix Gradle error when running Gradle from outside of the project directory. ([#15109](https://github.com/expo/expo/pull/15109) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite module to Kotlin. ([#14717](https://github.com/expo/expo/pull/14717) by [@mstach60161](https://github.com/mstach60161))
- [plugin] Use more specific gradle variable name. ([#14966](https://github.com/expo/expo/pull/14966) by [@EvanBacon](https://github.com/EvanBacon))

## 12.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 12.0.0 — 2021-09-28

### 🛠 Breaking changes

- Deprecate `getPermissionsAsync` and `requestPermissionsAsync` methods, use specific permission requesters. ([#13855](https://github.com/expo/expo/pull/13855) by [@bycedric](https://github.com/bycedric))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add `useCameraPermissions` and `useMicrophonePermissions` hooks from modules factory. ([#13855](https://github.com/expo/expo/pull/13855) by [@bycedric](https://github.com/bycedric))
- [plugin] Add monorepo support to Android config plugin for Gradle import. ([#14521](https://github.com/expo/expo/pull/14521) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix QR code scanner in expo web by updating `@koale/useworker` to `^4.0.2` ([#14138](https://github.com/expo/expo/pull/13341) by [@fguitton](https://github.com/fguitton))
- Update video codec validation to properly reject an invalid codec option. ([#13341](https://github.com/expo/expo/pull/13341) by [@ajsmth](https://github.com/ajsmth))
- Add `get/requestMicrophonePermissionsAsync()` and `get/requestCameraPermissionsAsync()` methods to named exports. ([#13621](https://github.com/expo/expo/pull/13621) by [@ajsmth](https://github.com/ajsmth))
- Fix regression in video quality option of recordAsync() ([#13659](https://github.com/expo/expo/pull/13659) by [@ajsmth](https://github.com/ajsmth))
- Update permission validation to check for only camera permissions in `initWithModuleRegistry()` ([#13690](https://github.com/expo/expo/pull/13690) by [@ajsmth](https://github.com/ajsmth))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13750](https://github.com/expo/expo/pull/13750) by [@tsapeta](https://github.com/tsapeta))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 11.1.1 — 2021-06-16

_This version does not introduce any user-facing changes._

## 11.1.0 — 2021-06-07

### 🎉 New features

- On iOS added new `codec` parameter in `recordAsync()` method and new method `getAvailableVideoCodecsAsync()` that queries the device for available video codecs. ([#12772](https://github.com/expo/expo/pull/12772) by [@ajsmth](https://github.com/ajsmth))
- Added new `requestCameraPermissionsAsync()`, `requestMicrophonePermissionsAsync()`, `getCameraPermissionsAsync()` and `getMicrophonePermissionsAsync()` methods which gives more fine-grained control over requested permissions. ([#12860](https://github.com/expo/expo/pull/12772) by [@ajsmth](https://github.com/ajsmth))

### 💡 Others

- Migrated interfaces from their own packages to `expo-modules-core`. ([#12868](https://github.com/expo/expo/pull/12868), [#12912](https://github.com/expo/expo/pull/12912), [#12918](https://github.com/expo/expo/pull/12918) by [@tsapeta](https://github.com/tsapeta))

## 11.0.3 — 2021-05-03

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Add `unimodules-permissions-interface` dependency. ([#12739](https://github.com/expo/expo/pull/12739) by [@ajsmth](https://github.com/ajsmth))

## 11.0.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 11.0.1 — 2021-04-01

### 🐛 Bug fixes

- Fix typing on `Camera.Constants`. ([#12343](https://github.com/expo/expo/pull/12343) by [@HBiede](https://github.com/HBiede))

## 11.0.0 — 2021-03-10

### 🛠 Breaking changes

- Remove deprecated `barCodeTypes` prop in favor of `barCodeScannerSettings.barCodeTypes`. ([#11904](https://github.com/expo/expo/pull/11904) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Remove lodash. ([#11900](https://github.com/expo/expo/pull/11900) by [@EvanBacon](https://github.com/EvanBacon))
- Add requestPermissionsAsync and getPermissionsAsync for web. ([#11694](https://github.com/expo/expo/pull/11694) by [@IjzerenHein](https://github.com/IjzerenHein))
- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))

## 9.1.1 — 2020-12-14

_This version does not introduce any user-facing changes._

## 9.1.0 — 2020-11-17

### 🎉 New features

- Added support for video poster to show while the camera is loading on web. ([#9930](https://github.com/expo/expo/pull/9930) by [@liorJuice](https://github.com/liorJuice))

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Fix bug where `barCodeTypes` needed to be defined on web. ([#9630](https://github.com/expo/expo/pull/9630) by [@EvanBacon](https://github.com/EvanBacon))
- Fix bug where camera would sometimes not start on web desktop. ([#9630](https://github.com/expo/expo/pull/9630) by [@EvanBacon](https://github.com/EvanBacon))
- Deleted `CaptureOptions` in favor of `CameraPictureOptions` ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))
- Added camera permissions declarations to `AndroidManifest.xml` on Android. ([#9224](https://github.com/expo/expo/pull/9224) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Added support for QR scanning on web. ([#4166](https://github.com/expo/expo/pull/4166) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `fbjs` dependency
- Delete `prop-types` in favor of TypeScript. ([#8680](https://github.com/expo/expo/pull/8680) by [@EvanBacon](https://github.com/EvanBacon))
- [camera] Directly import `createElement` from `react-native-web` for RNW v12 support. ([#8773](https://github.com/expo/expo/pull/8773) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix QR scanning on Android and iOS. ([#9741](https://github.com/expo/expo/pull/9741) by [@EvanBacon](https://github.com/EvanBacon))
- [web] Fix bug where swapping cameras caused screen to flicker ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))
- [web] Fix bug where swapping cameras doesn't persist camera settings ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))

## 8.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))

### 🎉 New features

- Added exports for TypeScript definitions: CameraType, ImageType, ImageParameters, ImageSize, CaptureOptions, CapturedPicture ([#8457](https://github.com/expo/expo/pull/8457) by [@jarvisluong](https://github.com/jarvisluong))
