# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 18.2.0 — 2025-09-16

### 🎉 New features

- [next] Add Query ([#39559](https://github.com/expo/expo/pull/39559) by [@Wenszel](https://github.com/Wenszel))

## 18.1.1 — 2025-09-10

### 💡 Others

- Extracted the read permission check from `FileSystemUtilities` ([#39210](https://github.com/expo/expo/pull/39210) by [@kosmydel](https://github.com/kosmydel))

## 18.1.0 — 2025-09-08

### 🎉 New features

- Add MediaLibrary@Next. ([#38835](https://github.com/expo/expo/pull/38835) by [@Wenszel](https://github.com/wenszel))

## 18.0.6 — 2025-09-02

### 💡 Others

- Change Constants to Constant/Property. ([#38926](https://github.com/expo/expo/pull/38926) by [@jakex7](https://github.com/jakex7))

## 18.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 18.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 18.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 18.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 18.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 18.0.0 — 2025-08-13

### 🛠 Breaking changes

- [Android] Fix `getAssetsAsync` loading performance, add `resolveWithFullInfo` option to control whether to load full EXIF data for images. This is a breaking change for Android apps, as it might break the orientation of images in some cases. ([#37957](https://github.com/expo/expo/pull/37957) by [@kosmydel](https://github.com/kosmydel)).

### 🎉 New features

- [iOS] Add support for filtering assets by media subtype. by [@clarkg](https://github.com/clarkg) ([#36756](https://github.com/expo/expo/pull/36756) by [@clarkg](https://github.com/clarkg))

### 🐛 Bug fixes

- [iOS] Fix tvOS compilation errors. ([#38085](https://github.com/expo/expo/pull/38085) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- [Android] Migrate to coroutines. ([#38193](https://github.com/expo/expo/pull/38193) by [@Wenszel](http://github.com/wenszel))

## 17.1.7 - 2025-06-04

### 🐛 Bug fixes

- [Android] Fix `deleteAssetsAsync` not working on android 11 or above ([#33211](https://github.com/expo/expo/pull/33211) by [@Zeeshan404](https://github.com/Zeeshan404))

## 17.1.6 — 2025-04-30

_This version does not introduce any user-facing changes._

## 17.1.5 — 2025-04-30

_This version does not introduce any user-facing changes._

## 17.1.4 — 2025-04-25

### 🐛 Bug fixes

- Fixed `medialibraryassetschangeevent` listener not capturing assets changes. ([#36459](https://github.com/expo/expo/pull/36459) by [@aleqsio](https://github.com/aleqsio))
- Fixed build error from **AppDelegate.swift** integration. ([#36368](https://github.com/expo/expo/pull/36368) by [@kudo](https://github.com/kudo))

## 17.1.3 — 2025-04-21

_This version does not introduce any user-facing changes._

## 17.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 17.1.1 — 2025-04-09

### 💡 Others

- [Android] Add `granularPermissions` option to config plugin. ([#36142](https://github.com/expo/expo/pull/36142) by [@bang9](https://github.com/bang9))

## 17.1.0 — 2025-04-04

### 🎉 New features

- [iOS] Adding `pairedVideoAsset` for Live Photo support. ([#33274](https://github.com/expo/expo/pull/33274) by [@entiendoNull](https://github.com/entiendoNull))
- Add `album` parameter to `createAssetAsync`. ([#35686](https://github.com/expo/expo/pull/35686) by [@behenate](https://github.com/behenate))
- Add `initialAssetLocalUri` to `createAlbumAsync`. ([#35692](https://github.com/expo/expo/pull/35692) by [@behenate](https://github.com/behenate))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate)), ([#35428](https://github.com/expo/expo/pull/35428) by [@behenate](https://github.com/behenate))
- [iOS] Add `preventAutomaticLimitedAccessAlert` option to config plugin. ([#35515](https://github.com/expo/expo/pull/35515) by [@fobos531](https://github.com/fobos531))

## 17.0.6 - 2025-02-14

### 💡 Others

- Add guards when using the module in expo go. ([#34738](https://github.com/expo/expo/pull/34738) by [@alanjhughes](https://github.com/alanjhughes))

## 17.0.5 - 2025-01-10

_This version does not introduce any user-facing changes._

## 17.0.4 - 2024-12-19

### 🐛 Bug fixes

- [iOS] Fix `unknown` file type being returned for video files. ([#33589](https://github.com/expo/expo/pull/33589) by [@behenate](https://github.com/behenate))

## 17.0.3 — 2024-11-22

### 🐛 Bug fixes

- [iOS] Add back image loader to handle `ph://` and `assets-library://` scheme for New Architecture. ([#30116](https://github.com/expo/expo/issues/30116)) by [@coolsoftwaretyler](https://github.com/coolsoftwaretyler) ([#33097](https://github.com/expo/expo/pull/33097) by [@coolsoftwaretyler](https://github.com/coolsoftwaretyler))

## 17.0.2 — 2024-11-05

### 🐛 Bug fixes

- [iOS] Fixes asset types not returned correctly. ([#32621](https://github.com/expo/expo/pull/32621) by [@aleqsio](https://github.com/aleqsio))

## 17.0.1 — 2024-11-04

_This version does not introduce any user-facing changes._

## 17.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840), [#30863](https://github.com/expo/expo/pull/30863) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] include more error information in native rejections ([#30504](https://github.com/expo/expo/pull/30504) by [@vonovak](https://github.com/vonovak))
- On `Android 14+`, when user gave only partial asset access, `presentPermissionsPickerAsync()` presents the permissions dialog to allow the user to change the selected assets. ([#29882](https://github.com/expo/expo/pull/29882) by [@vonovak](https://github.com/vonovak))

### 🐛 Bug fixes

- On `iOS`, getAssets crashed when result was is empty ([#29969](https://github.com/expo/expo/pull/29969) by [@vonovak](https://github.com/vonovak))
- On `Android`, throw an error when deleting an asset was unsuccessful. ([#29777](https://github.com/expo/expo/pull/29777) by [@mathieupost](https://github.com/mathieupost))
- Add missing `react-native` peer dependencies for isolated modules. ([#30476](https://github.com/expo/expo/pull/30476) by [@byCedric](https://github.com/byCedric))
- On `Android`, adding an asset to an album containing another album would throw an exception. ([#29777](https://github.com/expo/expo/pull/31027) by [@nafeij](https://github.com/Nafeij))
- [Android] Fix exceptions when moving or deleting video assets. ([#31424](https://github.com/expo/expo/pull/31424) by [@behenate](https://github.com/behenate))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))

## 16.0.4 - 2024-06-20

### 🐛 Bug fixes

- On `iOS`, add back image loader to handle `ph://` and `assets-library://` schemes. ([#29747](https://github.com/expo/expo/pull/29747) by [@alanjhughes](https://github.com/alanjhughes))

## 16.0.3 — 2024-04-23

_This version does not introduce any user-facing changes._

## 16.0.2 — 2024-04-22

### 🐛 Bug fixes

- [Android] Fixed promise resolved twice on denied permission. ([#28323](https://github.com/expo/expo/pull/28323) by [@mathieupost](https://github.com/mathieupost))

## 16.0.1 — 2024-04-19

_This version does not introduce any user-facing changes._

## 16.0.0 — 2024-04-18

### 🎉 New features

- [Android] Add support for allowing access permissions to only selected photos. ([#27749](https://github.com/expo/expo/pull/27749) by [@behenate](https://github.com/behenate))
- [Android] Add support for granular permissions. ([#27729](https://github.com/expo/expo/pull/27729) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [iOS] Fix crash when passing `default` as sorting key. ([#28328](https://github.com/expo/expo/pull/28328) by [@aleqsio](https://github.com/aleqsio))
- [Android] Fixed crash on denied permission to modify assets. ([#28212](https://github.com/expo/expo/pull/28212) by [@mathieupost](https://github.com/mathieupost))

### 💡 Others

- Prevent config plugin from writing permissions until prebuild. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))
- [iOS] Add privacy manifest describing required reason API usage. ([#27770](https://github.com/expo/expo/pull/27770) by [@aleqsio](https://github.com/aleqsio))
- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- [iOS] Migrate to expo modules. ([#25587](https://github.com/expo/expo/pull/25587) by [@alanjhughes](https://github.com/alanjhughes))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))
- The `ACCESS_MEDIA_LOCATION` Android permission should not pulled into by default and should be pulled through Config Plugins. ([#28230](https://github.com/expo/expo/pull/28230) by [@kudo](https://github.com/kudo))

## 15.9.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 15.9.0 — 2023-12-12

### 🐛 Bug fixes

- On iOS, fix iOS 14 limited library picker presentation, using `presentPermissionsPickerAsync`, on nested views and `reject` Promise if state is not `limited`. ([#25521](https://github.com/expo/expo/pull/25521) by [@exodusanto](https://github.com/exodusanto))
- Fix promises being resolved twice on Android. ([#25763](https://github.com/expo/expo/pull/25763) by [@lukmccall](https://github.com/lukmccall))

## 15.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 15.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 15.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 15.5.1 — 2023-08-02

### 🐛 Bug fixes

- On iOS, fix issue where the wrong requester class was used if the user had requested `writeOnly` permissions. ([#23780](https://github.com/expo/expo/pull/23780) by [@alanjhughes](https://github.com/alanjhughes))

## 15.5.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 15.4.1 - 2023-07-23

### 🐛 Bug fixes

- Fix `albumNeedsMigrationAsync` crashing if called with invalid `albumId` on Android. ([#23516](https://github.com/expo/expo/pull/23516) by [@lukmccall](https://github.com/lukmccall))
- Fix `the bind value at index 1 is null` exception thrown by `ExpoMediaLibrary.migrateAlbumIfNeededAsync` on Android. ([#23515](https://github.com/expo/expo/pull/23515) by [@lukmccall](https://github.com/lukmccall))

## 15.4.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `robolectric` to `4.10`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed missing permissions error on Android when the user only requests write permissions ([#22457](https://github.com/expo/expo/pull/22457) by [@alanjhughes](https://github.com/alanjhughes))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 15.3.0 — 2023-05-08

### 🐛 Bug fixes

- Fix saving animated GIFs on iOS. ([#21549](https://github.com/expo/expo/pull/21549) by [@desi-ivanov](https://github.com/desi-ivanov))

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
