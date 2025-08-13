# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- [iOS] Support Apple TV. ([#38475](https://github.com/expo/expo/pull/38475) by [@douglowder](https://github.com/douglowder))
- Added `loadExtensionAsync` / `loadExtensionSync` APIs and pre-bundled [sqlite-vec](https://github.com/asg017/sqlite-vec) extension. ([#38693](https://github.com/expo/expo/pull/38693) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- [Android] Fix nullability of binding params. ([#37200](https://github.com/expo/expo/pull/37200) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

### 📚 3rd party library updates

- Updated SQLite to 3.50.3. ([#38200](https://github.com/expo/expo/pull/38200) by [@kudo](https://github.com/kudo))

## 15.2.14 - 2025-07-07

### 🐛 Bug fixes

- Fixed unnecessary database reopen from `SQLiteProvider` with same options. ([#37872](https://github.com/expo/expo/pull/37872) by [@kudo](https://github.com/kudo))

## 15.2.13 - 2025-07-01

### 🐛 Bug fixes

- Added Android 16KB page size support. ([#37446](https://github.com/expo/expo/pull/37446) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- Updated libSQL SDK to 0.9.11. ([#37442](https://github.com/expo/expo/pull/37442) by [@kudo](https://github.com/kudo))

## 15.2.12 - 2025-06-08

### 🐛 Bug fixes

- Fixed exceptions when SQLite session API returns empty buffer. ([#37246](https://github.com/expo/expo/pull/37246) by [@kudo](https://github.com/kudo))
- Fixed minimum OS version support for libsql.xcframework. ([#37130](https://github.com/expo/expo/pull/37130) by [@kudo](https://github.com/kudo))

## 15.2.11 - 2025-06-04

### 💡 Others

- Prevent `maybeFinalizeAllStatements` throwing exceptions. ([#36843](https://github.com/expo/expo/pull/36843) by [@kudo](https://github.com/kudo))
- Apply [#36674](https://github.com/expo/expo/pull/36674) change to **SQLiteModuleLibSQL.swift**. ([#36850](https://github.com/expo/expo/pull/36850) by [@kudo](https://github.com/kudo)) ([#36674](https://github.com/expo/expo/pull/36674), [#36850](https://github.com/expo/expo/pull/36850) by [@kudo](https://github.com/kudo))

## 15.2.10 — 2025-05-08

### 🐛 Bug fixes

- Fixed parallel issue for `Statement.executeAsync`. ([#36674](https://github.com/expo/expo/pull/36674) by [@kudo](https://github.com/kudo))

### 💡 Others

- Avoided synchronous API calls for `kv-store`. ([#36669](https://github.com/expo/expo/pull/36669) by [@kudo](https://github.com/kudo))
- Improved synchronous APIs on web. ([#36670](https://github.com/expo/expo/pull/36670) by [@kudo](https://github.com/kudo))

## 15.2.9 — 2025-04-30

_This version does not introduce any user-facing changes._

## 15.2.8 — 2025-04-30

### 📚 3rd party library updates

- Updated libsql libs to `libsql-0.9.5`. ([#36444](https://github.com/expo/expo/pull/36444) by [@kudo](https://github.com/kudo))

## 15.2.7 — 2025-04-25

_This version does not introduce any user-facing changes._

## 15.2.6 — 2025-04-21

_This version does not introduce any user-facing changes._

## 15.2.5 — 2025-04-14

_This version does not introduce any user-facing changes._

## 15.2.4 — 2025-04-11

_This version does not introduce any user-facing changes._

## 15.2.3 — 2025-04-11

_This version does not introduce any user-facing changes._

## 15.2.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 15.2.1 — 2025-04-08

_This version does not introduce any user-facing changes._

## 15.2.0 — 2025-04-04

### 🎉 New features

- Added web support. ([#35207](https://github.com/expo/expo/pull/35207) by [@kudo](https://github.com/kudo))
- Added [Session Extension](https://www.sqlite.org/sessionintro.html) support. ([#35457](https://github.com/expo/expo/pull/35457), [#35458](https://github.com/expo/expo/pull/35458), [#35459](https://github.com/expo/expo/pull/35459), [#35461](https://github.com/expo/expo/pull/35461), [#35476](https://github.com/expo/expo/pull/35476) by [@kudo](https://github.com/kudo))
- Added `backupDatabaseAsync` and `backupDatabaseSync` APIs. ([#35604](https://github.com/expo/expo/pull/35604) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed build error for conflict `libc++_shared.so` on Android. ([#35298](https://github.com/expo/expo/pull/35298) by [@kudo](https://github.com/kudo))
- Added reference counting for database closing functions. ([#35818](https://github.com/expo/expo/pull/35818) by [@kudo](https://github.com/kudo))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- Fixed resolving libsql binary issue on iOS. ([#34529](https://github.com/expo/expo/pull/34529) by [@kudo](https://github.com/kudo))
- Removed deprecated CR-SQLite integration. ([#35097](https://github.com/expo/expo/pull/35097) by [@kudo](https://github.com/kudo))
- Remove prebuilt worker on Web. ([#35311](https://github.com/expo/expo/pull/35311) by [@kudo](https://github.com/kudo))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))
- Fixed build warnings. ([#35610](https://github.com/expo/expo/pull/35610) by [@kudo](https://github.com/kudo))
- Added backup and session API stubs to LibSQL implementations. ([#35755](https://github.com/expo/expo/pull/35755) by [@kudo](https://github.com/kudo))
- Updated function docs. ([#35761](https://github.com/expo/expo/pull/35761) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- Updated SQLite to 3.49.1 and SQLCipher to 4.7.0. ([#35741](https://github.com/expo/expo/pull/35741) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- Changed async tasks to run on a dedicated parallel queue. ([#35896](https://github.com/expo/expo/pull/35896) by [@kudo](https://github.com/kudo))

## 15.1.4 - 2025-04-02

### 🐛 Bug fixes

- Fixed `syncLibSQL` return type. ([#35804](https://github.com/expo/expo/pull/35804) by [@kudo](https://github.com/kudo))

## 15.1.3 - 2025-03-26

### 💡 Others

- Updated libsql libs. ([#35708](https://github.com/expo/expo/pull/35708) by [@kudo](https://github.com/kudo))

## 15.1.2 - 2025-02-05

### 💡 Others

- Added offline-writes support for libSQL. ([#34673](https://github.com/expo/expo/pull/34673) by [@kudo](https://github.com/kudo))

## 15.1.0 - 2025-01-27

### 🎉 New features

- Added experimental libSQL support. ([#34177](https://github.com/expo/expo/pull/34177), [#34205](https://github.com/expo/expo/pull/34205) by [@kudo](https://github.com/kudo))

## 15.0.6 - 2025-01-10

_This version does not introduce any user-facing changes._

## 15.0.5 - 2024-12-30

_This version does not introduce any user-facing changes._

## 15.0.4 - 2024-12-26

### 🐛 Bug fixes

- Replaced the cached statement manager with `sqlite3_next_stmt` and prevented uncaught statements from leaking. [#34992](https://github.com/expo/expo/pull/34992) by [@Bowlerr](https://github.com/Bowlerr))
- Fixed exceptions when converting empty blob data on iOS. ([#33564](https://github.com/expo/expo/pull/33564) by [@kudo](https://github.com/kudo))
- Fixed `expo-sqlite/kv-store` async API not being well handled when using AsyncStorage compatible api ([#33847](https://github.com/expo/expo/pull/33847) by [@rtorrente](https://github.com/rtorrente))
- Fixed `database is locked` error from parallel `kv-store` operations. ([#33834](https://github.com/expo/expo/pull/33834) by [@kudo](https://github.com/kudo))
- Fixed `database is locked` error while using `kv-store multiGet` function. ([#33873](https://github.com/expo/expo/pull/33873) by [@rtorrente](https://github.com/rtorrente))

### 💡 Others

- Removed unused `SQLite3Wrapper` code for legacy implementation on Android. ([#33565](https://github.com/expo/expo/pull/33565) by [@kudo](https://github.com/kudo))
- Enforce input validations in `kv-store` operations. ([#33874](https://github.com/expo/expo/pull/33874) by [@rtorrente](https://github.com/rtorrente))

## 15.0.3 — 2024-11-12

### 🐛 Bug fixes

- Include the plugin under the `exports` in the package.json. ([#32780](https://github.com/expo/expo/pull/32780) by [@alanjhughes](https://github.com/alanjhughes))

## 15.0.2 — 2024-11-07

### 💡 Others

- Renamed `expo-sqlite/async-storage` to `expo-sqlite/kv-store`. ([#32699](https://github.com/expo/expo/pull/32699) by [@kudo](https://github.com/kudo))

## 15.0.1 — 2024-10-25

### 🎉 New features

- Added macOS support in expo-sqlite. ([#32181](https://github.com/expo/expo/pull/32181) by [@coolsoftwaretyler](https://github.com/coolsoftwaretyler))

## 15.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))
- Removed deprecated legacy expo-sqlite. ([#31766](https://github.com/expo/expo/pull/31766) by [@kudo](https://github.com/kudo))
- Removed `next` export. ([#32184](https://github.com/expo/expo/pull/32184) by [@reichhartd](https://github.com/reichhartd))

### 🎉 New features

- Added SQLCipher support. ([#30824](https://github.com/expo/expo/pull/30824), [#30825](https://github.com/expo/expo/pull/30825) by [@kudo](https://github.com/kudo))
- Added a way to specify custom directory for the database. ([#31278](https://github.com/expo/expo/pull/31278)) by [@IgorKhramtsov](https://github.com/IgorKhramtsov)
- Added key-value storage and compatible API with `@react-native-async-storage/async-storage`. ([#31596](https://github.com/expo/expo/pull/31596), [#31676](https://github.com/expo/expo/pull/31676) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30483](https://github.com/expo/expo/pull/30483) by [@byCedric](https://github.com/byCedric))
- Fixed build errors on iOS if other third-party libraries building with iOS system SQLite. ([#30824](https://github.com/expo/expo/pull/30824) by [@kudo](https://github.com/kudo))
- Fixed build error when using `incremental_installation` mode in CocoaPods. ([#30918](https://github.com/expo/expo/pull/30918) by [@kudo](https://github.com/kudo))
- Fixed prebuild error when `app.json` doesn't specify any plugin properties for `expo-sqlite`. ([#31672](https://github.com/expo/expo/pull/31672) by [@kudo](https://github.com/kudo))
- Fixed `SQLiteDatabase -> pathUtils -> SQLiteDatabase` require cycle warning from metro. ([#31956](https://github.com/expo/expo/pull/31956) by [@kudo](https://github.com/kudo))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Replaced `@testing-library/react-hooks` with `@testing-library/react-native`. ([#30742](https://github.com/expo/expo/pull/30742) by [@byCedric](https://github.com/byCedric))
- Align web implementation exports as native to support DOM components when using `@expo/dom-webview`. ([#31662](https://github.com/expo/expo/pull/31662) by [@kudo](https://github.com/kudo))
- Deprecated `enableCRSQLite` and show a warning if using this option. ([#32117](https://github.com/expo/expo/pull/32117) by [@kudo](https://github.com/kudo))

## 14.0.6 - 2024-07-31

### 🐛 Bug fixes

- Fixed the "disk I/O error" on older Android devices. ([#30718](https://github.com/expo/expo/pull/30718) by [@kudo](https://github.com/kudo))

## 14.0.5 - 2024-07-23

### 🐛 Bug fixes

- Fixed invalid characters for prepared statements on iOS. ([#30579](https://github.com/expo/expo/pull/30579) by [@kudo](https://github.com/kudo))

## 14.0.4 - 2024-06-27

### 🐛 Bug fixes

- [Android] Reduce the number of global references to `NativeStatementBinding`. ([#29937](https://github.com/expo/expo/pull/29937) by [@lukmccall](https://github.com/lukmccall))
- [iOS] Fixed `<SQLiteProvider assetSource={{ assetId: require(...) }}>` database always being overwrite on iOS 16 and lower. ([#29945](https://github.com/expo/expo/pull/29945) by [@kudo](https://github.com/kudo))

## 14.0.3 — 2024-04-23

_This version does not introduce any user-facing changes._

## 14.0.2 — 2024-04-22

### 🎉 New features

- Bumped SQLite version to 3.45.3 and enabled the [bytecodevtab](https://www.sqlite.org/bytecodevtab.html) feature. ([#28358](https://github.com/expo/expo/pull/28358) by [@kudo](https://github.com/kudo))

## 14.0.1 — 2024-04-19

### 🎉 New features

- Added `SQLiteProvider.assetSource` to import an existing database from assets. ([#28291](https://github.com/expo/expo/pull/28291) by [@kudo](https://github.com/kudo))

## 14.0.0 — 2024-04-18

### 🛠 Breaking changes

- Moved the previous default export as `expo-sqlite/legacy` and promoted `expo-sqlite/next` as the default. `expo-sqlite/next` import is still as-is for backward compatibility. ([#28278](https://github.com/expo/expo/pull/28278) by [@kudo](https://github.com/kudo))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 13.4.0 - 2024-03-20

### 🐛 Bug fixes

- Enabled [FTS](https://www.sqlite.org/fts3.html) and [FTS5](https://www.sqlite.org/fts5.html) for SQLite. ([#27738](https://github.com/expo/expo/pull/27738) by [@kudo](https://github.com/kudo))
- Fixed `NullPointerException` on Android when opening the same database multiple times. ([#27748](https://github.com/expo/expo/pull/27748) by [@kudo](https://github.com/kudo))

## 13.3.0 - 2024-03-05

### 🎉 New features

- [Android] Added `expo.sqlite.customBuildFlags` gradle property to support custom sqlite3 building flags. ([#27385](https://github.com/expo/expo/pull/27385) by [@kudo](https://github.com/kudo))
- Added `serializeAsync()` and `deserializeDatabaseAsync()` to serialze and deserialize databases. ([#27422](https://github.com/expo/expo/pull/27422) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed `expo-sqlite/next` cannot be imported from an ESM project. ([#27423](https://github.com/expo/expo/pull/27423) by [@kudo](https://github.com/kudo))

## 13.2.2 - 2024-01-25

### 💡 Others

- Remove `onDatabaseChange` event from legacy API as it is not supported natively. ([#26655](https://github.com/expo/expo/pull/26655) by [@alanjhughes](https://github.com/alanjhughes))

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
