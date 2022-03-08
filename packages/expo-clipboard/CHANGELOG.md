# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Native module on Android is now written in Kotlin using the new API. ([#16269](https://github.com/expo/expo/pull/16269) by [@barthap](https://github.com/barthap))
- Added support for setting and getting images (`setImageAsync`, `hasImageAsync`, `getImageAsync`). ([#16391](https://github.com/expo/expo/pull/16391), [#16413](https://github.com/expo/expo/pull/16413) by [@barthap](https://github.com/barthap))
- On iOS added support for setting and getting URLs (`setUrlAsync`, `hasUrlAsync`, `getUrlAsync`). ([#16391](https://github.com/expo/expo/pull/16391) by [@graszka22](https://github.com/graszka22), [@barthap](https://github.com/barthap))
- Added new method `hasStringAsync` that checks whether clipboard has text content. ([#16524](https://github.com/expo/expo/pull/16524) by [@barthap](https://github.com/barthap))
- Added support for HTML content in `getStringAsync` and `setStringAsync`.

### 🐛 Bug fixes

### ⚠ Notices

- Deprecated `setString`. Use `setStringAsync` instead. ([#16320](https://github.com/expo/expo/pull/16320) by [@barthap](https://github.com/barthap))

### 💡 Others

## 2.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 2.1.0 — 2021-12-03

### 🎉 New features

- Native module on iOS is now written in Swift using [Sweet API](https://blog.expo.dev/a-peek-into-the-upcoming-sweet-expo-module-api-6de6b9aca492). ([#14959](https://github.com/expo/expo/pull/14959) by [@tsapeta](https://github.com/tsapeta))

## 2.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 2.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Clean up Android code. ([#13517](https://github.com/expo/expo/pull/13517) by [@mstach60161](https://github.com/mstach60161))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 1.1.0 — 2021-06-16

### 🎉 New features

- Added Clipboard event listener ([#13050](https://github.com/expo/expo/pull/13050) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fixed `getStringAsync` causing crashes on Web when an exception is thrown. ([#12494](https://github.com/expo/expo/pull/12494) by [@robertherber](https://github.com/robertherber))
- Fixed newlines not being copied on web. ([#12951](https://github.com/expo/expo/pull/12951) by [@cruzach](https://github.com/cruzach))

## 1.0.2 — 2021-03-23

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 1.0.1 — 2020-12-08

_This version does not introduce any user-facing changes._

## 1.0.0 — 2020-12-07

### 🐛 Bug fixes

_This version does not introduce any user-facing changes._
