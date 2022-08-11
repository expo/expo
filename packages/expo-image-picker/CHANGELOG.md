# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.3.1 — 2022-07-25

_This version does not introduce any user-facing changes._

## 13.3.0 — 2022-07-16

### 🎉 New features

- On iOS 14+ added support for selection limit and on iOS 15+ for ordered selection. ([#18142](https://github.com/expo/expo/pull/18142), [#18143](https://github.com/expo/expo/pull/18143) by [@barthap](https://github.com/barthap))
- The picker now resolves media library asset ID. ([#18236](https://github.com/expo/expo/pull/18236), [#18185](https://github.com/expo/expo/pull/18185) by [@barthap](https://github.com/barthap))
- On iOS, the picker now resolves file name and size and media library asset ID. ([#18179](https://github.com/expo/expo/pull/18179) by [@barthap](https://github.com/barthap))
- On Android added support for selecting multiple images/videos. ([#18161](https://github.com/expo/expo/pull/18161) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- On Android restored support for `allowsEditing` option that was disabled when migrating to `registerForActivityResult` mechanism. ([#17963](https://github.com/expo/expo/pull/17963) by [@bbarthec](https://github.com/bbarthec))

## 13.2.1 — 2022-07-11

_This version does not introduce any user-facing changes._

## 13.2.0 — 2022-07-07

### 🎉 New features

- On iOS 14+ added support for selecting multiple images/videos. ([#18102](https://github.com/expo/expo/pull/18102), [#18138](https://github.com/expo/expo/pull/18138), [#18145](https://github.com/expo/expo/pull/18145) by [@barthap](https://github.com/barthap))

### 🐛 Bug fixes

- Fix crash when picking a GIF image on iOS. ([#18135](https://github.com/expo/expo/pull/18135) by [@barthap](https://github.com/barthap))

### 💡 Others

- On Android migrated to the new `registerForActivityResult` mechanism. This migration disables `allowsEditing` option. ([#17671](https://github.com/expo/expo/pull/17671), ([#17987](https://github.com/expo/expo/pull/17987) by [@bbarthec](https://github.com/bbarthec))
- Native module on Android is now written in Kotlin using [Sweet API](https://docs.expo.dev/modules/module-api). ([#17668](https://github.com/expo/expo/pull/17668) by [@bbarthec](https://github.com/bbarthec))
- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 13.1.1 — 2022-04-27

_This version does not introduce any user-facing changes._

## 13.1.0 — 2022-04-25

### 🎉 New features

- [plugin] Added ability to disable permissions. ([#17168](https://github.com/expo/expo/pull/17168) by [@EvanBacon](https://github.com/EvanBacon))

## 13.0.1 — 2022-04-20

_This version does not introduce any user-facing changes._

## 13.0.0 — 2022-04-18

### 🛠 Breaking changes

- On Android migrated cropping library from `com.theartofdev.edmodo:android-image-cropper@2.8.0` (available from `jcenter()`) to `com.github.CanHub:Android-Image-Cropper@1.1.1` (available from `jitpack.io`). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Native module on iOS is now written in Swift using the new API. ([#15977](https://github.com/expo/expo/pull/15977) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fixed crashes on Android after image is picked by adding missing dependency `expo-image-loader`. ([#17019](https://github.com/expo/expo/pull/17019) by [@M1ST4KE](https://github.com/M1ST4KE))
- Fix failure on Android when `allowsEditing` is `true` and non-jpeg file picked. ([#16615](https://github.com/expo/expo/pull/16615) by [@mnightingale](https://github.com/mnightingale))

### ⚠ Notices

- Deleted the `UIImagePickerPresentationStyle.BlurOverFullScreen` option as it does not work on iOS. ([#16925](https://github.com/expo/expo/pull/16925) by [@barthap](https://github.com/barthap))
- Deprecated all `PascalCase` values of the `UIImagePickerPresentationStyle` enum. Use their `SNAKE_UPPERCASE` counterparts instead. ([#16925](https://github.com/expo/expo/pull/16925) by [@barthap](https://github.com/barthap))
- Underlying values of the `UIImagePickerPresentationStyle` are now strings. They were integers before. ([#16925](https://github.com/expo/expo/pull/16925) by [@barthap](https://github.com/barthap))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))
- Export missing `PermissionResponse` type. ([#15744](https://github.com/expo/expo/pull/15744) by [@Simek](https://github.com/Simek))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.0.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.0.1 — 2021-12-15

### 🐛 Bug fixes

- Fix unresolved promise when picker was dismissed with a swipe-down on iOS. ([#15511](https://github.com/expo/expo/pull/15511) by [@barthap](https://github.com/barthap))

## 12.0.0 — 2021-12-03

### 🛠 Breaking changes

- Remove typo workaround for `getMediaLibaryPermissionsAsync` method. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))

### 🐛 Bug fixes

- On Web add missing `cancelled` property to the return values of `launchCameraAsync` and `launchImageLibraryAsync` methods. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))

### 💡 Others

- Export missing types: `ImageInfo`, `ImagePickerMultipleResult`, `OpenFileBrowserOptions`, `ExpandImagePickerResult`, `UIImagePickerControllerQualityType` and `UIImagePickerPresentationStyle`. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))
- Extract return object containing `{ cancelled: true }` to separate type `ImagePickerCancelledResult` for `launchCameraAsync` and `launchImageLibraryAsync` methods. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add useCameraPermissions and useMediaLibraryPermissions hooks from modules factory. ([#13859](https://github.com/expo/expo/pull/13859) by [@bycedric](https://github.com/bycedric))
- Add possibility to change presentation style on iOS. ([#14068](https://github.com/expo/expo/pull/14068) by [@mstach60161](https://github.com/mstach60161))

### 🐛 Bug fixes

- Add missing `GPSHPositioningError` exif parameter on Android. ([#13998](https://github.com/expo/expo/pull/13998) by [@mstach60161](https://github.com/mstach60161))
- Fix promise not resolving when the app is moved to the background on Android. ([#13975](https://github.com/expo/expo/pull/13975) by [@mstach60161](https://github.com/mstach60161))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Fixed `base64` return on web. ([#12529](https://github.com/expo/expo/pull/12529) by [@simonezuccala](https://github.com/simonezuccala) and [@misterdev](https://github.com/misterdev))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Fixed cases where Picker & Camera would be transparent on iOS 14.5. ([#12897](https://github.com/expo/expo/pull/12897) by [@cruzach](https://github.com/cruzach))
- Add missing exif data to cropped image on Android. ([#14038](https://github.com/expo/expo/pull/14038) by [@mstach60161](https://github.com/mstach60161))

### 💡 Others

- Migrated from `unimodules-file-system-interface` and `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))
- Migrated from `AsyncTask` to Kotlin concurrency utilities. ([#13800](https://github.com/expo/expo/pull/13800) by [@m1st4ke](https://github.com/m1st4ke))

## 10.1.3 — 2021-04-13

_This version does not introduce any user-facing changes._

## 10.1.2 — 2021-04-09

### 🐛 Bug fixes

- Added SSR guard. ([#12420](https://github.com/expo/expo/pull/12420) by [@EvanBacon](https://github.com/EvanBacon))
- Reverted focus state listener PR. ([#12420](https://github.com/expo/expo/pull/12420) by [@EvanBacon](https://github.com/EvanBacon))

## 10.1.1 — 2021-03-31

_This version does not introduce any user-facing changes._

## 10.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fixed `launchCameraAsync()` with `allowsEditing` option crashing for some android users. ([#11825](https://github.com/expo/expo/pull/11825) by [@lukmccall](https://github.com/lukmccall))
- Fixed cancelled picker dialog not resolving with expected result on web. ([#11847](https://github.com/expo/expo/pull/11847) by [@jayprado](https://github.com/jayprado))
- Fixed incorrect file URI on Android. ([#11823](https://github.com/expo/expo/pull/11823) by [@lukmccall](https://github.com/lukmccall))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed possible unsafe call in VideoResultTask. ([#11552](https://github.com/expo/expo/pull/11552) by [@Duell10111](https://github.com/Duell10111))

## 9.2.1 — 2020-12-09

### 🐛 Bug fixes

- Fix typo in media library permission methods. ([#11292](https://github.com/expo/expo/pull/11292) by [@bycedric](https://github.com/bycedric))

## 9.2.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.1.1 — 2020-09-23

### 🐛 Bug fixes

- `launchImageLibraryAsync()` should be callable with no options argument ([#10306](https://github.com/expo/expo/pull/10306))

## 9.1.0 — 2020-08-18

### 🎉 New features

- Added a way to handle results when activity was killed by the android. ([#9697](https://github.com/expo/expo/pull/9697) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Return array of `ImagePickerResult` when `allowsMultipleSelection` is set to `true` on Web. ([#9402](https://github.com/expo/expo/pull/9402) by [@isthaison](https://github.com/isthaison))
- video recorded on iOS recorded was producing [low resolution](https://github.com/expo/expo/issues/6224) videos, not it's fixed, and can be configured via the `videoQuality` option. ([#9808](https://github.com/expo/expo/pull/9808) by [@vujevits](https://github.com/vujevits))

## 9.0.0 — 2020-08-11

### 🛠 Breaking changes

- Added camera and external storage permissions declarations to `AndroidManifest.xml` on Android. ([#9230](https://github.com/expo/expo/pull/9230) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))
- Added `videoMaxDuration` option to `launchCameraAsync()` to configure video recording duration limit. ([#9486](https://github.com/expo/expo/pull/9486) by [@barthap](https://github.com/barthap))

## 8.4.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed downsizing cropped image, when `allowsEditing` was `true`. ([#9316](https://github.com/expo/expo/pull/9316) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))

### 🐛 Bug fixes

- Skip asking for camera permissions on web with `ImagePicker.getCameraPermissionsAsync`. ([#8475](https://github.com/expo/expo/pull/8475) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed exception when calling `ImagePicker.getCameraPermissionsAsync` on Web. ([#7498](https://github.com/expo/expo/pull/7498) by [@IjzerenHein](https://github.com/IjzerenHein))
