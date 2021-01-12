# Changelog

## Unpublished

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
