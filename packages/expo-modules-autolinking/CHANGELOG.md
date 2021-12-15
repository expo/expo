# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.5.1 — 2021-12-15

_This version does not introduce any user-facing changes._

## 0.5.0 — 2021-12-03

### 🎉 New features

- Patch React podspecs on the fly to support Swift integration. ([#15299](https://github.com/expo/expo/pull/15299) by [@kudo](https://github.com/kudo))

## 0.4.0 — 2021-11-17

### 🎉 New features

- Added "silent" property for silencing resolution warnings. ([#14891](https://github.com/expo/expo/pull/14891) by [@EvanBacon](https://github.com/EvanBacon))
- Listing module's app delegate subscribers in the generated `ExpoModulesProvider.swift`. ([#14867](https://github.com/expo/expo/pull/14867) by [@tsapeta](https://github.com/tsapeta))
- Search for Android package in the entire source code other than just `src` directory. ([#14883](https://github.com/expo/expo/pull/14883) by [@kudo](https://github.com/kudo))
- Introduce React Native bridge delegate handlers on iOS. ([#15138](https://github.com/expo/expo/pull/15138) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix Gradle error when running Gradle from outside of the project directory. ([#15109](https://github.com/expo/expo/pull/15109) by [@kudo](https://github.com/kudo))

## 0.3.3 — 2021-10-21

### 🐛 Bug fixes

- Resolved race condition when generating `ExpoModulesProvider.swift`. ([#14822](https://github.com/expo/expo/pull/14822) by [@awinograd](https://github.com/awinograd))
