# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
