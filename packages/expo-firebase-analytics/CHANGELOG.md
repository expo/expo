# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 2.6.0 — 2020-10-27

### 🐛 Bug fixes

- Fix exception in setCurrentScreen on Android. ([#10804](https://github.com/expo/expo/pull/10804) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix setup native firebase link in README. ([#10740](https://github.com/expo/expo/pull/10740) by [@jarvisluong](https://github.com/jarvisluong))

## 2.5.1 — 2020-10-08

- Fix failed network requests on Android. ([#10606](https://github.com/expo/expo/pull/10606) by [@IjzerenHein](https://github.com/IjzerenHein))

## 2.5.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 2.4.1 — 2020-05-29

### 🐛 Bug fixes

- Fixes `parseEvent` and `parseUserProperty` to allow numeric characters in the name parameter. ([#8516](https://github.com/expo/expo/pull/8516) by [@thorbenprimke](https://github.com/thorbenprimke))

## 2.4.0 — 2020-05-27

### 🎉 New features

- Add `setDebugModeEnabled` for enabling DebugView on the Expo client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🐛 Bug fixes

- Fix no events recorded on the Expo client when running on certain Android devices. ([#7679](https://github.com/expo/expo/pull/7679) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix `setAnalyticsCollectionEnabled` throwing an error.
- Fixes & improvements to the pure JS analytics client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fixed logEvent in `expo-firebase-analytics` for Android. logEvent's optional properties parameter was causing a NPE on Android when not provided. ([#7897](https://github.com/expo/expo/pull/7897) by [@thorbenprimke](https://github.com/thorbenprimke))
