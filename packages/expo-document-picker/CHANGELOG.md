# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 14.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 14.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 14.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 14.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 14.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 14.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 14.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 14.0.0 — 2025-08-13

### 🛠 Breaking changes

- [Web] getDocumentAsync() no longer returns base64 by default. The uri on web now always points to a Blob created via URL.createObjectURL(), which can be used for previews or appended to FormData for uploads. Selecting large files on web is now almost instant, since there’s no base64 conversion by default. If you still need base64, you can pass base64: true in the options. A new base64 field will then be included in the result. ([#37443](https://github.com/expo/expo/pull/37443) by [@hirbod](https://github.com/hirbod))

### 🎉 New features

- [iOS][Android] add lastModified for iOS and Android to align with web ([#37429](https://github.com/expo/expo/pull/37429) by [@hirbod](https://github.com/hirbod))

### 💡 Others

- remove use of `IOUtils` for stream copying ([#38096](https://github.com/expo/expo/pull/38096) by [@vonovak](https://github.com/vonovak))

## 13.1.6 - 2025-06-18

### 🐛 Bug fixes

- [Android] avoid hard crash in case of an exception ([#37110](https://github.com/expo/expo/pull/37110) by [@vonovak](https://github.com/vonovak))

## 13.1.5 — 2025-04-30

_This version does not introduce any user-facing changes._

## 13.1.4 — 2025-04-25

_This version does not introduce any user-facing changes._

## 13.1.3 — 2025-04-21

### 🐛 Bug fixes

- [Android] Avoid int overflow for large files ([#36245](https://github.com/expo/expo/pull/36245) by [@vonovak](https://github.com/vonovak))

## 13.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 13.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 13.1.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [web] Add option to disable file reader to read base64 from file on successfull picking. ([#34739](https://github.com/expo/expo/pull/34739) by [@danilaplee](https://github.com/danilaplee))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))
- [Android] Specified Gradle project version. ([#35751](https://github.com/expo/expo/pull/35751) by [@lukmccall](https://github.com/lukmccall))

## 13.0.3 - 2025-02-07

### 🎉 New features

- [iOS] Allow setting of the `com.apple.developer.ubiquity-kvstore-identifier` entitlement directly. ([#34338](https://github.com/expo/expo/pull/34338) by [@keith-kurak](https://github.com/keith-kurak))

## 13.0.2 - 2025-01-10

_This version does not introduce any user-facing changes._

## 13.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

## 12.0.2 - 2024-06-13

### 🐛 Bug fixes

- [iOS] Fix `video/*` MIME Type not allowing to select videos with audio. ([#29673](https://github.com/expo/expo/pull/29673) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 12.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 12.0.0 — 2024-04-18

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 11.10.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 11.10.0 — 2023-12-12

_This version does not introduce any user-facing changes._

## 11.9.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Added default mimetype (`application/octet-stream`) to avoid quiet failure when mimetype is null on iOS ([#24764](https://github.com/expo/expo/pull/24764) by [@OzymandiasTheGreat](https://github.com/OzymandiasTheGreat))

## 11.8.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [web] Fix promise never resolving when user cancels the picker. ([#24838](https://github.com/expo/expo/pull/24838) by [@behenate](https://github.com/behenate))

## 11.7.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 11.6.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 11.6.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 11.5.4 - 2023-07-19

### 🐛 Bug fixes

- Fix `type` on `DocumentPickerOptions` on iOS. ([#23497](https://github.com/expo/expo/pull/23497) by [@aleqsio](https://github.com/aleqsio))

## 11.5.3 - 2023-07-10

### 💡 Others

- Remove deprecated fields and warning on `getDocumentAsync`. ([#23135](https://github.com/expo/expo/pull/23135) by [@alanjhughes](https://github.com/alanjhughes))

## 11.5.2 — 2023-06-28

_This version does not introduce any user-facing changes._

## 11.5.1 — 2023-06-27

_This version does not introduce any user-facing changes._

## 11.5.0 — 2023-06-21

### 🐛 Bug fixes

- Fix `copyToCacheDirectory` on iOS. ([#23102](https://github.com/expo/expo/pull/23102) by [@aleqsio](https://github.com/aleqsio))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 11.4.0 — 2023-05-08

### 🐛 Bug fixes

- Export all types from the module. ([#22172](https://github.com/expo/expo/pull/22172) by [@alanjhughes](https://github.com/alanjhughes))

## 11.3.0 — 2023-04-14

### 🎉 New features

- Migrated to Expo Modules API. ([#20336](https://github.com/expo/expo/pull/20336) by [@alanhughes](https://github.com/alanjhughes))
- Added support for picking multiple documents. ([#20365](https://github.com/expo/expo/pull/20365) by [@alanhughes](https://github.com/alanjhughes))

## 11.2.2 - 2023-03-28

### 🐛 Bug fixes

- Fixed cancellation type not being marked as a `Record` on Android. ([#21588](https://github.com/expo/expo/pull/21588) by [@alanjhughes](https://github.com/alanjhughes))

## 11.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 11.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 11.1.0 — 2022-12-30

### 🎉 New features

- Migrated to Expo Modules API. ([#20336](https://github.com/expo/expo/pull/20336) by [@alanhughes](https://github.com/alanjhughes))

### 💡 Others

- Avoid dependency on `uuid`. ([#20477](https://github.com/expo/expo/pull/20477) by [@LinusU](https://github.com/LinusU))

## 11.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 11.0.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 10.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 10.2.1 — 2022-04-25

### 💡 Others

- [plugin] Update to use codesigning variables in entitlements. ([#17158](https://github.com/expo/expo/pull/17158) by [@EvanBacon](https://github.com/EvanBacon))

## 10.2.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.1.3 - 2022-02-09

_This version does not introduce any user-facing changes._

## 10.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))
- Handle nil MIME type. ([#16156](https://github.com/expo/expo/pull/16156) by [@brentvatne](https://github.com/brentvatne))
- Fix incorrectly allowing multiple document selection ([#20363](https://github.com/expo/expo/pull/20363)) by [@alanhughes](https://github.com/alanjhughes)

## 10.1.1 - 2022-01-26

### 🐛 Bug fixes

- Pass iCloudContainerEnvironment to plugin. ([#15774](https://github.com/expo/expo/pull/15774) by [@wkozyra95](https://github.com/wkozyra95))

## 10.1.0 — 2021-12-03

### 🎉 New features

- [plugin] Added `iCloudContainerEnvironment` prop for setting the `com.apple.developer.icloud-container-environment` entitlement ([#14885](https://github.com/expo/expo/pull/14885) by [@EvanBacon](https://github.com/EvanBacon))

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Added `AndroidManifest.xml` queries for intent handling. ([#13388](https://github.com/expo/expo/pull/13388) by [@EvanBacon](https://github.com/EvanBacon))
- Added possibility to pass mimetypes array in order to set multiple mimetypes, fix bug with default mimetype. ([#13751](https://github.com/expo/expo/pull/13751) by [@mstach60161](https://github.com/mstach60161))
- Added mimetype to getDocumentAsync result. ([#13702](https://github.com/expo/expo/pull/13702) by [@mstach60161](https://github.com/mstach60161))
- Fixed file uri. ([#13678](https://github.com/expo/expo/pull/13678) by [@mstach60161](https://github.com/mstach60161))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Refactored uuid imports to v7 style. ([#13037](https://github.com/expo/expo/pull/13037) by [@giautm](https://github.com/giautm))

## 9.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 9.1.1 — 2021-04-09

### 🐛 Bug fixes

- Added SSR guard. ([#12420](https://github.com/expo/expo/pull/12420) by [@EvanBacon](https://github.com/EvanBacon))

## 9.1.0 — 2021-03-10

### 🎉 New features

- Created config plugin. ([#11977](https://github.com/expo/expo/pull/11977) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 9.0.1 — 2021-01-15

_This version does not introduce any user-facing changes._

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.4.1 — 2020-10-02

### 🐛 Bug fixes

- Fixed `UIDocumentPickerViewController` being `nil` on iOS 14 and thus causing the hard-crash of the application. ([#10327](https://github.com/expo/expo/pull/10327) by [@bbarthec](https://github.com/bbarthec))
- Fixed `Promise` not being fulfilled if the document picker view controller was being dismissed by gesture on iOS. ([#10325](https://github.com/expo/expo/pull/10325) by [@sjchmiela](https://github.com/sjchmiela))

## 8.4.0 — 2020-08-18

### 🐛 Bug fixes

- Fixed iOS bug, where it could be impossible to select only videos. ([#9720](https://github.com/expo/expo/pull/9720) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed `getDocumentAsync` crashing when picking a folder on iOS. ([#8930](https://github.com/expo/expo/pull/8930) by [@lukmccall](https://github.com/lukmccall))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
