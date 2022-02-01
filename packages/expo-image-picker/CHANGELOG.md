# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.0.2 — 2022-02-01

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
