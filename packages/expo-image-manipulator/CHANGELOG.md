# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.7 — 2026-05-13

_This version does not introduce any user-facing changes._

## 56.0.6 — 2026-05-11

_This version does not introduce any user-facing changes._

## 56.0.5 — 2026-05-08

_This version does not introduce any user-facing changes._

## 56.0.4 — 2026-05-07

_This version does not introduce any user-facing changes._

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

## 55.0.16 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.15 - 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.14 - 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.13 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.12 - 2026-04-02

### 💡 Others

- [iOS] Use `internal import SDWebImageWebPCoder` to hide third-party dependency from public module interface. ([#44248](https://github.com/expo/expo/pull/44248) by [@chrfalch](https://github.com/chrfalch))

## 55.0.11 - 2026-03-17

_This version does not introduce any user-facing changes._

## 55.0.10 - 2026-03-11

### 🐛 Bug fixes

- [iOS] Preserve HEIC orientation when loading local files for image manipulation. ([#43725](https://github.com/expo/expo/pull/43725) by [@maxsz](https://github.com/maxsz))

## 55.0.9 — 2026-02-25

_This version does not introduce any user-facing changes._

## 55.0.8 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-08

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🐛 Bug fixes

- Fix image manipulator in Expo Go. ([#42347](https://github.com/expo/expo/pull/42347) by [@aleqsio](https://github.com/aleqsio))
- fix TS build issue ([#41448](https://github.com/expo/expo/pull/41448) by [@vonovak](https://github.com/vonovak))

### 💡 Others

- [Android] Removed unused `androidx.annotation:annotation` dependency ([#39764](https://github.com/expo/expo/pull/39764) by [@lukmccall](https://github.com/lukmccall))
- [iOS] Removed dependency on `expo-image-loader` on iOS. ([#41395](https://github.com/expo/expo/pull/41395) by [@tsapeta](https://github.com/tsapeta))

## 14.0.8 - 2025-12-05

_This version does not introduce any user-facing changes._

## 14.0.7 — 2025-09-10

### 💡 Others

- Extracted the read permission check from `FileSystemUtilities` ([#39210](https://github.com/expo/expo/pull/39210) by [@kosmydel](https://github.com/kosmydel))

## 14.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 14.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 14.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 14.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 14.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 14.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 14.0.0 — 2025-08-13

### 🎉 New features

- [iOS] Add Apple TV support. ([#38513](https://github.com/expo/expo/pull/38513) by [@douglowder](https://github.com/douglowder))

## 13.1.7 — 2025-05-08

### 🐛 Bug fixes

- Fix `ReferenceError` during export for web. ([#36703](https://github.com/expo/expo/pull/36703) by [@aleqsio](https://github.com/aleqsio))

## 13.1.6 — 2025-05-06

_This version does not introduce any user-facing changes._

## 13.1.5 — 2025-04-30

_This version does not introduce any user-facing changes._

## 13.1.4 — 2025-04-25

_This version does not introduce any user-facing changes._

## 13.1.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 13.1.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 13.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 13.1.0 — 2025-04-04

### 🐛 Bug fixes

- Changed `export` to `export type` for TS type declarations. ([#33446](https://github.com/expo/expo/pull/33446) by [@j-piasecki](https://github.com/j-piasecki))
- Fixed `saveAsync` not respecting the format and compression quality. ([#33690](https://github.com/expo/expo/pull/33690) by [@tsapeta](https://github.com/tsapeta))
- [Web] Overwrite class `name` property in `ImageManipulator`. ([#35806](https://github.com/expo/expo/pull/35806) by [@alimek](https://github.com/alimek))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 13.0.6 - 2025-01-10

_This version does not introduce any user-facing changes._

## 13.0.5 — 2024-10-29

### 🎉 New features

- [Android] Added support for image refs in `ImageManipulator.manipulate` and `useImageManipulator`. ([#32398](https://github.com/expo/expo/pull/32398) by [@lukmccall](https://github.com/lukmccall))

## 13.0.4 — 2024-10-28

### 🎉 New features

- [iOS][Web] Added support for image refs in `ImageManipulator.manipulate` and `useImageManipulator`. ([#32346](https://github.com/expo/expo/pull/32346), [#32354](https://github.com/expo/expo/pull/32354) by [@tsapeta](https://github.com/tsapeta))

## 13.0.3 — 2024-10-25

### 🎉 New features

- [iOS] Added support for image refs in `ImageManipulator.manipulate` and `useImageManipulator`. ([#32346](https://github.com/expo/expo/pull/32346) by [@tsapeta](https://github.com/tsapeta))

## 13.0.2 — 2024-10-24

### 💡 Others

- Exported missing types, removed unnecessary fallback and properly registered the module on Web. ([#32302](https://github.com/expo/expo/pull/32302) by [@tsapeta](https://github.com/tsapeta))

## 13.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS][Web] Introduce a new API for image manipulation. ([#30135](https://github.com/expo/expo/pull/30135), [#30194](https://github.com/expo/expo/pull/30194) by [@tsapeta](https://github.com/tsapeta))
- [Android] Introduce a new API for image manipulation. ([#30232](https://github.com/expo/expo/pull/30232) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Use the `src` folder as the Metro target. ([#30079](https://github.com/expo/expo/pull/30079) by [@tsapeta](https://github.com/tsapeta))
- Prefer `UIGraphicsImageRenderer` over `UIGraphicsBeginImageContext`. ([#30211](https://github.com/expo/expo/pull/30211) by [@alanjhughes](https://github.com/alanjhughes))
- Provide image's memory footprint for better garbage collection. ([#31168](https://github.com/expo/expo/pull/31168) by [@tsapeta](https://github.com/tsapeta) & [#31784](https://github.com/expo/expo/pull/31784) by [@lukmccall](https://github.com/lukmccall))

## 12.0.5 — 2024-05-13

_This version does not introduce any user-facing changes._

## 12.0.4 — 2024-05-13

### 🐛 Bug fixes

- On `iOS` correctly handle urls coming from the users photo library. ([#28777](https://github.com/expo/expo/pull/28777) by [@alanjhughes](https://github.com/alanjhughes))

## 12.0.3 — 2024-05-01

_This version does not introduce any user-facing changes._

## 12.0.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 12.0.1 — 2024-04-22

### 🎉 New features

- Added support for converting to WEBP on Android and iOS. ([#26379](https://github.com/expo/expo/pull/26379) by [@NikitaDudin](https://github.com/NikitaDudin))

## 12.0.0 — 2024-04-18

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 11.8.0 — 2023-12-12

### 🐛 Bug fixes

- [iOS] Fix an issue where the image is manipulated on a background thread. ([#25756](https://github.com/expo/expo/pull/25756) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [iOS] Replace legacy `FileSystem` interfaces usage with core `FileSystemUtilities`. ([#25495](https://github.com/expo/expo/pull/25495) by [@alanhughes](https://github.com/alanjhughes))

## 11.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🎉 New features

- Added `extent` action ([#25116](https://github.com/expo/expo/pull/25116) by [@LinusU](https://github.com/LinusU))

## 11.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 11.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 11.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 11.4.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 11.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 11.2.0 — 2023-05-08

### 🐛 Bug fixes

- Handle images with an unsupported color space ([#21757](https://github.com/expo/expo/pull/21757) by [@mmmulani](https://github.com/mmmulani))

## 11.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 11.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 11.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))
- Migrated Android codebase to use the new Expo modules API. ([#20683](https://github.com/expo/expo/pull/20683) by [@alanhughes](https://github.com/alanjhughes))

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
