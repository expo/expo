# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

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
