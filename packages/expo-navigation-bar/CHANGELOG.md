# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fix `getVisiblilityAsync` crashing on Android 10 and older. ([#16445](https://github.com/expo/expo/pull/16445) by [@barthap](https://github.com/barthap))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 1.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 1.1.1 — 2021-12-08

### 🐛 Bug fixes

- Return `hidden` from `useVisibility` hook on unsupported platforms. ([#15430](https://github.com/expo/expo/pull/15430) by [@EvanBacon](https://github.com/EvanBacon))
- Lazily initialize emitter to allow importing the module on unsupported platforms. ([#15430](https://github.com/expo/expo/pull/15430) by [@EvanBacon](https://github.com/EvanBacon))

## 1.1.0 — 2021-12-03

### 🐛 Bug fixes

- Fix border color warning ([#14950](https://github.com/expo/expo/pull/14950) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Added more useful resource for deprecated `visible` property ([#14809](https://github.com/expo/expo/pull/14809) by [@EvanBacon](https://github.com/EvanBacon))
