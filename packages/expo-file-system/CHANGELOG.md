# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 11.1.3 — 2021-06-24

_This version does not introduce any user-facing changes._

## 11.1.2 — 2021-06-24

### 🛠 Breaking changes

- Added `AndroidManifest.xml` queries for intent handling. ([#13388](https://github.com/expo/expo/pull/13388) by [@EvanBacon](https://github.com/EvanBacon))

## 11.1.1 — 2021-06-22

_This version does not introduce any user-facing changes._

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
