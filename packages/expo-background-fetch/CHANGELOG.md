# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- [plugin] Moved `UIBackgroundModes` `location` to the `expo-location` plugin ([#14142](https://github.com/expo/expo/pull/14142) by [@EvanBacon](https://github.com/EvanBacon))
- Remove exported enums aliases for `BackgroundFetchResult` and `BackgroundFetchStatus`. ([#12716](https://github.com/expo/expo/pull/13267) by [@Simek](https://github.com/Simek))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Use stable manifest ID where applicable. ([#12964](https://github.com/expo/expo/pull/12964) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Update `minimumInterval` value to accurately reflect Android default. ([#13387](https://github.com/expo/expo/pull/13387) by [@ajsmth](https://github.com/ajsmth))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Export missing `BackgroundFetchOptions` type. ([#12716](https://github.com/expo/expo/pull/13267) by [@Simek](https://github.com/Simek))

## 9.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 8.6.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.5.0 — 2020-08-18

### 🐛 Bug fixes

- Usage fails correctly on web. ([#9661](https://github.com/expo/expo/pull/9661) by [@EvanBacon](https://github.com/EvanBacon))

## 8.4.0 — 2020-07-16

### 🐛 Bug fixes

- Added some safety checks to prevent `NullPointerExceptions` on Android. ([#8868](https://github.com/expo/expo/pull/8868) by [@mczernek](https://github.com/mczernek))

## 8.3.0 — 2020-05-29

### 🐛 Bug fixes

- Upgrading an application does not cause `BackgroundFetch` tasks to unregister. ([#8348](https://github.com/expo/expo/pull/8438) by [@mczernek](https://github.com/mczernek))
