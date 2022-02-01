# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 10.1.1 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Added `AndroidManifest.xml` queries for intent handling. ([#13388](https://github.com/expo/expo/pull/13388) by [@EvanBacon](https://github.com/EvanBacon))
- `Contacts.presentFormAsync` now resolves when the native form closes. ([#13699](https://github.com/expo/expo/pull/13699) by [@dsokal](https://github.com/dsokal))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fixed Android intent XML parsing issues. ([#13401](https://github.com/expo/expo/pull/13401) by [@quicksnap](https://github.com/quicksnap))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Fix broken contacts tests (Android). ([#13076](https://github.com/expo/expo/pull/13076) by [@ajsmth](https://github.com/ajsmth))
- Switch to androidx.annotation.Nullable. ([#13133](https://github.com/expo/expo/pull/13133) by [@brentvatne](https://github.com/brentvatne))

### 💡 Others

- Migrated from `unimodules-file-system-interface` and `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Refactored uuid imports to v7 style. ([#13037](https://github.com/expo/expo/pull/13037) by [@giautm](https://github.com/giautm))

## 9.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 9.1.1 — 2021-03-31

_This version does not introduce any user-facing changes._

## 9.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 9.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 8.6.0 — 2020-09-14

### 🐛 Bug fixes

- `getContactsAsync` no longer requires an exact match when providing the `name` query on Android. ([#10127](https://github.com/expo/expo/pull/10127) by [@cruzach](https://github.com/cruzach))

## 8.5.0 — 2020-08-18

### 🎉 New features

- Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))

## 8.4.0 — 2020-08-11

### 🎉 New features

- Added `isAvailableAsync()` method for guarding against web usage. ([#9640](https://github.com/expo/expo/pull/9640) by [@EvanBacon](https://github.com/evanbacon))

### 🐛 Bug fixes

- Fixed bug, where sorting contacts by `firstName` or `lastName` could cause crash on Android. ([#9582](https://github.com/expo/expo/pull/9582) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed `getContactById` not resolving promise when contact with provided id doesn't exist on Android. ([#8976](https://github.com/expo/expo/pull/8976) by [@lukmccall](https://github.com/lukmccall))
- Fixed `addContactAsync` returning incorrect id on Android. ([#8980](https://github.com/expo/expo/pull/8980) by [@lukmccall](https://github.com/lukmccall))
- Fixed `updateContactAsync` creating a new contact on Android. ([#9031](https://github.com/expo/expo/pull/9031) by [@lukmccall](https://github.com/lukmccall))
- Fixed `updateContactAsync` not returning a contact id on iOS. ([#9031](https://github.com/expo/expo/pull/9031) by [@lukmccall](https://github.com/lukmccall))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fix `Contacts.presentFormAsync` pre-filling. ([#7285](https://github.com/expo/expo/pull/7285) by [@abdelilah](https://github.com/abdelilah) & [@lukmccall](https://github.com/lukmccall))
