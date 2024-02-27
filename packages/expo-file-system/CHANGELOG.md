# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 16.0.7 — 2024-02-27

### 🐛 Bug fixes

- [iOS] Fix downloadAsync for local files. ([#27187](https://github.com/expo/expo/pull/27187) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `iOS`, fix an issue with `copyAsync` where the copy fails if it is a photo library asset. ([#27208](https://github.com/expo/expo/pull/27208) by [@alanjhughes](https://github.com/alanjhughes))

## 16.0.6 — 2024-02-06

### 🐛 Bug fixes

- On `iOS`, fix upload task requests. ([#26880](https://github.com/expo/expo/pull/26880) by [@alanjhughes](https://github.com/alanjhughes))

## 16.0.5 — 2024-01-23

### 🐛 Bug fixes

- On `iOS`, set `httpMethod` on upload requests. ([#26516](https://github.com/expo/expo/pull/26516) by [@alanjhughes](https://github.com/alanjhughes))

## 16.0.4 — 2024-01-18

_This version does not introduce any user-facing changes._

## 16.0.3 — 2024-01-10

### 🎉 New features

- Added support for macOS platform. ([#26253](https://github.com/expo/expo/pull/26253) by [@tsapeta](https://github.com/tsapeta))

## 16.0.2 — 2023-12-19

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
