# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 55.0.13 — 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.12 — 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.11 — 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.10 — 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.9 — 2026-03-17

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

### 🐛 Bug fixes

- [android] fix: convert BCP-47 locales to Android resource qualifiers ([#40901](https://github.com/expo/expo/pull/40901) by [@kosmydel](https://github.com/kosmydel))

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🛠 Breaking changes

- [Android] Default allowDynamicLocaleChangesAndroid to true when supportedLocales is configured ([#41813](https://github.com/expo/expo/pull/41813) by [@Ubax](https://github.com/Ubax))

### 🐛 Bug fixes

- Correct types for getCalendars and getLocales ([#39703](https://github.com/expo/expo/pull/39703) by [@kadikraman](https://github.com/kadikraman))

### 💡 Others

- mark `removeSubscription` calls as deprecated ([#42098](https://github.com/expo/expo/pull/42098) by [@vonovak](https://github.com/vonovak))
- [Web] Add `getTextInfo()` fallback for deprecated `textInfo` in `getLocales()` ([#39255](https://github.com/expo/expo/pull/39255) by [@desii101](https://github.com/desii101))

## 17.0.8 - 2025-12-05

_This version does not introduce any user-facing changes._

## 17.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 17.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 17.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 17.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 17.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 17.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 17.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 17.0.0 — 2025-08-13

### 🎉 New features

- Add `supportedLocales` option to set app language from settings ([#37232](https://github.com/expo/expo/pull/37232) by [@alextoudic](https://github.com/alextoudic))

## 16.1.6 - 2025-07-01

_This version does not introduce any user-facing changes._

## 16.1.5 — 2025-04-30

_This version does not introduce any user-facing changes._

## 16.1.4 — 2025-04-30

### 🐛 Bug fixes

- [iOS] Fix issue where `useLocales` and `useCalendars` hooks would not re-render when the timezone changed. ([#36382](https://github.com/expo/expo/pull/36382) by [@ouwargui](https://github.com/ouwargui))

## 16.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 16.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 16.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 16.1.0 — 2025-04-04

### 🎉 New features

- Add languageScriptCode ([#34984](https://github.com/expo/expo/pull/34984) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Fix expo-localization typo ([#35543](https://github.com/expo/expo/pull/35543) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35428](https://github.com/expo/expo/pull/35428) by [@behenate](https://github.com/behenate))

## 16.0.1 - 2025-01-10

_This version does not introduce any user-facing changes._

## 16.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix invalid `regionCode` response on iOS. ([#32081](https://github.com/expo/expo/pull/32081) by [@aleqsio](https://github.com/aleqsio))
- Add missing `react` peer dependencies for isolated modules. ([#30474](https://github.com/expo/expo/pull/30474) by [@byCedric](https://github.com/byCedric))
- Only import from `expo/config` to follow proper dependency chains. ([#30501](https://github.com/expo/expo/pull/30501) by [@byCedric](https://github.com/byCedric))
- Only import from `expo/config-plugins` to follow proper dependency chains. ([#30499](https://github.com/expo/expo/pull/30499) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))

## 15.0.3 — 2024-05-06

### 🎉 New features

- Added a `forcesRTL` manifest flag for forcing RTL to be on. ([#28129](https://github.com/expo/expo/pull/28129) by [@aleqsio](https://github.com/aleqsio))

## 15.0.2 — 2024-05-01

_This version does not introduce any user-facing changes._

## 15.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 15.0.0 — 2024-04-18

### 🐛 Bug fixes

- [iOS] Add privacy manifest describing required reason API usage. ([#27770](https://github.com/expo/expo/pull/27770) by [@aleqsio](https://github.com/aleqsio))
- [Android] Fix es-419 locale returning empty list. ([#27250](https://github.com/expo/expo/pull/27250) by [@aleqsio](https://github.com/aleqsio))
- [Web] Gracefully handle unsupported language tags. ([#27403](https://github.com/expo/expo/pull/27403) by [@mary-ext](https://github.com/mary-ext))

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 14.8.3 - 2024-01-18

_This version does not introduce any user-facing changes._

## 14.8.2 - 2024-01-10

_This version does not introduce any user-facing changes._

## 14.8.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 14.8.0 — 2023-12-12

_This version does not introduce any user-facing changes._

## 14.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- [iOS] Fix expo-localization tvOS compile, add CI. ([#25082](https://github.com/expo/expo/pull/25082) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- [iOS] Use newer, non-deprecated platform APIs in `getLocales()`. ([#24884](https://github.com/expo/expo/pull/24884) by [@aleqsio](https://github.com/aleqsio))

### ⚠️ Notices

- Deprecated `locale` constant. ([#25078](https://github.com/expo/expo/pull/25078) by [@aleqsio](https://github.com/aleqsio))

## 14.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [iOS] fix tvOS compilation. ([#24845](https://github.com/expo/expo/pull/24845) by [@douglowder](https://github.com/douglowder))

## 14.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))
- Added a `temperatureUnit` field, which contains the default temperature unit for the locale. ([#24059](https://github.com/expo/expo/pull/24059) by [@behenate](https://github.com/behenate))

### 💡 Others

- Change documentation to refer to a correct replacement method in a deprecated field. ([#23811](https://github.com/expo/expo/pull/23811) by [@aleqsio](https://github.com/aleqsio))

## 14.4.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 14.3.0 — 2023-06-21

### 🎉 New features

- Changing locale on Android no longer reloads the app if the `expo-localization` config plugin is added to app.json. ([#22763](https://github.com/expo/expo/pull/22763) by [@aleqsio](https://github.com/aleqsio))
- Added hooks to get current locale and calendar. ([#22763](https://github.com/expo/expo/pull/22763) by [@aleqsio](https://github.com/aleqsio))
- Measurement system now returns `uk` and `us` values on iOS 16 and higher. ([#22763](https://github.com/expo/expo/pull/22763) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- User settings for delimiters and other locale preferences now override default locale settings for each locale in the list. ([#22763](https://github.com/expo/expo/pull/22763) by [@aleqsio](https://github.com/aleqsio))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 14.2.0 — 2023-05-08

### 🐛 Bug fixes

- Fixed invalid timezone returned for `getCalendars` on Web. ([#22003](https://github.com/expo/expo/pull/22003) by [@aleqsio](https://github.com/aleqsio))
- Fixed errors thrown on Play Console pre-launch report. ([#22003](https://github.com/expo/expo/pull/22003) by [@aleqsio](https://github.com/aleqsio))

## 14.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 14.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 14.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added two new synchronous functions: `getLocales` and `getCalendars`. ([#19019](https://github.com/expo/expo/pull/19019) by [@aleqsio](https://github.com/aleqsio))
- Added a `supportsRTL` manifest flag for enabling RTL on suitable locales. ([#19634](https://github.com/expo/expo/pull/19634) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- Fixed build error for setting `compileSdkVersion` to 33. ([#19518](https://github.com/expo/expo/pull/19518) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- Deprecated existing constants API while keeping backwards compatibility. ([#19019](https://github.com/expo/expo/pull/19019) by [@aleqsio](https://github.com/aleqsio))

## 13.1.0 — 2022-07-07

### 🎉 New features

- Native module on Android is now written in Kotlin using the new API. ([#17775](https://github.com/expo/expo/pull/17775) by [@barthap](https://github.com/barthap))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 13.0.0 — 2022-04-18

### 🛠 Breaking changes

- Guess the device language on iOS rather than using the app-specific language. ([#15807](https://github.com/expo/expo/pull/15807) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Use JSI host object instead of the bridge module for communication between JavaScript and native code. ([#16972](https://github.com/expo/expo/pull/16972) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Exception in HostObject::get for prop 'NativeUnimoduleProxy': java.lang.NullPointerException ([#16316](https://github.com/expo/expo/pull/16316) by [@nomi9995](https://github.com/nomi9995))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.0.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.0.0 — 2021-12-03

### 🎉 New features

- Native module on iOS is now written in Swift using the new API. ([#15266](https://github.com/expo/expo/pull/15266) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Rewrite module to Kotlin. ([#14588](https://github.com/expo/expo/pull/14588) by [@mstach60161](https://github.com/mstach60161))

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Add `currency`, `isMetric`, `decimalSeparator`, `digitGroupingSeparator` properties. ([#11663](https://github.com/expo/expo/pull/11663) by [@IjzerenHein](https://github.com/IjzerenHein))
- Add support for `region` property for Android. ([#11663](https://github.com/expo/expo/pull/11663) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🐛 Bug fixes

- Fix invalid `region` property on Web when locale contains script or variant fields. ([#11663](https://github.com/expo/expo/pull/11663) by [@IjzerenHein](https://github.com/IjzerenHein))
- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- `Localization.region` changed from `undefined | string` to `null | string` on web to match iOS. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added doc blocks for everything. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for SSR environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- `Localization.isRTL` defaults to `false` in node environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- `Localization.region` now returns `null` when a partial `locale` is defined by the browser on web. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `Localization.locale` throwing an exception on the iOS simulator. ([#8193](https://github.com/expo/expo/pull/8193) by [@lukmccall](https://github.com/lukmccall))
