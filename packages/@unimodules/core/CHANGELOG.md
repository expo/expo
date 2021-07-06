# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 7.1.1 — 2021-05-25

### 💡 Others

- Replaced clang's `typeof` with `__typeof` that works with both C++ and GNU++. (by [@tsapeta](https://github.com/tsapeta))

## 7.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 7.0.0 — 2020-12-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 6.0.0 — 2020-11-17

### 🛠 Breaking changes

- Removed `org.unimodules.core.InvalidArgumentException`. Please use its coded version, `org.unimodules.core.errors.InvalidArgumentException`, instead. ([#9961](https://github.com/expo/expo/pull/9961) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- Fixed the `DoNotStrip` annotation not working with classes. ([#10421](https://github.com/expo/expo/pull/10421) by [@lukmccall](https://github.com/lukmccall))

## 5.5.0 — 2020-08-11

### 🎉 New features

- Expo modules applying `unimodules-core.gradle` now automatically depend on `unimodule-test-core` project in Android test flavors if the `src/test` directory exists in the module project. (In packages published to NPM the directory should not be present, so there's no need to change anything in users' projects.) ([#8881](https://github.com/expo/expo/pull/8881) by [@mczernek](https://github.com/mczernek))
- App delegates can now handle background URL session events via `application:handleEventsForBackgroundURLSession:completionHandler:` method on iOS. ([#8599](https://github.com/expo/expo/pull/8599) by [@lukmccall](https://github.com/lukmccall))

## 5.3.0 — 2020-05-29

### 🐛 Bug fixes

- Fixed a bug in `UMAppDelegateWrapper` when it's used with Swift. ([#8526](https://github.com/expo/expo/pull/8526) by [@EvanBacon](https://github.com/EvanBacon))

## 5.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed error when serializing a `Map` containing a `null` ([#8153](https://github.com/expo/expo/pull/8153) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed _unused variable_ warnings in `UMAppDelegateWrapper` ([#8467](https://github.com/expo/expo/pull/8467) by [@sjchmiela](https://github.com/sjchmiela))

## 5.1.1 - 2020-05-05

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed a rare undetermined behavior that may have been a result of misuse of `dispatch_once_t` on iOS ([#7576](https://github.com/expo/expo/pull/7576) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed error when serializing a `Map` containing a `Bundle` ([#8068](https://github.com/expo/expo/pull/8068) by [@sjchmiela](https://github.com/sjchmiela))
