# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.2.1 — 2020-09-02

### 🐛 Bug fixes

- Fixed `RuntimeException: setDataSource failed: status = 0x80000000` caused by `MediaMetadataRetriever`. ([#9855](https://github.com/expo/expo/pull/9855) by [@lukmccall](https://github.com/lukmccall))
- Fixed `media-library` methods failing when not all permissions were granted on iOS 14. ([#10026](https://github.com/expo/expo/pull/10026) by [@lukmccall](https://github.com/lukmccall))

## 9.2.0 — 2020-08-18

### 🐛 Bug fixes

- Fixed handling albums without name on Android. ([#9787](https://github.com/expo/expo/pull/9787) by [@barthap](https://github.com/barthap))

## 9.1.0 — 2020-08-13

### 🎉 New features

- Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed `getAlbumsAsync()`, `getAlbum()` and media change listener crashing on Android 10. ([#9666](https://github.com/expo/expo/pull/9666) by [@barthap](https://github.com/barthap))

## 9.0.0 — 2020-08-11

### 🛠 Breaking changes

- Added external storage permissions declarations to `AndroidManifest.xml` on Android. ([#9231](https://github.com/expo/expo/pull/9231) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fixed validation for input arguments of `getAssetsAsync`. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))
- Fixed bug, where `getAssetsAsync` did not reject on error on Android. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))

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

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Added missing image loader for `MediaLibrary` in bare workflow. ([#8304](https://github.com/expo/expo/pull/8304) by [@tsapeta](https://github.com/tsapeta))
- Fixed `MediaLibrary` not compiling with the `use_frameworks!` option in the bare React Native application. ([#7861](https://github.com/expo/expo/pull/7861) by [@Ashoat](https://github.com/Ashoat))
- Flip dimensions based on media rotation data on Android to match `<Image>` and `<Video>` as well as iOS behavior. ([#7980](https://github.com/expo/expo/pull/7980) by [@Ashoat](https://github.com/Ashoat))
