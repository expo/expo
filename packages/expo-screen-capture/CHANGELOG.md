# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.4 — 2026-05-13

### 💡 Others

- Updated permission hooks and permission type imports to be imported from `expo` instead of `expo-modules-core` ([#45565](https://github.com/expo/expo/pull/45565) by [@Wenszel](https://github.com/Wenszel))

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

## 55.0.13 - 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.12 - 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.11 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.10 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.9 - 2026-03-17

_This version does not introduce any user-facing changes._

## 55.0.8 — 2026-02-25

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-08

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-27

### 💡 Others

- mark `removeScreenshotListener` call as deprecated ([#42098](https://github.com/expo/expo/pull/42098) by [@vonovak](https://github.com/vonovak))

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🐛 Bug fixes

- [iOS] Fix main thread violation warnings on app startup. ([#42204](https://github.com/expo/expo/pull/42204) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Remove warning about iOS screenshot limitations. ([#40115](https://github.com/expo/expo/pull/40115) by [@hryhoriiK97](https://github.com/hryhoriiK97))

## 8.0.9 - 2025-12-05

_This version does not introduce any user-facing changes._

## 8.0.8 — 2025-09-13

### 🐛 Bug fixes

- Prevent multiple blur views from being added during rapid app state changes. ([#39633](https://github.com/expo/expo/pull/39633) by [@hryhoriiK97](https://github.com/hryhoriiK97))

## 8.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 8.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 8.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 8.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 8.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 8.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 8.0.1 — 2025-08-15

### 🐛 Bug fixes

- [Android] Prevent hard crash when we cannot access the event emitter. ([#38869](https://github.com/expo/expo/pull/38869) by [@alanjhughes](https://github.com/alanjhughes))

## 8.0.0 — 2025-08-13

### 🎉 New features

- Implemented `useScreenshotListener` hook. ([#37411](https://github.com/expo/expo/pull/37411) by [@hryhoriiK97](https://github.com/hryhoriiK97))
- Implemented screenshot prevention on iOS. ([#37874](https://github.com/expo/expo/pull/37874) by [@hryhoriiK97](https://github.com/hryhoriiK97))
- Implement App Switcher protection on iOS. ([#38192](https://github.com/expo/expo/pull/38192) by [@hryhoriiK97](https://github.com/hryhoriiK97))

### 🐛 Bug fixes

- [Android] Fix permissions on Android 13.
- [iOS] Fix issue with header flickering on screenshot prevention. ([#38384](https://github.com/expo/expo/pull/38384) by [@hryhoriiK97](https://github.com/hryhoriiK97))

### 💡 Others

- [iOS] Replaced deprecated keyWindow usage. ([#38207](https://github.com/expo/expo/pull/38207) by [@hryhoriiK97](https://github.com/hryhoriiK97))

## 7.1.5 - 2025-07-01

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 7.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 7.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 7.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 7.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 7.1.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- Standardize platform key ordering in `expo-module.config.json`. ([#35003](https://github.com/expo/expo/pull/35003) by [@reichhartd](https://github.com/reichhartd))

## 7.0.1 - 2025-01-10

_This version does not introduce any user-facing changes._

## 7.0.0 — 2024-10-22

### 🛠 Breaking changes

- Make permissions auto-grant on Android 14+. ([#31865](https://github.com/expo/expo/pull/31865) by [@aleqsio](https://github.com/aleqsio))
- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [Android] Fix `ScreenCaptureModule` was crashing in the dev-client when going back to the home screen. ([#29694](https://github.com/expo/expo/pull/29694) by [@lukmccall](https://github.com/lukmccall))
- Add missing `react` peer dependencies for isolated modules. ([#30480](https://github.com/expo/expo/pull/30480) by [@byCedric](https://github.com/byCedric))
- [Android] Fix Screen capture callback was not called on Android 14 when API methods was not being called. ([#31702](https://github.com/expo/expo/pull/31702) by [@chrfalch](https://github.com/chrfalch))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Updated hook from `useScreenCapturePermissions` to `usePermissions` in the example. ([#30076](https://github.com/expo/expo/pull/30076) by [@mrakesh0608](https://github.com/mrakesh0608))
- Standardized Babel configuration to use `expo-module-scripts`. ([#31915](https://github.com/expo/expo/pull/31915) by [@reichhartd](https://github.com/reichhartd))

## 6.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 6.0.0 — 2024-04-18

### 🐛 Bug fixes

- Reverse api level constraint on the `DETECT_SCREEN_CAPTURE` permission. ([#27148](https://github.com/expo/expo/pull/27148) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Fixes memory leaks caused by the event emitter. ([#28161](https://github.com/expo/expo/pull/28161) by [@lukmccall](https://github.com/lukmccall))
- [Android] Fix accessing activity too early on bridgeless. ([#28244](https://github.com/expo/expo/pull/28244) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Native module on iOS is now written in Swift using the Sweet API. ([#26103](https://github.com/expo/expo/pull/26103) by [@fobos531](https://github.com/fobos531))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))
- Replaced `@testing-library/react-hooks` with `@testing-library/react-native`. ([#30742](https://github.com/expo/expo/pull/30742) by [@byCedric](https://github.com/byCedric))

## 5.8.1 - 2024-01-23

### 🐛 Bug fixes

- Fix screenshot listener not being called on Android 34. ([#26549](https://github.com/expo/expo/pull/26549) by [@alanjhughes](https://github.com/alanjhughes))

## 5.8.0 — 2023-12-15

### 🎉 New features

- Added `getPermissionsAsync` and `requestPermissionsAsync` methods. ([#25849](https://github.com/expo/expo/pull/25849) by [@behenate](https://github.com/behenate))

## 5.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 5.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 5.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 5.4.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 5.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 5.2.0 — 2023-05-08

### 🎉 New features

- On Android, migrated to Expo Modules API. ([#22208](https://github.com/expo/expo/pull/22208) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 5.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 5.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 5.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 4.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 4.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 4.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 4.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Export missing `Subscription` type. ([#13352](https://github.com/expo/expo/pull/13352) by [@Simek](https://github.com/Simek))

## 3.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Added `isAvailableAsync` method. ([#12121](https://github.com/expo/expo/pull/12121) by [@bycedric](https://github.com/bycedric))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.0.0 — 2020-11-17

### 🛠 Breaking changes

- Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))

## 1.1.1 — 2020-08-20

_This version does not introduce any user-facing changes._

## 1.1.0 — 2020-08-18

### 🎉 New features

- Added `addScreenshotListener` and `removeScreenshotListener` methods so you can take action in your app whenever a user takes a screenshot. ([#9747](https://github.com/expo/expo/pull/9747) by [@cruzach](https://github.com/cruzach))

## 1.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.0.0 — 2020-05-27

### 🎉 New features

- Initial release of `expo-screen-capture` module with support for preventing screen capture on iOS and Android ([#8326](https://github.com/expo/expo/pull/8326) by [@cruzach](https://github.com/cruzach))
