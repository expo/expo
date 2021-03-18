# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Add TypeScript definition of `executionInfo.appState`. ([#11670](https://github.com/expo/expo/pull/11670) by [@Noitidart](https://github.com/Noitidart))
- Accept generic data type of task body objects. ([#11669](https://github.com/expo/expo/pull/11669) by [@Noitidart](https://github.com/Noitidart))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 8.6.0 — 2020-11-17

### 🎉 New features

- Added `isAvailableAsync` method. ([#10657](https://github.com/expo/expo/pull/10657) by [@PranshuChittora](https://github.com/pranshuchittora))

## 8.5.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.4.0 — 2020-07-16

### 🐛 Bug fixes

- Added some safety checks to prevent `NullPointerExceptions` on Android. ([#8864](https://github.com/expo/expo/pull/8864) by [@mczernek](https://github.com/mczernek))
- Fix tasks not being removed from memory when unregistering them. ([#8612](https://github.com/expo/expo/pull/8612) by [@mczernek](https://github.com/mczernek))

## 8.3.0 — 2020-05-29

### 🐛 Bug fixes

- Upgrading an application does not cause `BackgroundFetch` tasks to unregister. ([#8348](https://github.com/expo/expo/pull/8438) by [@mczernek](https://github.com/mczernek))
