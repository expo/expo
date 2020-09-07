# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 8.5.0 — 2020-08-18

### 🐛 Bug fixes

- Removed unncecessary Android dependencies. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))
- Fixed `openAuthSessionAsync` crashing when cancelled on iOS. ([#9722](https://github.com/expo/expo/pull/9722) by [@barthap](https://github.com/barthap))

## 8.4.0 — 2020-07-29

### 🎉 New features

- Added `locked` state to `openBrowserAsync`. ([#9254](https://github.com/expo/expo/pull/9254) by [@EvanBacon](https://github.com/EvanBacon))
- Add `secondaryToolbarColor` (Android) flag for `WebBrowser` ([#8615](https://github.com/expo/expo/pull/8615) by [@jdanthinne](https://github.com/jdanthinne)))

### 🐛 Bug fixes

- Fix native Android dependencies used in tests - Kotlin and testing libraries. ([#8881](https://github.com/expo/expo/pull/8881) by [@mczernek](https://github.com/mczernek))

## 8.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-05-27

### 🎉 New features

- Add `readerMode` and `dismissButtonStyle` (iOS) and `enableDefaultShare` (Android) flags for `WebBrowser` ([#7221](https://github.com/expo/expo/pull/7221) by [@LinusU](https://github.com/LinusU)) & [@mczernek](https://github.com/mczernek))

### 🐛 Bug fixes

- Fix `WebBrowser` sending `dismiss` before opening. ([#6743](https://github.com/expo/expo/pull/6743) by [@LucaColonnello](https://github.com/LucaColonnello))
