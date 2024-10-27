# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Use expo-updates as source of truth for runtime version in dev client ([#31453](https://github.com/expo/expo/pull/31453) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Refactor context injection ([#31951](https://github.com/expo/expo/pull/31951) by [@wschurman](https://github.com/wschurman))
- [ios] Remove appContext property ([#32103](https://github.com/expo/expo/pull/32103) by [@wschurman](https://github.com/wschurman))

## 0.16.2 — 2024-05-09

### 🐛 Bug fixes

- Fixed loading error when both `expo-dev-client` and `expo-updates` installed but no `runtimeVersion` configured. ([#28662](https://github.com/expo/expo/pull/28662) by [@kudo](https://github.com/kudo))

## 0.16.1 — 2024-04-29

_This version does not introduce any user-facing changes._

## 0.16.0 — 2024-04-18

### 💡 Others

- Decouple from "bridge" in `expo-updates`. ([#27216](https://github.com/expo/expo/pull/27216) by [@kudo](https://github.com/kudo))
- Migrated expo-updates-interface to Kotlin. ([#28033](https://github.com/expo/expo/pull/28033) by [@kudo](https://github.com/kudo))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))
- Aligned `UpdatesControllerRegistry` with iOS for a better expo-updates and expo-dev-launcher interoperability. ([#27996](https://github.com/expo/expo/pull/27996) by [@kudo](https://github.com/kudo))

## 0.15.3 - 2024-01-18

_This version does not introduce any user-facing changes._

## 0.15.2 - 2024-01-10

_This version does not introduce any user-facing changes._

## 0.15.1 - 2023-12-19

### 🐛 Bug fixes

- Add relaunch to disabled and dev client controllers. ([#25973](https://github.com/expo/expo/pull/25973) by [@wschurman](https://github.com/wschurman))

## 0.15.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Renamed `unimodule.json` to `expo-module.config.json`. ([#25100](https://github.com/expo/expo/pull/25100) by [@reichhartd](https://github.com/reichhartd))
- Remove unused `storedUpdateIdsWithConfiguration` method. ([#25194](https://github.com/expo/expo/pull/25194) by [@wschurman](https://github.com/wschurman))

## 0.14.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 0.13.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

## 0.12.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 0.11.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 0.10.1 - 2023-06-30

### 🐛 Bug fixes

- Fixed iOS build errors in `use_frameworks!` mode. ([#23218](https://github.com/expo/expo/pull/23218) by [@kudo](https://github.com/kudo))

## 0.10.0 — 2023-06-21

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 0.9.2 — 2023-05-08

### 💡 Others

- iOS: convert to swift. ([#21646](https://github.com/expo/expo/pull/21646) by [@wschurman](https://github.com/wschurman))

## 0.9.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 0.9.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 0.8.1 — 2022-11-02

### 💡 Others

- Removed deprecated Android `kotlin-android-extensions` plugin ([#19732](https://github.com/expo/expo/pull/19732) by [@josephyanks](https://github.com/josephyanks))

## 0.8.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 0.7.0 — 2022-07-07

### 💡 Others

- [Android] Get downloaded update IDs. ([#17933](https://github.com/expo/expo/pull/17933) by [@douglowder](https://github.com/douglowder))

## 0.6.0 — 2022-04-18

### 🎉 New features

- Add controller registry in order to support dev client auto-setup with updates integration on iOS. ([#16230](https://github.com/expo/expo/pull/16230) by [@esamelson](https://github.com/esamelson))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 0.5.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.5.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 0.4.0 — 2021-09-28

### 🐛 Bug fixes

- Removed unnecessary gradle dependency on expo-modules-core. ([#14464](https://github.com/expo/expo/pull/14464) by [@esamelson](https://github.com/esamelson))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 0.3.1 — 2021-09-16

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

## 0.3.0 — 2021-09-09

_This version does not introduce any user-facing changes._

## 0.2.2 — 2021-07-05

### 🐛 Bug fixes

- Remove unnecessary gradle dependency on unimodules-core. ([#13481](https://github.com/expo/expo/pull/13481) by [@esamelson](https://github.com/esamelson))

## 0.2.1 — 2021-06-24

### 🛠 Breaking changes

- Added method to reset Updates module state. ([#13346](https://github.com/expo/expo/pull/13346) by [@esamelson](https://github.com/esamelson))

## 0.1.0 — 2021-06-10

### 🛠 Breaking changes

- Renamed the iOS protocol to EXUpdatesExternalInterface. ([#13214](https://github.com/expo/expo/pull/13214) by [@esamelson](https://github.com/esamelson))

## 0.0.2 — 2021-06-08

### 🎉 New features

- - Added initial iOS protocol. ([#13088](https://github.com/expo/expo/pull/13088) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Make Update nullable in onSuccess callback ([#13136](https://github.com/expo/expo/pull/13136) by [@esamelson](https://github.com/esamelson))

## 0.0.1 — 2021-05-28

### 🎉 New features

- Added package and initial Android interface. ([#13030](https://github.com/expo/expo/pull/13030) by [@esamelson](https://github.com/esamelson))
