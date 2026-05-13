# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.4 — 2026-05-08

### 💡 Others

- Improved public API docs. ([#45530](https://github.com/expo/expo/pull/45530) by [@barthap](https://github.com/barthap))

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-05

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))
- `copy()` and `move()` methods of `File` and `Directory` are now asynchronous and return a Promise. Use `copySync()` and `moveSync()` for synchronous behavior. ([#44359](https://github.com/expo/expo/pull/44359) by [@barthap](https://github.com/barthap))

### 🎉 New features

- [iOS] Add support for `mode` option when opening file handle. ([#44559](https://github.com/expo/expo/pull/44559) by [@gfemec](https://github.com/gfemec))
- Expose a typed config plugin function ([#44098](https://github.com/expo/expo/pull/44098) by [@zoontek](https://github.com/zoontek))
- Add support picking for multiple files and choosing multiple MIME types. File.pickFileAsync() has now feature parity with `expo-document-picker`. ([#43411](https://github.com/expo/expo/pull/43411) by [@HubertBer](https://github.com/HubertBer))
- Add `overwrite` option to copy and move methods. ([#42979](https://github.com/expo/expo/pull/42979) by [@barthap](https://github.com/barthap))
- [Android] Add `mode` option when opening file handle. ([#42983](https://github.com/expo/expo/pull/42983) by [@barthap](https://github.com/barthap))
- Add `onProgress` callback and `AbortSignal` support to `File.downloadFileAsync()`. ([#43053](https://github.com/expo/expo/pull/43053) by [@aleqsio](https://github.com/aleqsio))
- Add `file.createUploadTask()` and `File.createDownloadTask()` APIs ([#44055](https://github.com/expo/expo/pull/44055) by [@barthap](https://github.com/barthap))
- Add `File.upload()` with legacy-compatible upload semantics, progress callbacks, and `AbortSignal` support. ([#45033](https://github.com/expo/expo/pull/45033) by [@barthap](https://github.com/barthap))
- Add support for watching file/directory events. ([#44986](https://github.com/expo/expo/pull/44986) by [@barthap](https://github.com/barthap))

### 🐛 Bug fixes

- [Android] Fix copy/move support for SAF and content provider URIs. ([#42887](https://github.com/expo/expo/pull/42887) by [@barthap](https://github.com/barthap))
- Fix out-of-memory errors when calculating file `md5` hash. ([#44064](https://github.com/expo/expo/pull/44064) by [@barthap](https://github.com/barthap))
- [iOS] Fix `totalDiskSpace` returning free disk space instead of total disk capacity. ([#44849](https://github.com/expo/expo/pull/44849) by [@shanebdavis](https://github.com/shanebdavis))
- Fix `onProgress` callback of `File.downloadFileAsync()` sometimes not firing on download completion. ([#45238](https://github.com/expo/expo/pull/45238) by [@barthap](https://github.com/barthap))
- [iOS] Fix `File.pickFileAsync()` greying out all files when using wildcard MIME types like `*/*` or `image/*`. ([#45245](https://github.com/expo/expo/pull/45245) by [@barthap](https://github.com/barthap))

### 💡 Others

- Deprecate `modificationTime` in favor of new `lastModified`, compatible with web `File` interface. ([#43411](https://github.com/expo/expo/pull/43411) by [@HubertBer](https://github.com/HubertBer))
- Deprecate `File.pickFileAsync(arg1, arg2)` in favour of new `File.pickFileAsync(options)`. ([#43411](https://github.com/expo/expo/pull/43411) by [@HubertBer](https://github.com/HubertBer))
- [Android] Optimized performance of copy and move operations. ([#44357](https://github.com/expo/expo/pull/44357), [#44358](https://github.com/expo/expo/pull/44358) by [@barthap](https://github.com/barthap))

## 55.0.19 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.18 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.17 - 2026-04-21

_This version does not introduce any user-facing changes._

## 55.0.16 - 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.15 - 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.14 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.13 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.12 - 2026-03-27

_This version does not introduce any user-facing changes._

## 55.0.11 - 2026-03-17

_This version does not introduce any user-facing changes._

## 55.0.10 - 2026-02-26

_This version does not introduce any user-facing changes._

## 55.0.9 — 2026-02-25

### 🐛 Bug fixes

- Fix incorrect return types for `File` and `Directory` static methods. ([#43282](https://github.com/expo/expo/pull/43282) by [@alanjhughes](https://github.com/alanjhughes))

## 55.0.8 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-20

### 🐛 Bug fixes

- Fix Jest mock to support new `File`/`Directory`/`Paths` API. ([#43005](https://github.com/expo/expo/pull/43005) by [@aleqsio](https://github.com/aleqsio))

## 55.0.6 — 2026-02-16

### 🐛 Bug fixes

- [Android] Fix bundle directory listing returning incorrect names, URIs and trailing slashes for files. ([#42882](https://github.com/expo/expo/pull/42882) by [@aleqsio](https://github.com/aleqsio))

## 55.0.5 — 2026-02-08

### 🎉 New features

- Add `append` option to write methods. ([#42778](https://github.com/expo/expo/pull/42778) by [@aleqsio](https://github.com/aleqsio))

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

- [file-system] Fix package exports for Typescript projects ([#39543](https://github.com/expo/expo/pull/39543) by [@smoores-dev](https://github.com/smoores-dev))

### 💡 Others

- [Android] Add `android:maxSdkVersion` annotation to `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions. ([#40976](https://github.com/expo/expo/pull/40976) by [@behenate](https://github.com/behenate))
- [Android] Removed references to legacy native modules API. ([#41791](https://github.com/expo/expo/pull/41791) by [@lukmccall](https://github.com/lukmccall))

## 19.0.20 - 2025-12-05

_This version does not introduce any user-facing changes._

## 19.0.19 - 2025-11-18

### 🎉 New features

- [Android] Add contentUri property. ([#40002](https://github.com/expo/expo/pull/40002) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- [iOS] Add missing `createFile` and `createDirectory` methods. ([#40314](https://github.com/expo/expo/pull/40314) by [@jakex7](https://github.com/jakex7))

## 19.0.18 - 2025-11-17

_This version does not introduce any user-facing changes._

## 19.0.17 - 2025-10-09

### 🐛 Bug fixes

- [Android] Fix recursive file deletion. ([#40248](https://github.com/expo/expo/pull/40248) by [@aleqsio](https://github.com/aleqsio))

## 19.0.16 - 2025-10-01

### 🎉 New features

- Add write options for base64 encoded bytes. ([#39963](https://github.com/expo/expo/pull/39963) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add file sharing config options ([#39286](https://github.com/expo/expo/pull/39286) by [@kosmydel](https://github.com/kosmydel))

### 🐛 Bug fixes

- Fix typedoc in the File class. ([#40064](https://github.com/expo/expo/pull/40064) by [@aleqsio](https://github.com/aleqsio))
- [Android] Fix getContentUri. ([#40001](https://github.com/expo/expo/pull/40001) by [@aleqsio](https://github.com/aleqsio))

## 19.0.15 - 2025-09-22

### 🎉 New features

- add `idempotent` option to `downloadFileAsync` ([#39681](https://github.com/expo/expo/pull/39681) by [@vonovak](https://github.com/vonovak))

## 19.0.14 — 2025-09-13

_This version does not introduce any user-facing changes._

## 19.0.13 — 2025-09-12

### 🐛 Bug fixes

- [Android] Fix incorrect AndroidManifest.xml location. ([#39134](https://github.com/expo/expo/pull/39134) by [@robertying](https://github.com/robertying))

## 19.0.12 — 2025-09-11

_This version does not introduce any user-facing changes._

## 19.0.11 — 2025-09-10

### 🎉 New features

- [iOS] Add `pickDirectoryAsync` support ([#39210](https://github.com/expo/expo/pull/39210) by [@kosmydel](https://github.com/kosmydel))

### 🐛 Bug fixes

- Add minimal web stub to fix broken imports on web ([#39400](https://github.com/expo/expo/pull/39400) by [@LeonDvlpmnt](https://github.com/LeonDvlpmnt))

## 19.0.10 — 2025-09-08

_This version does not introduce any user-facing changes._

## 19.0.9 — 2025-09-03

### 🎉 New features

- Add stubs for legacy methods imported from "expo-file-system". ([#39244](https://github.com/expo/expo/pull/39244) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- [iOS] Fix tvOS compile error. ([#39345](https://github.com/expo/expo/pull/39345) by [@douglowder](https://github.com/douglowder))

## 19.0.8 — 2025-09-02

### 🎉 New features

- [iOS] Add `pickFileAsync` support ([#39173](https://github.com/expo/expo/pull/39173) by [@kosmydel](https://github.com/kosmydel))

## 19.0.7 — 2025-08-31

### 🎉 New features

- Add `rename` method for files and directories ([#39138](https://github.com/expo/expo/pull/39138) by [@kosmydel](https://github.com/kosmydel))
- Add `idempotent` option for creating directories ([#39121](https://github.com/expo/expo/pull/39121) by [@kosmydel](https://github.com/kosmydel))

## 19.0.6 — 2025-08-26

_This version does not introduce any user-facing changes._

## 19.0.5 — 2025-08-25

_This version does not introduce any user-facing changes._

## 19.0.4 — 2025-08-21

_This version does not introduce any user-facing changes._

## 19.0.3 — 2025-08-18

### 🐛 Bug fixes

- Fixed type definition for `textSync()` to return `string` instead of `Promise<string>` ([#38898](https://github.com/expo/expo/pull/38898) by [@LeonDvlpmnt](https://github.com/LeonDvlpmnt))

## 19.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 19.0.1 — 2025-08-15

### 💡 Others

- Update typings for `typescript@5.9` ([#38833](https://github.com/expo/expo/pull/38833) by [@kitten](https://github.com/kitten))
- Change Constants to Constant/Property. ([#38926](https://github.com/expo/expo/pull/38926) by [@jakex7](https://github.com/jakex7))

## 19.0.0 — 2025-08-13

### 🛠 Breaking changes

- Make the modern filesystem API the default, move previous one to `expo-file-system/legacy`. ([#38404](https://github.com/expo/expo/pull/38404) by [@aleqsio](https://github.com/aleqsio))

### 🎉 New features

- [android] Add file and directory pickers. ([#38455](https://github.com/expo/expo/pull/38455) by [@aleqsio](https://github.com/aleqsio))
- Add support for asset uris. ([#38785](https://github.com/expo/expo/pull/38785) by [@aleqsio](https://github.com/aleqsio))
- Make file implement blob interface directly. ([#38160](https://github.com/expo/expo/pull/38160) by [@aleqsio](https://github.com/aleqsio))
- Add directory info function ([#37910](https://github.com/expo/expo/pull/37910) by [@Wenszel](https://github.com/Wenszel))
- Add total and available sizes, directory sizes. ([#37594](https://github.com/expo/expo/pull/37594) by [@aleqsio](https://github.com/aleqsio))
- Add info method, modificationTime and creationTime properties to file-system/next. ([#37505](https://github.com/expo/expo/pull/37505) by [@Wenszel](https://github.com/Wenszel))
- Add support for custom headers in downloadFileAsync ([#36108](https://github.com/expo/expo/pull/36108) by [@leonhh](https://github.com/leonhh))
- [next] Add limited support for SAF Uris. ([#38075](https://github.com/expo/expo/pull/38075) by [@aleqsio](https://github.com/aleqsio))
- [next] Add full support for SAF Uris. ([#38075](https://github.com/expo/expo/pull/38075) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- Update exists logic to align with documentation ([#37692](https://github.com/expo/expo/pull/37692) by [@Wenszel](https://github.com/Wenszel))
- Fix memory usage issue in getInfoAsync ([#37417](https://github.com/expo/expo/pull/37417) by [@Wenszel](https://github.com/Wenszel))
- Improved type safety in the FileSystem module to support tsconfig setups with stricter rules than the default. ([#37107](https://github.com/expo/expo/pull/37107) by [@hirbod](https://github.com/hirbod))
- Added required modifiers in the FileSystem module to support tsconfig setups with stricter rules than the default. ([#37467](https://github.com/expo/expo/pull/37467)

## 18.1.11 - 2025-07-01

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 18.1.10 — 2025-05-08

### 🐛 Bug fixes

- Fix the `UploadTask.uploadAsync` method's return type did not indicate that the method could resolve to `null`. ([#36476](https://github.com/expo/expo/pull/36476) by [@DoctorJohn](https://github.com/DoctorJohn))

## 18.1.9 — 2025-05-03

_This version does not introduce any user-facing changes._

## 18.1.8 — 2025-04-30

_This version does not introduce any user-facing changes._

## 18.1.7 — 2025-04-28

### 💡 Others

- Remove `web-streams-polyfill` in favor of `expo` support. ([#36407](https://github.com/expo/expo/pull/36407) by [@EvanBacon](https://github.com/EvanBacon))

## 18.1.6 — 2025-04-25

_This version does not introduce any user-facing changes._

## 18.1.5 — 2025-04-21

_This version does not introduce any user-facing changes._

## 18.1.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 18.1.3 — 2025-04-11

_This version does not introduce any user-facing changes._

## 18.1.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 18.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 18.1.0 — 2025-04-04

### 🛠 Breaking changes

- Bump minimum macOS version to 11.0. ([#34980](https://github.com/expo/expo/pull/34980) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🎉 New features

- [expo-file-system][next] Add options to the create function. ([#32909](https://github.com/expo/expo/pull/32909) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- [next] Fix inconsistent behavior when using special chars in filenames. ([#35801](https://github.com/expo/expo/pull/35801) by [@aleqsio](https://github.com/aleqsio))
- Fix expo-updates breaking filesystem on Android API 24 and 25. ([#33694](https://github.com/expo/expo/pull/33694) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 18.0.12 - 2025-03-20

_This version does not introduce any user-facing changes._

## 18.0.11 - 2025-02-19

_This version does not introduce any user-facing changes._

## 18.0.10 - 2025-02-06

_This version does not introduce any user-facing changes._

## 18.0.9 - 2025-02-03

_This version does not introduce any user-facing changes._

## 18.0.8 - 2025-01-31

### 🐛 Bug fixes

- Fix types that are erroring in default template. ([#34520](https://github.com/expo/expo/pull/34520) by [@aleqsio](https://github.com/aleqsio))
- [Android] fixed issue with deleting a directory with children ([#34550](https://github.com/expo/expo/pull/34550) by [@chrfalch](https://github.com/chrfalch))

## 18.0.7 - 2025-01-10

_This version does not introduce any user-facing changes._

## 18.0.6 - 2024-12-16

### 🎉 New features

- [next] Add blob support and `.blob()` function. ([#33152](https://github.com/expo/expo/pull/33152) by [@aleqsio](https://github.com/aleqsio))

## 18.0.5 - 2024-12-10

### 🐛 Bug fixes

- [macOS][next]: Add availability checks ([#33504](https://github.com/expo/expo/pull/33504) by [@hassankhan](https://github.com/hassankhan))

## 18.0.4 — 2024-11-19

### 🎉 New features

- [next] Added `.bytes()` and writing a `Uint8Array`. ([#33020](https://github.com/expo/expo/pull/33020) by [@aleqsio](https://github.com/aleqsio))

## 18.0.3 — 2024-11-13

### 🎉 New features

- [next] Add file handles. ([#31738](https://github.com/expo/expo/pull/31738) by [@aleqsio](https://github.com/aleqsio))

## 18.0.2 — 2024-11-11

_This version does not introduce any user-facing changes._

## 18.0.1 — 2024-11-07

### 🐛 Bug fixes

- [expo-file-system][next] Fix download function throwing an unexpected error if destination already exists. ([#32626](https://github.com/expo/expo/pull/32626) by [@aleqsio](https://github.com/aleqsio))

## 18.0.0 — 2024-10-22

### 🛠 Breaking changes

- [next] Disable module in Expo Go. ([#31938](https://github.com/expo/expo/pull/31938) by [@aleqsio](https://github.com/aleqsio))
- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [expo-file-system][next] Add file permissions for expo go ([#31594](https://github.com/expo/expo/pull/31594) by [@aleqsio](https://github.com/aleqsio))
- [expo-file-system][next] Add better error handling to delete ([#31683](https://github.com/expo/expo/pull/31683) by [@aleqsio](https://github.com/aleqsio))
- [expo-file-system][next] Adjust copy/move functions to allow renaming folders. ([#31636](https://github.com/expo/expo/pull/31636) by [@aleqsio](https://github.com/aleqsio))
- [expo-file-system][next] Add name property to files and directories. ([#31545](https://github.com/expo/expo/pull/31545) by [@aleqsio](https://github.com/aleqsio))
- Add path joining in `File` and `Directory` constructors. ([#31467](https://github.com/expo/expo/pull/31467) by [@aleqsio](https://github.com/aleqsio))
- [expo-file-system][next] Make move operation change file url. ([#31544](https://github.com/expo/expo/pull/31544) by [@aleqsio](https://github.com/aleqsio))
- Change `exists()` function to a property. ([#31522](https://github.com/expo/expo/pull/31522) by [@aleqsio](https://github.com/aleqsio))
- Add path utilities and `parentDirectory`, `extension` fields to the new file system module. ([#31333](https://github.com/expo/expo/pull/31333) by [@aleqsio](https://github.com/aleqsio))
- Add listing directory contents to the new file system module. ([#31121](https://github.com/expo/expo/pull/31121) by [@aleqsio](https://github.com/aleqsio))
- Add `base64()` new file system module. ([#31357](https://github.com/expo/expo/pull/31357) by [@aleqsio](https://github.com/aleqsio))
- Add size and md5 properties to the new file system module. ([#31301](https://github.com/expo/expo/pull/31301) by [@aleqsio](https://github.com/aleqsio))
- Add downloading to the new file system module. ([#30841](https://github.com/expo/expo/pull/30841) by [@aleqsio](https://github.com/aleqsio))
- Add copying and moving files to the new file system module. ([#30314](https://github.com/expo/expo/pull/30314) by [@aleqsio](https://github.com/aleqsio))
- Add new file system module. ([#29995](https://github.com/expo/expo/pull/29995) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Added `Paths.appleSharedContainers` to get the paths to the Apple App Groups shared containers. ([#31525](https://github.com/expo/expo/pull/31525) by [@IgorKhramtsov](https://github.com/IgorKhramtsov) and [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- [iOS] fix: `getFreeDiskStorageAsync` returns result that's closer to the value reported by the system. ([#29732](https://github.com/expo/expo/pull/29732) by [@vonovak](https://github.com/vonovak))
- Add NULL check before dereferencing pointer to error pointer in `EXFileSystemAssetLibraryHandler`. ([#29091](https://github.com/expo/expo/pull/29091) by [@hakonk](https://github.com/hakonk))
- Add missing `react-native` peer dependencies for isolated modules. ([#30466](https://github.com/expo/expo/pull/30466) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- [iOS] Validate folder/file type when operating on File/Folder instances in the new FS module. ([#31316](https://github.com/expo/expo/pull/31316) by [@aleqsio](https://github.com/aleqsio))
- Use the `src` folder as the Metro target. ([#31234](https://github.com/expo/expo/pull/31234) by [@aleqsio](https://github.com/aleqsio))
- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))

## 17.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 17.0.0 — 2024-04-18

### 🐛 Bug fixes

- [Android] remove `CookieHandler` as it's no longer in the module registry and not necessary. ([#28145](https://github.com/expo/expo/pull/28145) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [iOS] Add privacy manifest describing required reason API usage. ([#27770](https://github.com/expo/expo/pull/27770) by [@aleqsio](https://github.com/aleqsio))
- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 16.0.8 - 2024-03-07

_This version does not introduce any user-facing changes._

## 16.0.7 - 2024-02-27

### 🐛 Bug fixes

- [iOS] Fix downloadAsync for local files. ([#27187](https://github.com/expo/expo/pull/27187) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `iOS`, fix an issue with `copyAsync` where the copy fails if it is a photo library asset. ([#27208](https://github.com/expo/expo/pull/27208) by [@alanjhughes](https://github.com/alanjhughes))
- On `iOS`, resolve the promise manually after copying a PHAsset file. ([#27381](https://github.com/expo/expo/pull/27381) by [@alanjhughes](https://github.com/alanjhughes))

## 16.0.6 - 2024-02-06

### 🐛 Bug fixes

- On `iOS`, fix upload task requests. ([#26880](https://github.com/expo/expo/pull/26880) by [@alanjhughes](https://github.com/alanjhughes))

## 16.0.5 - 2024-01-23

### 🐛 Bug fixes

- On `iOS`, set `httpMethod` on upload requests. ([#26516](https://github.com/expo/expo/pull/26516) by [@alanjhughes](https://github.com/alanjhughes))

## 16.0.4 - 2024-01-18

_This version does not introduce any user-facing changes._

## 16.0.3 - 2024-01-10

### 🎉 New features

- Added support for macOS platform. ([#26253](https://github.com/expo/expo/pull/26253) by [@tsapeta](https://github.com/tsapeta))

## 16.0.2 - 2023-12-19

_This version does not introduce any user-facing changes._

## 16.0.1 — 2023-12-13

_This version does not introduce any user-facing changes._

## 16.0.0 — 2023-12-12

### 🐛 Bug fixes

- On `Android`, handle using files from `SAF` correctly. ([#25389](https://github.com/expo/expo/pull/25389) by [@alanjhughes](https://github.com/alanjhughes))
- Removed legacy `bundledAssets` constant that was used only in standalone apps. ([#25484](https://github.com/expo/expo/pull/25484) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Added missing check for directory permissions in `deleteAsync` method. ([#25704](https://github.com/expo/expo/pull/25704) by [@tsapeta](https://github.com/tsapeta))

## 15.4.5 — 2023-11-20

### 🐛 Bug fixes

- On `Android`, use `addInterceptor` instead of `addNetworkInterceptor` in `downloadResumableStartAsync`. ([#24702](https://github.com/expo/expo/pull/24702) by [@alanhughes](https://github.com/alanjhughes))

## 15.9.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 15.8.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- On `Android`, use `addInterceptor` instead of `addNetworkInterceptor` in `downloadResumableStartAsync`. ([#24702](https://github.com/expo/expo/pull/24702) by [@alanhughes](https://github.com/alanjhughes))

## 15.7.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Migrated to Swift and Expo Modules API on iOS. ([#23943](https://github.com/expo/expo/pull/23943) by [@tsapeta](https://github.com/tsapeta))
- Throw the correct error when we can't find the permissions modules. ([#24464](https://github.com/expo/expo/pull/24464) by [@alanhughes](https://github.com/alanjhughes))

## 15.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 15.4.4 - 2023-08-29

_This version does not introduce any user-facing changes._

## 15.4.3 - 2023-08-09

### 🐛 Bug fixes

- Fix regression in `copyAsync` on Android. ([#23892](https://github.com/expo/expo/pull/23892) by [@brentvatne](https://github.com/brentvatne))

## 15.5.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 15.5.0 — 2023-07-28

### 💡 Others

- Fork `uuid@3.4.0` and move into `expo-modules-core`. Remove the original dependency. ([#23249](https://github.com/expo/expo/pull/23249) by [@alanhughes](https://github.com/alanjhughes))

## 15.4.2 — 2023-06-28

_This version does not introduce any user-facing changes._

## 15.4.1 — 2023-06-27

### 🐛 Bug fixes

- Fixed hard crash on iOS when calling readDirectoryAsync. ([#23106](https://github.com/expo/expo/pull/23106) by [@aleqsio](https://github.com/aleqsio))

## 15.4.0 — 2023-06-13

### 🎉 New features

- Migrated Android codebase to use Expo modules API. ([#22728](https://github.com/expo/expo/pull/22728) by [@alanhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 15.3.0 — 2023-05-08

### 🛠 Breaking changes

- Removed the deprecated `UploadProgressData.totalByteSent` field. ([#22277](https://github.com/expo/expo/pull/22277) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Add UTF-8 URI support on iOS. ([#21196](https://github.com/expo/expo/pull/21196) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 15.2.2 — 2023-02-09

_This version does not introduce any user-facing changes._

## 15.2.1 — 2023-02-09

### 🐛 Bug fixes

- Add utf-8 uri support on iOS. ([#21098](https://github.com/expo/expo/pull/21098) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 15.2.0 — 2023-02-03

### 💡 Others

- Extract nested object definitions to the separate types, which adds: `DeletingOptions`, `InfoOptions`, `RelocatingOptions` and `MakeDirectoryOptions` types. ([#20103](https://github.com/expo/expo/pull/20103) by [@Simek](https://github.com/Simek))
- Simplify the way in which types are exported from the package. ([#20103](https://github.com/expo/expo/pull/20103) by [@Simek](https://github.com/Simek))
- Rename `UploadProgressData` `totalByteSent` field to `totalBytesSent`. ([#20804](https://github.com/expo/expo/pull/20804) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 15.1.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 15.1.0 — 2022-10-25

### 🎉 New features

- Added `DirectoriesModule` to expo-file-system on Android as a temporary solution to fix cache directories being incorrect in new Sweet API modules. ([#19205](https://github.com/expo/expo/pull/19205) by [@aleqsio](https://github.com/aleqsio))

## 15.0.0 — 2022-10-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 14.1.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 14.0.0 — 2022-04-18

### 🛠 Breaking changes

- Remove okhttp and okio backward compatible workaround and drop react-native 0.64 support. ([#16446](https://github.com/expo/expo/pull/16446) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed failing download on Android when using `createDownloadResumable()`, because of an invalid Range header. ([#15934](https://github.com/expo/expo/pull/15934) by [@johanpoirier](https://github.com/johanpoirier))
- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))
- Fix URL scheme differences between iOS and Android. ([#16352](https://github.com/expo/expo/pull/16352) by [@hbiede](https://github.com/hbiede))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 13.2.1 — 2022-01-20

### 🐛 Bug fixes

- Fix build errors on React Native 0.66 caused by `okio` and `okhttp`. ([#15632](https://github.com/expo/expo/pull/15632) by [@kudo](https://github.com/kudo))

## 13.2.0 — 2021-12-22

### 🐛 Bug fixes

- Fixed runtime crash due to `.toUpperCase` not being invoked as a function, it was missing `()`. ([#15615](https://github.com/expo/expo/pull/15615) by [@lukebrandonfarrell](https://github.com/lukebrandonfarrell))
- Fixed `totalByteSent` in upload progress callback incorrectly sending `bytesSent` on iOS. ([#15615](https://github.com/expo/expo/pull/15615) by [@lukebrandonfarrell](https://github.com/lukebrandonfarrell))
- Fixed simulator runtime crash on arm64 devices caused by `CFRelease(NULL)`. ([#15496](https://github.com/expo/expo/pull/15496) by [@daxaxelrod](https://github.com/daxaxelrod))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

## 13.1.4 — 2022-02-10

_This version does not introduce any user-facing changes._

## 13.1.3 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 13.1.2 — 2022-01-22

### 🐛 Bug fixes

- Fixed runtime crash due to `.toUpperCase` not being invoked as a function, it was missing `()`. ([#15615](https://github.com/expo/expo/pull/15615) by [@lukebrandonfarrell](https://github.com/lukebrandonfarrell))
- Fixed `totalByteSent` in upload progress callback incorrectly sending `bytesSent` on iOS. ([#15615](https://github.com/expo/expo/pull/15615) by [@lukebrandonfarrell](https://github.com/lukebrandonfarrell))
- Fixed simulator runtime crash on arm64 devices caused by `CFRelease(NULL)`. ([#15496](https://github.com/expo/expo/pull/15496) by [@daxaxelrod](https://github.com/daxaxelrod))

## 13.1.1 — 2022-01-20

### 🐛 Bug fixes

- Fix build errors on React Native 0.66 caused by `okio` and `okhttp`. ([#15632](https://github.com/expo/expo/pull/15632) by [@kudo](https://github.com/kudo))

## 13.1.0 — 2021-11-17

### 🐛 Bug fixes

- Fixed `uploadAsync` failing to resolve when using `BINARY_CONTENT`. ([#14764](https://github.com/expo/expo/pull/14764) by [@cruzach](https://github.com/cruzach))
- Fix `okio` library build error for `react-native@0.65` or above. ([#14761](https://github.com/expo/expo/pull/14761) by [@kudo](https://github.com/kudo))

## 13.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 13.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- `getFreeDiskStorageAsync` now correctly reports free disk space on iOS. ([#14279](https://github.com/expo/expo/pull/14279) by [mickmaccallum](https://github.com/mickmaccallum))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))
- Rewritten module to Kotlin. ([#14549](https://github.com/expo/expo/pull/14549) by [@mstach60161](https://github.com/mstach60161))

## 12.0.0 — 2021-09-08

### 🛠 Breaking changes

- Added `AndroidManifest.xml` queries for intent handling. ([#13388](https://github.com/expo/expo/pull/13388) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13749](https://github.com/expo/expo/pull/13749) by [@tsapeta](https://github.com/tsapeta))

## 11.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Fixed crash of file system when try to read cache dir file on android. ([#12716](https://github.com/expo/expo/pull/13232) by [@nomi9995](https://github.com/nomi9995))

### 💡 Others

- Migrated from `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Refactored uuid imports to v7 style. ([#13037](https://github.com/expo/expo/pull/13037) by [@giautm](https://github.com/giautm))

## 11.0.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 11.0.1 — 2021-04-09

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Added support for Storage Access Framework (**Android only**). ([#12032](https://github.com/expo/expo/pull/12032) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed copying movies from assets not working on iOS. ([#11749](https://github.com/expo/expo/pull/11749) by [@lukmccall](https://github.com/lukmccall))
- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 9.3.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.2.0 — 2020-08-18

### 🐛 Bug fixes

- Added docs about Android permissions and removed old storage permission. ([#9447](https://github.com/expo/expo/pull/9447) by [@bycedric](https://github.com/bycedric))

## 9.1.0 — 2020-07-27

### 🐛 Bug fixes

- Fix background URL session completion handler not being called. ([#8599](https://github.com/expo/expo/pull/8599) by [@lukmccall](https://github.com/lukmccall))
- Fix compilation error on macOS Catalyst ([#9055](https://github.com/expo/expo/pull/9055) by [@andymatuschak](https://github.com/andymatuschak))
- Fixed `uploadAsync` native signature on Android. ([#9076](https://github.com/expo/expo/pull/9076) by [@lukmccall](https://github.com/lukmccall))
- Fixed `uploadAsync` throwing `Double cannot be cast to Integer` on Android. ([#9076](https://github.com/expo/expo/pull/9076) by [@lukmccall](https://github.com/lukmccall))
- Fixed `getInfo` returning incorrect size when provided path points to a folder. ([#9063](https://github.com/expo/expo/pull/9063) by [@lukmccall](https://github.com/lukmccall))
- Fixed `uploadAsync()` returning empty response on iOS. ([#9166](https://github.com/expo/expo/pull/9166) by [@barthap](https://github.com/barthap))

## 9.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-05-27

### 🛠 Breaking changes

- `FileSystem.downloadAsync` and `FileSystem.DownloadResumable` work by default when the app is in background too — they won't reject when the application is backgrounded. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
- `FileSystem.downloadAsync` and `FileSystem.DownloadResumable` will reject when invalid headers dictionary is provided. These methods accept only `Record<string, string>`. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
- `FileSystem.getContentUriAsync` now returns a string. ([#7192](https://github.com/expo/expo/pull/7192) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Add `FileSystem.uploadAsync` method. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
- Add ability to read Android `raw` and `drawable` resources in `FileSystem.getInfoAsync`, `FileSystem.readAsStringAsync`, and `FileSystem.copyAsync`. ([#8104](https://github.com/expo/expo/pull/8104) by [@esamelson](https://github.com/esamelson))
