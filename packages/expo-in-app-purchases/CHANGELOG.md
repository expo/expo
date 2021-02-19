# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.1.0 — 2021-02-02

### 🎉 New features

- Map more iOS error codes to JS/TS error codes ([#11773](https://github.com/expo/expo/pull/11773)) by @danmaas
- Add defensive null checks so that bugs in the Android payments API do not cause crashes ([#11773](https://github.com/expo/expo/pull/11773)) by @danmaas
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.1.0 — 2020-09-21

### 🐛 Bug fixes

- `errorCodeNativeToJS` now returns 0 by default. This fixes a build error that would occur on Xcode 12. ([#10224](https://github.com/expo/expo/pull/10224) by [@nabettu](https://github.com/nabettu))

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Calling `connectAsync` no longer queries the purchase history. This way, on iOS, the user is not prompted to log into their Apple ID until `getPurchaseHistoryAsync` is called. Thanks to @sergeichestakov for implementing this in https://github.com/expo/expo/pull/8577.

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
