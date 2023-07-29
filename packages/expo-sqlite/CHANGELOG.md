# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 11.3.2 — 2023-07-29

### 🐛 Bug fixes

- Fixed missing `transaction()` and `readTransaction()` function types from `SQLiteDatabase`. ([#23751](https://github.com/expo/expo/pull/23751) by [@kudo](https://github.com/kudo))

## 11.3.1 — 2023-06-28

### 🎉 New features

- Migrated Android codebase to Expo Modules API. ([#23115](https://github.com/expo/expo/pull/23115) by [@alanjhughes](https://github.com/alanjhughes))
- Added experimental `Promise` based `execAsync` and `transactionAsync` functions. ([#23109](https://github.com/expo/expo/pull/23109) by [@kudo](https://github.com/kudo))

## 11.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 11.2.0 — 2023-05-08

### 🎉 New features

- Migrated to Expo Modules API. ([#21721](https://github.com/expo/expo/pull/21721) by [@alanjhughes](https://github.com/alanjhughes))

## 11.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 11.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 11.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 10.3.0 — 2022-07-07

### 🐛 Bug fixes

- Support `null` type in args to `executeSql`. ([#18078](https://github.com/expo/expo/pull/18078) by [@tsheaff](https://github.com/tsheaff))

## 10.2.0 — 2022-04-18

### 🎉 New features

- Added `closeAsync` and `deleteAsync` methods. ([#16831](https://github.com/expo/expo/pull/16831) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-12-03

### 🎉 New features

- Removed lodash. ([#12523](https://github.com/expo/expo/pull/12523) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Update `lodash` dependency. ([#15069](https://github.com/expo/expo/pull/15069) by [@Simek](https://github.com/Simek))

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Converted Android code to Kotlin ([#13724](https://github.com/expo/expo/pull/13724) by [@ixf](https://github.com/ixf))
- Added missing `_array` typing to `SQLResultSetRowList`/`ResultSet` return object. ([#13826](https://github.com/expo/expo/pull/13826) by [@bbarthec](https://github.com/bbarthec))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 9.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.5.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.4.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-07-29

### 🐛 Bug fixes

- Fix incorrect `rowsAffected` value in result of `executeSql` method on iOS when deleting/updating cascadely. ([@9137](https://github.com/expo/expo/pull/9317) by [@mczernek](https://github.com/mczernek))

## 8.2.1 — 2020-05-29

### 🐛 Bug fixes

- Fixed support for using `expo-sqlite` on Web ([#8518](https://github.com/expo/expo/pull/8518) by [@sjchmiela](https://github.com/sjchmiela))

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
