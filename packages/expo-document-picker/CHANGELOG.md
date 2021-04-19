# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 9.1.1 — 2021-04-09

### 🐛 Bug fixes

- Added SSR guard. ([#12420](https://github.com/expo/expo/pull/12420) by [@EvanBacon](https://github.com/EvanBacon))

## 9.1.0 — 2021-03-10

### 🎉 New features

- Created config plugin. ([#11977](https://github.com/expo/expo/pull/11977) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 9.0.1 — 2021-01-15

_This version does not introduce any user-facing changes._

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.4.1 — 2020-10-02

### 🐛 Bug fixes

- Fixed `UIDocumentPickerViewController` being `nil` on iOS 14 and thus causing the hard-crash of the application. ([#10327](https://github.com/expo/expo/pull/10327) by [@bbarthec](https://github.com/bbarthec))
- Fixed `Promise` not being fulfilled if the document picker view controller was being dismissed by gesture on iOS. ([#10325](https://github.com/expo/expo/pull/10325) by [@sjchmiela](https://github.com/sjchmiela))

## 8.4.0 — 2020-08-18

### 🐛 Bug fixes

- Fixed iOS bug, where it could be impossible to select only videos. ([#9720](https://github.com/expo/expo/pull/9720) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed `getDocumentAsync` crashing when picking a folder on iOS. ([#8930](https://github.com/expo/expo/pull/8930) by [@lukmccall](https://github.com/lukmccall))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
