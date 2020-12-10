# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 2.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.0.0 — 2020-08-11

### 🛠 Breaking changes

- Now the module will keep the lock active when the app backgrounds. ([#8727](https://github.com/expo/expo/pull/8727) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fix `ScreenOrientation.getOrientationAsync` returning a wrong value when the application is starting. ([#8727](https://github.com/expo/expo/pull/8727) by [@lukmccall](https://github.com/lukmccall))

## 1.1.1 — 2020-05-29

*This version does not introduce any user-facing changes.*

## 1.1.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `ScreenOrientation.addOrientationChangeListener` payload to match docs. ([#7774](https://github.com/expo/expo/pull/7774) by [@awinograd](https://github.com/awinograd))
- Fixed `ScreenOrientation.lockAsync` to properly convert to web platform equivalent of chosen lock. ([#7774](https://github.com/expo/expo/pull/7774) by [@awinograd](https://github.com/awinograd))
