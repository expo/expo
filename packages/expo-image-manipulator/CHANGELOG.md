# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 11.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 10.4.0 — 2022-07-07

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 10.3.1 — 2022-04-20

### 🐛 Bug fixes

- Fix `base64` result of `manipulateAsync` being always `null` on iOS. ([#17122](https://github.com/expo/expo/pull/17122) by [@barthap](https://github.com/barthap))

## 10.3.0 — 2022-04-18

### 🎉 New features

- Native module on iOS is now written in Swift using the new API. ([#15277](https://github.com/expo/expo/pull/15277) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Remove `data:image` part in web base64 result. ([#16191](https://github.com/expo/expo/pull/16191) by [@AllanChain](https://github.com/AllanChain))
- On iOS fix rotation causing extra image borders. ([#16669](https://github.com/expo/expo/pull/16669) by [@mnightingale](https://github.com/mnightingale))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.2.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.2.0 — 2021-12-03

### 🐛 Bug fixes

- Fix `Tainted canvases may not be exported` CORS error on web. ([#14739](https://github.com/expo/expo/pull/14739) by [@IjzerenHein](https://github.com/IjzerenHein))

## 10.1.0 — 2021-10-01

### 🐛 Bug fixes

- Added missing dependency on `expo-image-loader`. ([#14585](https://github.com/expo/expo/pull/14585) by [@tsapeta](https://github.com/tsapeta))

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Support loading base64 data URIs on iOS. ([#13725](https://github.com/expo/expo/pull/13725) by [@mnightingale](https://github.com/mnightingale))

### 🐛 Bug fixes

- Fix resize action validator to allow providing just one of `width` or `height`. ([#13369](https://github.com/expo/expo/pull/13369) by [@cruzach](https://github.com/cruzach))
- Fix incorrect compression used when `0` is requested on web. ([#13728](https://github.com/expo/expo/pull/13728) by [@mnightingale](https://github.com/mnightingale))
- Fix Android `manipulateAsync` returns incorrect height (original unmanipulated height). ([#13726](https://github.com/expo/expo/pull/13726) by [@mnightingale](https://github.com/mnightingale))
- Fixed Android to use filename extension consistent with other platforms. ([#13726](https://github.com/expo/expo/pull/13726) by [@mnightingale](https://github.com/mnightingale))
- Fixed rotation direction to be clockwise on web. ([#13760](https://github.com/expo/expo/pull/13760) by [@mnightingale](https://github.com/mnightingale))
- Fixed web support for multiple actions. ([#14056](https://github.com/expo/expo/pull/14056) by [@mnightingale](https://github.com/mnightingale))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Refactored web to pass canvases to each action avoiding multiple calls to `toDataURL`. ([#14145](https://github.com/expo/expo/pull/14145) by [@mnightingale](https://github.com/mnightingale))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Converted Android code to Kotlin. ([#13231](https://github.com/expo/expo/pull/13231) by [@dsokal](https://github.com/dsokal))

## 9.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fixed incorrect image cropping on Web. ([#12021](https://github.com/expo/expo/pull/12021) by [@rSkogeby](https://github.com/rskogeby))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
