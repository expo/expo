# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.4.2 — 2023-06-28

### 🐛 Bug fixes

- Fixed missing constants on iOS, restricted possibility of starting multiple print jobs at once, which would lead to crashes. ([#23128](https://github.com/expo/expo/pull/23128) by [@behenate](https://github.com/behenate))

## 12.4.1 — 2023-06-27

### 🐛 Bug fixes

- Fixed a regression after refactoring to Swift (restore functionality to print from web url or data string). ([#22997](https://github.com/expo/expo/pull/22997) by [@mroswald](https://github.com/mroswald), [@behenate](https://github.com/behenate))

## 12.4.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.3.0 — 2023-05-08

### 🎉 New features

- Migrated iOS codebase to use Expo modules API. ([#21561](https://github.com/expo/expo/pull/21561) by [@behenate](https://github.com/behenate))
- Migrated Android codebase to use the Expo modules API and Kotlin coroutines. ([#21714](https://github.com/expo/expo/pull/21714) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- Fixed [Multiple Print Bug on iOS 16](https://github.com/expo/expo/issues/19399). ([#21561](https://github.com/expo/expo/pull/21561) by [@behenate](https://github.com/behenate))

## 12.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.1.0 — 2023-01-05

### 🐛 Bug fixes

- Fix `printAsync` not reflecting custom width/ height, `useMarkupFormatter` option preventing custom width/ height/ margin from being reflected. ([#18873](https://github.com/expo/expo/pull/20046) by [@keith-kurak](https://github.com/keith-kurak))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix crash on some Android devices when WebView returns an unknown error. ([#18911](https://github.com/expo/expo/pull/18911) by [@matkastner](https://github.com/matkastner))

## 11.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 11.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.1.0 — 2021-12-03

### 🐛 Bug fixes

- Fix page-breaks and margins not supported on iOS ([#14383](https://github.com/expo/expo/pull/14802) by [@cruzach](https://github.com/IjzerenHein))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add `markupFormatterIOS` option in `printToFileAsync` on iOS (default option can't handle html page breaks). ([#13799](https://github.com/expo/expo/pull/13799) by [@mstach60161](https://github.com/mstach60161))
- Deprecate `markupFormatterIOS` (string) in favor of `useMarkupFormatter` (boolean). ([#13897](https://github.com/expo/expo/pull/13897) by [@mstach60161](https://github.com/mstach60161))

### 🐛 Bug fixes

- Fix loading pdf. ([#13677](https://github.com/expo/expo/pull/13677) by [@mstach60161](https://github.com/mstach60161))
- Fix calculating the number of pages when printing HTML on iOS. ([#13633](https://github.com/expo/expo/pull/13633) by [@dsokal](https://github.com/dsokal))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite print module from Java to Kotlin. ([#13538](https://github.com/expo/expo/pull/13538) by [@mstach60161](https://github.com/mstach60161))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.2.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.1.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 9.0.2 — 2020-07-27

_This version does not introduce any user-facing changes._

## 9.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
