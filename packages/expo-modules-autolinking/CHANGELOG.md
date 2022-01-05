# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.5.5 — 2022-01-05

### 🐛 Bug fixes

- Fix `umbrella directory '../../Public/React-Core/React' not found` build error when in `use_frameworks!` mode. ([#15773](https://github.com/expo/expo/pull/15773) by [@kudo](https://github.com/kudo))

## 0.5.4 — 2021-12-29

### 🐛 Bug fixes

- Add `expo_patch_react_imports!` support for React-Native 0.66. ([#15724](https://github.com/expo/expo/pull/15724) by [@kudo](https://github.com/kudo))

## 0.5.3 — 2021-12-28

### 🐛 Bug fixes

- Fix `expo_patch_react_imports!` error when there are pods with absolute path. ([#15699](https://github.com/expo/expo/pull/15699) by [@kudo](https://github.com/kudo))

## 0.5.2 — 2021-12-22

### 🐛 Bug fixes

- Introduce `expo_patch_react_imports!` to transform double-quoted React imports into angle-brackets in order to fix third-party libraries incompatibility with SDK 44. ([#15655](https://github.com/expo/expo/pull/15655) by [@kudo](https://github.com/kudo))

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
