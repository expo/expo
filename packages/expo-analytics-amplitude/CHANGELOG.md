# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 11.0.4 — 2021-11-03

_This version does not introduce any user-facing changes._

## 11.0.2 — 2021-11-03

### 🐛 Bug fixes

- Fixed `setUserIdAsync` throwing error on Android when `null` is passed. ([#15028](https://github.com/expo/expo/pull/15028) by [@tsapeta](https://github.com/tsapeta))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Remove the deprecated, non-async methods: `initialize`, `setUserId`, `setUserProperties`, `clearUserProperties`, `logEvent`, `logEventWithProperties`, `setGroup` and `setTrackingOptions`. ([#13675](https://github.com/expo/expo/pull/13675) by [@Simek](https://github.com/Simek))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Added API test in BareExpo app ([#13774](https://github.com/expo/expo/pull/13774/) by [@kkafar](https://github.com/kkafar))
- Added unit tests ([#13747](https://github.com/expo/expo/pull/13747) by [@kkafar](https://github.com/kkafar))
- Replace the generic object types with `Record`s. ([#13675](https://github.com/expo/expo/pull/13675) by [@Simek](https://github.com/Simek))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Converted Android code to Kotlin ([#13564](https://github.com/expo/expo/pull/13564) by [@kkafar](https://github.com/kkafar))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.0.0 — 2020-11-17

### 🛠 Breaking changes

- Renamed all methods to include the 'Async' suffix:
  - `initialize` to `initializeAsync`
  - `setUserId` to `setUserIdAsync`
  - `setUserProperties` to `setUserPropertiesAsync`
  - `clearUserProperties` to `clearUserPropertiesAsync`
  - `logEvent` to `logEventAsync`
  - `logEventWithProperties` to `logEventWithPropertiesAsync`
  - `setGroup` to `setGroupAsync`
  - `setTrackingOptions` to `setTrackingOptionsAsync`
([#9212](https://github.com/expo/expo/pull/9212/) by [@cruzach](https://github.com/cruzach))
- All methods now return a Promise. ([#9212](https://github.com/expo/expo/pull/9212/) by [@cruzach](https://github.com/cruzach))

## 8.3.1 — 2020-08-24

### 🛠 Breaking changes

- Upgraded native Amplitude iOS library from `4.7.1` to `6.0.0`. This removes the IDFA code that was previously included with the Amplitude library. `disableIDFA` option for `Amplitude.setTrackingOptions` is removed. If you would like to collect the IDFA, you must be in the bare workflow. ([#9880](https://github.com/expo/expo/pull/9880) by [@bbarthec](https://github.com/bbarthec))

## 8.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
