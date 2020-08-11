# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.0.0 — 2020-08-11

### 🛠 Breaking changes

- Added camera and external storage permissions declarations to `AndroidManifest.xml` on Android. ([#9230](https://github.com/expo/expo/pull/9230) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))
- Added `videoMaxDuration` option to `launchCameraAsync()` to configure video recording duration limit. ([#9486](https://github.com/expo/expo/pull/9486) by [@barthap](https://github.com/barthap))

## 8.4.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed downsizing cropped image, when `allowsEditing` was `true`. ([#9316](https://github.com/expo/expo/pull/9316) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-05-29

*This version does not introduce any user-facing changes.*

## 8.2.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))

### 🐛 Bug fixes

- Skip asking for camera permissions on web with `ImagePicker.getCameraPermissionsAsync`. ([#8475](https://github.com/expo/expo/pull/8475) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed exception when calling `ImagePicker.getCameraPermissionsAsync` on Web. ([#7498](https://github.com/expo/expo/pull/7498) by [@IjzerenHein](https://github.com/IjzerenHein))
