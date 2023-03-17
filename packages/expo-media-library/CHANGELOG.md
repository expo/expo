# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 15.2.3 — 2023-03-17

_This version does not introduce any user-facing changes._

## 15.2.2 — 2023-02-23

_This version does not introduce any user-facing changes._

## 15.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 15.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 15.1.0 — 2022-12-30

### 🎉 New features

- Migrated Android codebase to use the new Expo modules API. ([#20232](https://github.com/expo/expo/pull/20232) by [@alanhughes](https://github.com/alanjhughes))
- Add support for [granular permissions](https://developer.android.com/about/versions/13/behavior-changes-13) on Android 13. ([#20907](https://github.com/expo/expo/pull/20907) by [@alanhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Renamed the module on iOS to match the name used on Android. ([#20283](https://github.com/expo/expo/pull/20283) by [@alanhughes](https://github.com/alanjhughes))
- Fixed an issue where passing the `sortBy` argument to `MediaLibrary.getAssetsAsync` would cause the method to throw an error. ([#21363](https://github.com/expo/expo/pull/21363) by [@alanhughes](https://github.com/alanjhughes))

## 15.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix promise rejection on M1 iOS Simulator due to `UTTypeCreatePreferredIdentifierForTag` not working as expected. ([#19669](https://github.com/expo/expo/pull/19669) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 14.2.0 — 2022-07-07

### 🐛 Bug fixes

- Use `PHAssetCollectionSubtypeAny` subtype to avoid Recently Deleted album to show up ([#17561](https://github.com/expo/expo/pull/17561) by [@chuganzy](https://github.com/chuganzy))
- Fix `MediaLibrary._exportAsset` crashing if `filename` is nil. ([#17999](https://github.com/expo/expo/pull/17999) by [@ken0nek](https://github.com/ken0nek))

## 14.1.0 — 2022-04-18

### 🐛 Bug fixes

- Don't ask for `ACCESS_MEDIA_LOCATION` permission if it's not present in `AndroidManifest.xml`. ([#16034](https://github.com/expo/expo/pull/16034) by [@barthap](https://github.com/barthap))
- [plugin] Fix prebuild is failing when the `withMediaLibrary` plugin is enabled on Android. ([#15169](https://github.com/expo/expo/pull/15169) by [@MorganV](https://github.com/MorganV))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 14.0.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 14.0.0 — 2021-12-03

### 💡 Others

- Rewritten Android module to Kotlin. ([#14562](https://github.com/expo/expo/pull/14562), [#14563](https://github.com/expo/expo/pull/14563), [#14564](https://github.com/expo/expo/pull/14564), [#14565](https://github.com/expo/expo/pull/14565), [#14566](https://github.com/expo/expo/pull/14566) by [@barthap](https://github.com/barthap))

## 13.0.1 — 2021-10-01

### 🐛 Bug fixes

- Fix permissions always returning denied on android api < 29. ([#14570](https://github.com/expo/expo/pull/14570) by [@kudo](https://github.com/kudo))
- Fix unhandled rejection when asset creation fails on Android. ([#14583](https://github.com/expo/expo/pull/14583) by [@barthap](https://github.com/barthap))

## 13.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Added `isAvailableAsync` method. ([#13418](https://github.com/expo/expo/pull/13418) by [@danielmark0116](https://github.com/danielmark0116))
- Add `usePermissions` hook from modules factory. ([#13862](https://github.com/expo/expo/pull/13862) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Restore location exif data getter for Android 10+ devices. ([#14413](https://github.com/expo/expo/pull/14413) by [@ajsmth](https://github.com/ajsmth))
- EXIF parsing failure no longer crashes the `getAssetsAsync` and `getAssetInfoAsync`, the promise returns `exif: null` instead. ([#14408](https://github.com/expo/expo/pull/14408) by [@barthap](https://github.com/barthap))
- Fixed `createAssetAsync` and `saveToLibraryAsync` on Android 11. ([#14518](https://github.com/expo/expo/pull/14518) by [@barthap](https://github.com/barthap))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13755](https://github.com/expo/expo/pull/13755) by [@tsapeta](https://github.com/tsapeta))
- Added `AlbumType` and `MediaSubtype` types, added missing `orientation` key to the `Asset` type. ([#13936](https://github.com/expo/expo/pull/13936) by [@Simek](https://github.com/Simek))
- Remove `assets-library://` uri scheme usage in favour of `ph://` ([#14173](https://github.com/expo/expo/pull/14173) by [@ajsmth](https://github.com/ajsmth))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 12.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-file-system-interface` and `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))

## 12.0.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 12.0.1 — 2021-03-31

_This version does not introduce any user-facing changes._

## 12.0.0 — 2021-03-10

### 🛠 Breaking changes

- Changed location of newly created albums on Android. From now, albums won't be saved in the root folder. ([#12017](https://github.com/expo/expo/pull/12017) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))
- In 'getAssetInfoAsync', respect the `shouldDownloadFromNetwork` option. ([#12086](https://github.com/expo/expo/pull/12086) by [@drtangible](https://github.com/drtangible))

## 11.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 10.0.0 — 2020-11-17

### 🛠 Breaking changes

- On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))
- Renamed `MediaLibrary.MediaLibraryAssetChangeEvent` type to `MediaLibrary.MediaLibraryAssetsChangeEvent`.

### 🎉 New features

- Added the `MediaLibrary.presentPermissionsPickerAsync` method that displays the system prompt allowing the user to change the selected permitted assets` on iOS.

## 9.2.1 — 2020-09-02

### 🐛 Bug fixes

- Fixed `RuntimeException: setDataSource failed: status = 0x80000000` caused by `MediaMetadataRetriever`. ([#9855](https://github.com/expo/expo/pull/9855) by [@lukmccall](https://github.com/lukmccall))
- Fixed `media-library` methods failing when not all permissions were granted on iOS 14. ([#10026](https://github.com/expo/expo/pull/10026) by [@lukmccall](https://github.com/lukmccall))

## 9.2.0 — 2020-08-18

### 🐛 Bug fixes

- Fixed handling albums without name on Android. ([#9787](https://github.com/expo/expo/pull/9787) by [@barthap](https://github.com/barthap))

## 9.1.0 — 2020-08-13

### 🎉 New features

- Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed `getAlbumsAsync()`, `getAlbum()` and media change listener crashing on Android 10. ([#9666](https://github.com/expo/expo/pull/9666) by [@barthap](https://github.com/barthap))

## 9.0.0 — 2020-08-11

### 🛠 Breaking changes

- Added external storage permissions declarations to `AndroidManifest.xml` on Android. ([#9231](https://github.com/expo/expo/pull/9231) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fixed validation for input arguments of `getAssetsAsync`. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))
- Fixed bug, where `getAssetsAsync` did not reject on error on Android. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))

## 8.5.0 — 2020-07-29

### 🎉 New features

- Added `options` to `getAssetInfoAsync()`, which allows specifying whether to download the asset from network in iOS. ([#9405](https://github.com/expo/expo/pull/9405) by [@jarvisluong](https://github.com/jarvisluong))
- Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed `getAssetsAsync` crashes when given invalid `after` value on Android. ([#9466](https://github.com/expo/expo/pull/9466) by [@barthap](https://github.com/barthap))

## 8.4.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed `getAssetsAsync()` and `getAssetInfoAsync()` location issues on Android Q. ([#9315](https://github.com/expo/expo/pull/9315) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-07-02

### 🐛 Bug fixes

- Handled the crash when calling `getAssetInfoAsync` on a slow motion video on iOS. ([#8802](https://github.com/expo/expo/pull/8802) by [@jarvisluong](https://github.com/jarvisluong))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Added missing image loader for `MediaLibrary` in bare workflow. ([#8304](https://github.com/expo/expo/pull/8304) by [@tsapeta](https://github.com/tsapeta))
- Fixed `MediaLibrary` not compiling with the `use_frameworks!` option in the bare React Native application. ([#7861](https://github.com/expo/expo/pull/7861) by [@Ashoat](https://github.com/Ashoat))
- Flip dimensions based on media rotation data on Android to match `<Image>` and `<Video>` as well as iOS behavior. ([#7980](https://github.com/expo/expo/pull/7980) by [@Ashoat](https://github.com/Ashoat))
