# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.0.10 — 2025-12-05

_This version does not introduce any user-facing changes._

## 1.0.9 — 2025-11-17

_This version does not introduce any user-facing changes._

## 1.0.8 — 2025-09-11

_This version does not introduce any user-facing changes._

## 1.0.7 — 2025-09-02

_This version does not introduce any user-facing changes._

## 1.0.6 — 2025-08-31

_This version does not introduce any user-facing changes._

## 1.0.5 — 2025-08-27

_This version does not introduce any user-facing changes._

## 1.0.4 — 2025-08-25

_This version does not introduce any user-facing changes._

## 1.0.3 — 2025-08-21

_This version does not introduce any user-facing changes._

## 1.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 1.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 1.0.0 — 2025-08-13

### 🎉 New features

- Add support for macOS. ([#37629](https://github.com/expo/expo/pull/37629) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.16.6 - 2025-07-03

_This version does not introduce any user-facing changes._

## 0.16.5 — 2025-05-08

_This version does not introduce any user-facing changes._

## 0.16.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.16.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 0.16.2 — 2025-04-22

_This version does not introduce any user-facing changes._

## 0.16.1 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.16.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))

## 0.15.7 - 2025-02-21

_This version does not introduce any user-facing changes._

## 0.15.6 - 2025-02-14

_This version does not introduce any user-facing changes._

## 0.15.5 - 2025-01-10

_This version does not introduce any user-facing changes._

## 0.15.4 — 2024-11-19

_This version does not introduce any user-facing changes._

## 0.15.3 — 2024-11-14

_This version does not introduce any user-facing changes._

## 0.15.2 — 2024-11-05

_This version does not introduce any user-facing changes._

## 0.15.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 0.15.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Only import from `expo/config` to follow proper dependency chains. ([#30501](https://github.com/expo/expo/pull/30501) by [@byCedric](https://github.com/byCedric))

## 0.14.3 — 2024-05-16

_This version does not introduce any user-facing changes._

## 0.14.2 — 2024-05-06

_This version does not introduce any user-facing changes._

## 0.14.1 — 2024-04-29

_This version does not introduce any user-facing changes._

## 0.14.0 — 2024-04-18

### 🛠 Breaking changes

- Remove classic updates. ([#26036](https://github.com/expo/expo/pull/26036), [#26048](https://github.com/expo/expo/pull/26048) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- [Android] Remove unsafe internal mutation capability. ([#26229](https://github.com/expo/expo/pull/26229) by [@wschurman](https://github.com/wschurman))
- Rename manifest classes. ([#26234](https://github.com/expo/expo/pull/26234), [#26235](https://github.com/expo/expo/pull/26235), [#26257](https://github.com/expo/expo/pull/26257) by [@wschurman](https://github.com/wschurman))
- Remove use of legacy sdkVersion runtimeVersion policy. ([#26957](https://github.com/expo/expo/pull/26957) by [@wschurman](https://github.com/wschurman))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 0.13.2 - 2024-01-18

_This version does not introduce any user-facing changes._

## 0.13.1 - 2024-01-10

_This version does not introduce any user-facing changes._

## 0.13.0 — 2023-12-12

_This version does not introduce any user-facing changes._

## 0.12.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 0.11.0 — 2023-10-17

_This version does not introduce any user-facing changes._

## 0.10.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

## 0.9.0 — 2023-09-04

### 🛠 Breaking changes

- Remove classic manifest types. ([#24053](https://github.com/expo/expo/pull/24053) by [@wschurman](https://github.com/wschurman))
- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))
- Make expo-manifests source of truth for manifest TS types. ([#24049](https://github.com/expo/expo/pull/24049) by [@wschurman](https://github.com/wschurman))

## 0.8.1 — 2023-08-02

### 🛠 Breaking changes

- Drop support for `logUrl` which sent console logs to the legacy `expo-cli`. ([#18596](https://github.com/expo/expo/pull/18596) by [@EvanBacon](https://github.com/EvanBacon))

## 0.8.0 — 2023-07-28

### 🎉 New features

- [iOS] Expose getMetadata method to match android. ([#23445](https://github.com/expo/expo/pull/23445) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- [iOS] Fix error in handling nested array. ([#23562](https://github.com/expo/expo/pull/23562) by [@douglowder](https://github.com/douglowder))

## 0.7.1 - 2023-06-30

### 🐛 Bug fixes

- Fixed iOS build errors in `use_frameworks!` mode. ([#23218](https://github.com/expo/expo/pull/23218) by [@kudo](https://github.com/kudo))

## 0.7.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `junit` to `4.13.2`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- Added `Manifests.getPluginProperties()` helper to query dedicated package's properties inside the `plugins` config. ([#22701](https://github.com/expo/expo/pull/22701) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 0.6.0 — 2023-05-08

### 🎉 New features

- Support new SDK version field in new manifests. ([#22356](https://github.com/expo/expo/pull/22356) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Convert iOS implementation to Swift. ([#21298](https://github.com/expo/expo/pull/21298), [#21648](https://github.com/expo/expo/pull/21648) by [@wschurman](https://github.com/wschurman))

## 0.5.2 - 2023-02-21

### 🐛 Bug fixes

- Fixed default `expo.jsEngine` value when SDK is lower than 48. ([#21266](https://github.com/expo/expo/pull/21266) by [@kudo](https://github.com/kudo))

## 0.5.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 0.5.0 — 2023-02-03

### 🎉 New features

- Switch default JS engine to Hermes. ([#21001](https://github.com/expo/expo/pull/21001) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 0.4.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- Replace `getAndroidJsEngine` as `jsEngine` lazy kotlin property. ([#19116](https://github.com/expo/expo/pull/19116) by [@kudo](https://github.com/kudo))

## 0.3.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 0.3.0 — 2022-04-18

### 🎉 New features

- Add `logUrl` getter to both platforms. ([#16709](https://github.com/expo/expo/pull/16709) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Add support for expo project information certificate extension. ([#16607](https://github.com/expo/expo/pull/16607) by [@wschurman](https://github.com/wschurman))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 0.2.4 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.2.3 - 2022-01-18

_This version does not introduce any user-facing changes._

## 0.2.2 — 2021-10-15

_This version does not introduce any user-facing changes._

## 0.2.1 — 2021-10-06

### 🐛 Bug fixes

- Support platform shared jsEngine schema. ([#14654](https://github.com/expo/expo/pull/14654) by [@kudo](https://github.com/kudo))

## 0.2.0 — 2021-09-28

### 🎉 New features

- Added `version` getter to both platforms, and `hostUri` getter to Android, for compatibility with expo-dev-client. ([#14460](https://github.com/expo/expo/pull/14460) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 0.1.1 — 2021-09-16

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

## 0.1.0 — 2021-09-09

Initial version.
