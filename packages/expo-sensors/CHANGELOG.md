# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.2.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.1.0 — 2020-08-11

### 🐛 Bug fixes

- Ensure browser globals `DeviceMotionEvent` and `DeviceOrientationEvent` exist before attempting to read from them. ([#9236](https://github.com/expo/expo/pull/9236) by [@evanbacon](https://github.com/evanbacon))
- Fixed bug with low Barometer resolution on iOS. ([#9441](https://github.com/expo/expo/pull/9441) by [@barthap](https://github.com/barthap))

## 9.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-05-27

### 🛠 Breaking changes

- `DeviceMotion.addListener` emits events with `rotationRate` in degrees instead of radians on all platforms. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
- `DeviceMotion.addListener` emits events with `rotationRate` in the form of alpha = x, beta = y, gamma = z on all platforms. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))

### 🎉 New features

- `DeviceMotion.addListener` emits events with `interval` property. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))

### 🐛 Bug fixes

- All sensors use more precise gravity `9.80665` instead of `9.8`. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
