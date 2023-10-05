# Changelog

## Unpublished

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

### 🐛 Bug fixes

- On `iOS`, fix permissions error on `iOS 17`. ([#24545](https://github.com/expo/expo/pull/24545) by [@alanjhughes](https://github.com/alanjhughes))
- Fix url parsing when adding url in calendar event and reminder on iOS. ([#24102](https://github.com/expo/expo/pull/24102) by [@Thomas-Mollard](https://github.com/Thomas-Mollard))
- On `iOS`, fix check that determines if the version of Xcode supports `iOS 17`. ([#24655](https://github.com/expo/expo/pull/24655) by [@alanjhughes](https://github.com/alanjhughes))
- On `iOS`, validate calendars argument in `getRemindersAsync` before accessing `count`. ([#24677](https://github.com/expo/expo/pull/24677) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

## 11.3.2 — 2023-09-28

### 🐛 Bug fixes

- On `iOS`, fix check that determines if the version of Xcode supports `iOS 17`. ([#24655](https://github.com/expo/expo/pull/24655) by [@alanjhughes](https://github.com/alanjhughes))

## 11.3.1 — 2023-09-25

### 🐛 Bug fixes

- On `iOS`, fix permissions error on `iOS 17`. ([#24545](https://github.com/expo/expo/pull/24545) by [@alanjhughes](https://github.com/alanjhughes))
- Fix url parsing when adding url in calendar event and reminder on iOS. ([#24102](https://github.com/expo/expo/pull/24102) by [@Thomas-Mollard](https://github.com/Thomas-Mollard))

## 12.0.0 — 2023-09-04

### 🛠 Breaking changes

- Forbid passing an id to `createEventAsync` and `updateEventAsync`. ([#23810](https://github.com/expo/expo/pull/23810) by [@pierrezimmermannbam](https://github.com/pierrezimmermannbam))

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 💡 Others

- [Android] Migrate to use Expo Modules API. ([#24103](https://github.com/expo/expo/pull/24103) by [@lukmccall](https://github.com/lukmccall))

## 11.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 11.4.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 11.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 11.2.0 — 2023-05-08

### 💡 Others

- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 11.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 11.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 11.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 11.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 10.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 10.2.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-12-03

### 🐛 Bug fixes

- [Android] Fix `allowModifications` always return false in calendar object. ([#15307](https://github.com/expo/expo/pull/15307) by [@jekiwijaya](https://github.com/jekiwijaya))

### 💡 Others

- Replace custom `OptionalKeys` type wrapper with embedded in TypeScript `Partial`. ([#15192](https://github.com/expo/expo/pull/15192) by [@Simek](https://github.com/Simek))
- Extract nested object in current types to new, separate types: `AlarmLocation` and `DaysOfTheWeek`. ([#15192](https://github.com/expo/expo/pull/15192) by [@Simek](https://github.com/Simek))

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add useCalendarPermissions and useRemindersPermissions hooks from modules factory. ([#13854](https://github.com/expo/expo/pull/13854) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrote from Java to Kotlin, migrated from `AsyncTask` to `kotlinx.coroutines`. ([#13527](https://github.com/expo/expo/pull/13527) by [@M1ST4KE](https://github.com/M1ST4KE))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13756](https://github.com/expo/expo/pull/13756) by [@tsapeta](https://github.com/tsapeta))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Fixed `ExpoCalendar.getCalendarsAsync()` crashing on Android when device has unsupported calendars. ([#12724](https://github.com/expo/expo/pull/12724) by [@ibraude](https://github.com/ibraude))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))

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

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 8.6.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.5.0 — 2020-08-18

### 🎉 New features

- Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))

## 8.4.0 — 2020-08-11

### 🎉 New features

- Create isAvailableAsync method. ([#9641](https://github.com/expo/expo/pull/9641) by [@EvanBacon](https://github.com/EvanBacon))

## 8.3.0 — 2020-07-20

### 🎉 New features

- `createCalendarAsync` now uses default calendar for given `entityType` if `sourceId` parameter (iOS only) is not provided. ([#8570](https://github.com/expo/expo/pull/8570) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix `Calendar.getEventsAsync` crashing when `recurrenceRules` are incorrect. ([#8760](https://github.com/expo/expo/pull/8760) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Calendar.createEventAsync` crashing when `alarms` were set or `endTimeZone` was null. ([#9269](https://github.com/expo/expo/pull/9269) by [@barthap](https://github.com/barthap))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `Calendar.getCalendarsAsync` requiring not needed permissions on iOS. ([#7928](https://github.com/expo/expo/pull/7928) by [@lukmccall](https://github.com/lukmccall))
- Fix `recurrence rule` and `event` parsing. ([#7527](https://github.com/expo/expo/pull/7527) by [@lukmccall](https://github.com/lukmccall))
