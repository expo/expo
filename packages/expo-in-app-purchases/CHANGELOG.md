# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.1.0 — 2020-09-21

### 🐛 Bug fixes

- `errorCodeNativeToJS` now returns 0 by default. This fixes a build error that would occur on Xcode 12. ([#10224](https://github.com/expo/expo/pull/10224) by [@nabettu](https://github.com/nabettu))

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Calling `connectAsync` no longer queries the purchase history. This way, on iOS, the user is not prompted to log into their Apple ID until `getPurchaseHistoryAsync` is called. Thanks to @sergeichestakov for implementing this in https://github.com/expo/expo/pull/8577.

## 8.2.1 — 2020-05-29

*This version does not introduce any user-facing changes.*

## 8.2.0 — 2020-05-27

*This version does not introduce any user-facing changes.*
