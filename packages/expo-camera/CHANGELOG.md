# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Fix bug where `barCodeTypes` needed to be defined on web. ([#9630](https://github.com/expo/expo/pull/9630) by [@EvanBacon](https://github.com/EvanBacon))
- Fix bug where camera would sometimes not start on web desktop. ([#9630](https://github.com/expo/expo/pull/9630) by [@EvanBacon](https://github.com/EvanBacon))
- Deleted `CaptureOptions` in favor of `CameraPictureOptions` ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))
- Added camera permissions declarations to `AndroidManifest.xml` on Android. ([#9224](https://github.com/expo/expo/pull/9224) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Added support for QR scanning on web. ([#4166](https://github.com/expo/expo/pull/4166) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `fbjs` dependency
- Delete `prop-types` in favor of TypeScript. ([#8680](https://github.com/expo/expo/pull/8680) by [@EvanBacon](https://github.com/EvanBacon))
- [camera] Directly import `createElement` from `react-native-web` for RNW v12 support. ([#8773](https://github.com/expo/expo/pull/8773) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix QR scanning on Android and iOS. ([#9741](https://github.com/expo/expo/pull/9741) by [@EvanBacon](https://github.com/EvanBacon))
- [web] Fix bug where swapping cameras caused screen to flicker ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))
- [web] Fix bug where swapping cameras doesn't persist camera settings ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))

## 8.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))

### 🎉 New features

- Added exports for TypeScript definitions: CameraType, ImageType, ImageParameters, ImageSize, CaptureOptions, CapturedPicture ([#8457](https://github.com/expo/expo/pull/8457) by [@jarvisluong](https://github.com/jarvisluong))
