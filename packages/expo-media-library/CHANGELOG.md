# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 8.5.0 — 2020-07-29

### 🎉 New features

- Added `options` to `getAssetInfoAsync()`, which allows specifying whether to download the asset from network in iOS. ([#9405](https://github.com/expo/expo/pull/9405) by [@jarvisluong](https://github.com/jarvisluong))
- Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed `getAssetsAsync` crashes when given invalid `after` value on Android. ([#9466](https://github.com/expo/expo/pull/9466) by [@barthap](https://github.com/barthap))

## 8.4.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed `getAssetsAsync()` and `getAssetInfoAsync()` location issues on Android Q. ([#9315](https://github.com/expo/expo/pull/9315) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-07-02

### 🐛 Bug fixes

- Handled the crash when calling `getAssetInfoAsync` on a slow motion video on iOS. ([#8802](https://github.com/expo/expo/pull/8802) by [@jarvisluong](https://github.com/jarvisluong))

## 8.2.1 — 2020-05-29

*This version does not introduce any user-facing changes.*

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Added missing image loader for `MediaLibrary` in bare workflow. ([#8304](https://github.com/expo/expo/pull/8304) by [@tsapeta](https://github.com/tsapeta))
- Fixed `MediaLibrary` not compiling with the `use_frameworks!` option in the bare React Native application. ([#7861](https://github.com/expo/expo/pull/7861) by [@Ashoat](https://github.com/Ashoat))
- Flip dimensions based on media rotation data on Android to match `<Image>` and `<Video>` as well as iOS behavior. ([#7980](https://github.com/expo/expo/pull/7980) by [@Ashoat](https://github.com/Ashoat))
