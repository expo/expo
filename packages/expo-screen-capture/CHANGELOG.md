# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 3.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Added `isAvailableAsync` method. ([#12121](https://github.com/expo/expo/pull/12121) by [@bycedric](https://github.com/bycedric))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.0.0 — 2020-11-17

### 🛠 Breaking changes

- Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))

## 1.1.1 — 2020-08-20

_This version does not introduce any user-facing changes._

## 1.1.0 — 2020-08-18

### 🎉 New features

- Added `addScreenshotListener` and `removeScreenshotListener` methods so you can take action in your app whenever a user takes a screenshot. ([#9747](https://github.com/expo/expo/pull/9747) by [@cruzach](https://github.com/cruzach))

## 1.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.0.0 — 2020-05-27

### 🎉 New features

- Initial release of `expo-screen-capture` module with support for preventing screen capture on iOS and Android ([#8326](https://github.com/expo/expo/pull/8326) by [@cruzach](https://github.com/cruzach))
