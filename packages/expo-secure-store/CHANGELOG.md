# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 10.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Data saved with `expo-secure-store` is no longer lost upon ejecting, **if you first upgrade your app to SDK 41 before ejecting**. ([#11309](https://github.com/expo/expo/pull/11309) by [@cruzach](https://github.com/cruzach))

> On Android, all of your `SecureStore` data will be migrated on app start-up. On iOS, keys and their associated data will be migrated whenever you call `getItemAsync` on that key. This means that any keys you don't `get` while on SDK 41 will **not** be migrated.## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.3.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.2.0 — 2020-08-11

### 🎉 New features

- Create `isAvailableAsync` method. ([#9668](https://github.com/expo/expo/pull/9668) by [@EvanBacon](https://github.com/EvanBacon))

## 9.1.0 — 2020-07-27

### 🐛 Bug fixes

- Fix incorrect security attribute applied when using the flag WHEN_UNLOCKED_THIS_DEVICE_ONLY on iOS ([#9264](https://github.com/expo/expo/pull/9264) by [@cjthompson](https://github.com/cjthompson))

## 9.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
