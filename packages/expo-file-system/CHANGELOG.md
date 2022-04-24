# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
