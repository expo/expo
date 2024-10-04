# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.2.1 - 2024-01-10

### 🐛 Bug fixes

- Fixed building error on Windows. ([#26296](https://github.com/expo/expo/pull/26296) by [@kudo](https://github.com/kudo))
- Fixed a write query being executed twice when using `SQLiteDatabase.getAllAsync()` in expo-sqlite/next API. ([#26344](https://github.com/expo/expo/pull/26344) by [@kudo](https://github.com/kudo))

## 13.2.0 - 2023-12-21

### 🎉 New features

- Added `SQLiteStatement.executeForRawResultAsync()` in `expo-sqlite/next` API which returns array based raw values than key-value based row value. ([#26073](https://github.com/expo/expo/pull/26073) by [@kudo](https://github.com/kudo))

## 13.1.2 - 2023-12-21

### 🐛 Bug fixes

- Fixed `NativeStatementBinding` leakage on Android. ([#25996](https://github.com/expo/expo/pull/25996) by [@kudo](https://github.com/kudo))

## 13.1.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 13.1.0 — 2023-12-13

### 🛠 Breaking changes

- Refactor `expo-sqlite/next` API to be more React idiomatic. ([#25657](https://github.com/expo/expo/pull/25657) by [@kudo](https://github.com/kudo))

## 13.0.0 — 2023-12-12

### 🎉 New features

- Added binary data support to the `expo-sqlite/next` API through the `Uint8Array`. ([#25787](https://github.com/expo/expo/pull/25787) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed `expo-sqlite/next` crashes when access to finalized statements. ([#25623](https://github.com/expo/expo/pull/25623) by [@kudo](https://github.com/kudo))
- Fixed `expo-sqlite/next` UTF-8 text issue and `:memory:` database issue. ([#25637](https://github.com/expo/expo/pull/25637) by [@kudo](https://github.com/kudo))

### 💡 Others

- [iOS] Replace legacy `FileSystem` interfaces usage with core `FileSystemUtilities`. ([#25495](https://github.com/expo/expo/pull/25495) by [@alanhughes](https://github.com/alanjhughes))
- Bump C++ compiler setting to C++20. ([#25548](https://github.com/expo/expo/pull/25548) by [@kudo](https://github.com/kudo))

## 12.2.1 — 2023-11-18

### 🐛 Bug fixes

- Fixed `expo-sqlite/next` integer overflow crashes on iOS. ([#25322](https://github.com/expo/expo/pull/25322) by [@peterferguson](https://github.com/peterferguson))

## 12.2.0 — 2023-11-14

### 🐛 Bug fixes

- Fixed the `transactionExclusiveAsync` does not support CRSQLite. ([#25370](https://github.com/expo/expo/pull/25370) by [@kudo](https://github.com/kudo))

### 💡 Others

- Build `crsqlite` from source using the correct architectures. ([#25363](https://github.com/expo/expo/pull/25363) by [@alanjhughes](https://github.com/alanjhughes))

## 12.1.0 — 2023-11-10

### 🎉 New features

- Improved performance on the `expo-sqlite/next` API. ([#25314](https://github.com/expo/expo/pull/25314) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix crash issues in `sqlite/next`. ([#25295](https://github.com/expo/expo/pull/25295) by [@kudo](https://github.com/kudo))
- Fix `executeSqlAsync` to accept null properly as arguments. ([#24761](https://github.com/expo/expo/pull/24761) by [@spencerc99](https://github.com/spencerc99))
- Fixed `useSQLiteContext()` and `finalizeUnusedStatementsBeforeClosing` issues in `expo-sqlite/next` API. ([#25328](https://github.com/expo/expo/pull/25328) by [@kudo](https://github.com/kudo))

## 12.0.0 — 2023-11-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Remove CRSQLite support on legacy API. ([#25092](https://github.com/expo/expo/pull/25092) by [@kudo](https://github.com/kudo))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🎉 New features

- Added Android implementation for `sqlite/next` APIs. ([#25021](https://github.com/expo/expo/pull/25021) by [@kudo](https://github.com/kudo))
- Added the `useSQLiteContext` hook that can be used across components. ([#25129](https://github.com/expo/expo/pull/25129) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- [ios] Fix some issues for `sqlite/next`. ([#25022](https://github.com/expo/expo/pull/25022) by [@kudo](https://github.com/kudo))

### 💡 Others

- [Android] Removed the package included SQLite source and download in build time. ([#25186](https://github.com/expo/expo/pull/25186) by [@kudo](https://github.com/kudo))

## 11.8.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [Android] Rewrite implementations from low-level SQLite bindings. ([#24730](https://github.com/expo/expo/pull/24730) by [@kudo](https://github.com/kudo))
- Introduced `expo-sqlite/next` new APIs. ([#24812](https://github.com/expo/expo/pull/24812) by [@kudo](https://github.com/kudo))

## 11.7.1 — 2023-09-18

### 🐛 Bug fixes

- Fix broken JS test. ([#24498](https://github.com/expo/expo/pull/24498) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [iOS] Bump `SQLite`version to latest. ([#24375](https://github.com/expo/expo/pull/24375) by [@alanjhughes](https://github.com/alanjhughes))

## 11.7.0 — 2023-09-15

### 🐛 Bug fixes

- [iOS] Fixed an issue with CRSQLite missing a minimum OS version on iOS, causing rejections on AppStore Connect submission. ([#24347](https://github.com/expo/expo/pull/24347) by [@derekstavis](https://github.com/derekstavis))

## 11.3.3 — 2023-09-08

### 🎉 New features

- Add support for running raw queries on Android. ([#24320](https://github.com/expo/expo/pull/24320) by [@alanjhughes](https://github.com/alanjhughes))
- On Android, add support for `CRSQLite`. ([#24322](https://github.com/expo/expo/pull/24322) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fixed the return type from `executeSqlAsync` to only successful `ResultSet`. ([#24336](https://github.com/expo/expo/pull/24336) by [@kudo](https://github.com/kudo))

## 11.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- [iOS] Fixed build error when mixing with iOS built-in SQLite3. ([#23885](https://github.com/expo/expo/pull/23885) by [@kudo](https://github.com/kudo))
- [Android] Fixed select queries with CTEs crashing on Android. ([#24132](https://github.com/expo/expo/pull/24132) by [@derekstavis](https://github.com/derekstavis))

### 💡 Others

- Remove unneeded resource bundle. ([#23813](https://github.com/expo/expo/pull/23813) by [@alanjhughes](https://github.com/alanjhughes))
- Update `SQLite` on `Android`. ([#23993](https://github.com/expo/expo/pull/23993) by [@alanjhughes](https://github.com/alanjhughes))

## 11.5.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 11.4.0 — 2023-07-28

### 🎉 New features

- Add synchronous method `closeSync`. ([#23757](https://github.com/expo/expo/pull/23757) by [@alanjhughes](https://github.com/alanjhughes))

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
