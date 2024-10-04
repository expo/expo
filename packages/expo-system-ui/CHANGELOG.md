# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 2.4.0 — 2023-06-21

### 🎉 New features

- Persist user selected background color and restore automatically on iOS. Added `restoreBackgroundColorAsync` to restore it on Android. ([#22773](https://github.com/expo/expo/pull/22773) by [@alanhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 2.3.0 — 2023-05-08

### 💡 Others

- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 2.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 2.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 2.1.0 — 2022-12-30

### 🎉 New features

- Migrated Android codebase to use the new Expo modules API. ([#20221](https://github.com/expo/expo/pull/20221) by [@alanhughes](https://github.com/alanjhughes))

## 2.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 2.0.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 1.3.0 — 2022-07-07

### 🐛 Bug fixes

- Fix color setting on web. ([#17558](https://github.com/expo/expo/pull/17558) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 1.2.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 1.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 1.1.0 — 2021-12-03

### 🛠 Breaking changes

- Change iOS to set the background color of the first view controller in the hierarchy instead of the current active view controller. ([#15146](https://github.com/expo/expo/pull/15146) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- iOS now sets the background color of the base window to support native-stack modals. ([#15146](https://github.com/expo/expo/pull/15146) by [@EvanBacon](https://github.com/EvanBacon))
- Initial background color on iOS will now be set inside the module instead of in the template. ([#15146](https://github.com/expo/expo/pull/15146) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix `getBackgroundColorAsync` return type. ([#15127](https://github.com/expo/expo/pull/15127) by [@EvanBacon](https://github.com/EvanBacon))
