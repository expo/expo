# Changelog

## Unpublished

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Expose a typed config plugin function ([#44098](https://github.com/expo/expo/pull/44098) by [@zoontek](https://github.com/zoontek))

### 🐛 Bug fixes

### 💡 Others

## 55.0.8 — 2026-02-25

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-08

### 🐛 Bug fixes

- [iOS] [New Architecture] Restore orientationMask after app transition from background to foreground ([#42536](https://github.com/expo/expo/pull/42536) by [@LongyuW](https://github.com/LongyuW))

## 55.0.4 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-27

### 💡 Others

- mark `removeOrientationChangeListeners` and `removeOrientationChangeListener` calls as deprecated ([#42098](https://github.com/expo/expo/pull/42098) by [@vonovak](https://github.com/vonovak))

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🐛 Bug fixes

- [web] fix undeclared `listener` reference ([#41441](https://github.com/expo/expo/pull/41441) by [@vonovak](https://github.com/vonovak))
- [iOS] Remove use of deprecated API `UIApplication.shared.windows`. ([#40881](https://github.com/expo/expo/pull/40881) by [@bwallberg](https://github.com/bwallberg))

## 9.0.8 - 2025-12-05

_This version does not introduce any user-facing changes._

## 9.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 9.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 9.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 9.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 9.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 9.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 9.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 9.0.0 — 2025-08-13

_This version does not introduce any user-facing changes._

## 8.1.7 - 2025-06-04

### 🐛 Bug fixes

- [iOS] Call `createRootViewController` from the `ExpoReactNativeFactoryDelegate`. ([#36787](https://github.com/expo/expo/pull/36787) by [@alanjhughes](https://github.com/alanjhughes))

## 8.1.6 — 2025-05-06

### 🐛 Bug fixes

- [iOS] Fix the app becoming unresponsive when the orientation listener is used in `Split View` on iPad. ([#36667](https://github.com/expo/expo/pull/36667) by [@alanjhughes](https://github.com/alanjhughes))

## 8.1.5 — 2025-04-30

_This version does not introduce any user-facing changes._

## 8.1.4 — 2025-04-25

_This version does not introduce any user-facing changes._

## 8.1.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 8.1.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 8.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 8.1.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- Standardize platform key ordering in `expo-module.config.json`. ([#35003](https://github.com/expo/expo/pull/35003) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate)), ([#35428](https://github.com/expo/expo/pull/35428) by [@behenate](https://github.com/behenate))

## 8.0.4 - 2025-01-10

_This version does not introduce any user-facing changes._

## 8.0.3 - 2025-01-08

### 🐛 Bug fixes

- [iOS] Fixed ScreenOrientation.addOrientationChangeListener() Freezes iOS Devices in Expo SDK 52, issue 33853 ([#33867](https://github.com/expo/expo/pull/33867) by [@pjdemers](https://github.com/pjdemers)

## 8.0.2 - 2024-12-19

### 🐛 Bug fixes

- [iOS] Fixed crash when multiple threads access same member in swift ([#33572](https://github.com/expo/expo/pull/33572) by [@chrfalch](https://github.com/chrfalch))

## 8.0.1 - 2024-12-05

### 🐛 Bug fixes

- Fixed event listeners on web. ([#33361](https://github.com/expo/expo/pull/33361) by [@aleqsio](https://github.com/aleqsio))

## 8.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Add missing `react-native` peer dependencies for isolated modules. ([#30481](https://github.com/expo/expo/pull/30481) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Removed all `NativeModulesProxy` occurrences. ([#31496](https://github.com/expo/expo/pull/31496) by [@reichhartd](https://github.com/reichhartd))

## 7.0.5 — 2024-05-14

### 🐛 Bug fixes

- [Android] Fixed screen orientation change listener not firing. ([#28832](https://github.com/expo/expo/pull/28832) by [@lukmccall](https://github.com/lukmccall))

## 7.0.4 — 2024-05-09

### 🐛 Bug fixes

- Fix bug with weak var type causing dropped events. ([#28677](https://github.com/expo/expo/pull/28677) by [@aleqsio](https://github.com/aleqsio))

## 7.0.3 — 2024-05-01

_This version does not introduce any user-facing changes._

## 7.0.2 — 2024-04-25

### 🐛 Bug fixes

- Fix reversed `SizeClassIOS` enum values. ([#28448](https://github.com/expo/expo/pull/28448) by [@Simek](https://github.com/Simek))

## 7.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 7.0.0 — 2024-04-18

### 💡 Others

- Drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 6.4.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 6.4.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- On `Android`, add event to module definition to prevent `new NativeEventEmitter()` warning. ([#24943](https://github.com/expo/expo/pull/24943) by [@alanjhughes](https://github.com/alanjhughes))

## 6.0.6 — 2023-10-20

### 🐛 Bug fixes

- On `Android`, add event to module definition to prevent `new NativeEventEmitter()` warning. ([#24943](https://github.com/expo/expo/pull/24943) by [@alanjhughes](https://github.com/alanjhughes))

## 6.3.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 6.2.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 6.1.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 6.1.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 6.0.5 — 2023-07-25

### 🐛 Bug fixes

- Fix addOrientationChangeListener not working on iPadOS. ([#23656](https://github.com/expo/expo/pull/23656) by [@behenate](https://github.com/behenate))

## 6.0.4 — 2023-07-23

### 🐛 Bug fixes

- [iOS] Fix event emitter sending events with no registered listeners. ([#23462](https://github.com/expo/expo/pull/23462) by [@behenate](https://github.com/behenate))
- [iOS] Fix config plugin deleting the orientations key from `Info.plist` when the initial orientation value is set to `DEFAULT`. ([#23637](https://github.com/expo/expo/pull/23637) by [@behenate](https://github.com/behenate))

## 6.0.3 — 2023-07-12

### 🐛 Bug fixes

- [iOS] When config plugin is not configured the initial orientation is now based on values in `Info.plist` instead of being set to portrait. ([#23456](https://github.com/expo/expo/pull/23456) by [@behenate](https://github.com/behenate))

## 6.0.2 — 2023-07-04

### 💡 Others

- [iOS] Refactor the singleton class to work properly in versioned code in Expo Go. ([#23228](https://github.com/expo/expo/pull/23228) by [@tsapeta](https://github.com/tsapeta))

## 6.0.1 — 2023-06-23

### 🐛 Bug fixes

- [iOS] Fix crash when reading `rootViewController` value. ([#23039](https://github.com/expo/expo/pull/23039) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 6.0.0 — 2023-06-21

_This version does not introduce any user-facing changes._

## 6.0.0-beta.1 — 2023-06-13

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))
- [iOS] Fixed screen orientation on iOS 16. ([#22152](https://github.com/expo/expo/pull/22152) by [@behenate](https://github.com/behenate))
- [iOS] Fixed status bar and navigation bar following the device's orientation regardless of applied orientation lock. ([#22152](https://github.com/expo/expo/pull/22152) by [@behenate](https://github.com/behenate))
- [iOS] Fixed SafeAreaViews failing after pulling down quick settings when the device is in a different orientation than the current orientation lock allows. ([#22152](https://github.com/expo/expo/pull/22152) by [@behenate](https://github.com/behenate))

### 💡 Others

- [iOS] Migrated to new modules API. ([#22152](https://github.com/expo/expo/pull/22152) by [@behenate](https://github.com/behenate))

## 5.2.0 — 2023-05-08

### 🎉 New features

- Migrated to new modules API on Android ([#22019](https://github.com/expo/expo/pull/22019) by [@behenate](https://github.com/behenate))

## 5.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 5.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 5.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 5.0.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 4.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 4.2.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 4.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 4.1.1 — 2021-12-08

_This version does not introduce any user-facing changes._

## 4.1.0 — 2021-12-03

### 💡 Others

- [plugin] Added SDK 43 tests for new AppDelegate template ([#14763](https://github.com/expo/expo/pull/14763) by [@EvanBacon](https://github.com/EvanBacon))
- The app delegate subscriber on iOS has been separated from the singleton module to hook into the new implementation of `ExpoAppDelegate`. ([#14867](https://github.com/expo/expo/pull/14867) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- Extra setup on iOS bare projects is not necessary from the support of `ExpoReactDelegateHandler`. ([#15140](https://github.com/expo/expo/pull/15140) by [@kudo](https://github.com/kudo))

## 4.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fixed an issue with building on Xcode 13. ([#13898](https://github.com/expo/expo/pull/13898) by [@cruzach](https://github.com/cruzach))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))
- Fixed integration with the `react-native-screens` orientation prop. ([#14541](https://github.com/expo/expo/pull/14541) by [@lukmccall](https://github.com/lukmccall))
- Fixed orientation lock not working in bare workflow on iOS. ([#14543](https://github.com/expo/expo/pull/14543) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Export missing `Subscription` type. ([#14150](https://github.com/expo/expo/pull/14150) by [@Simek](https://github.com/Simek))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 3.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Removed `fbjs`dependency ([#11398](https://github.com/expo/expo/pull/11398) by [@cruzach](https://github.com/cruzach))

## 2.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.0.0 — 2020-08-11

### 🛠 Breaking changes

- Now the module will keep the lock active when the app backgrounds. ([#8727](https://github.com/expo/expo/pull/8727) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fix `ScreenOrientation.getOrientationAsync` returning a wrong value when the application is starting. ([#8727](https://github.com/expo/expo/pull/8727) by [@lukmccall](https://github.com/lukmccall))

## 1.1.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.1.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `ScreenOrientation.addOrientationChangeListener` payload to match docs. ([#7774](https://github.com/expo/expo/pull/7774) by [@awinograd](https://github.com/awinograd))
- Fixed `ScreenOrientation.lockAsync` to properly convert to web platform equivalent of chosen lock. ([#7774](https://github.com/expo/expo/pull/7774) by [@awinograd](https://github.com/awinograd))
