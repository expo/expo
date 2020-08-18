# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.2.0 — 2020-08-18

### 🐛 Bug fixes

- Added docs about Android permissions and removed old storage permission. ([#9447](https://github.com/expo/expo/pull/9447) by [@bycedric](https://github.com/bycedric))

## 9.1.0 — 2020-07-27

### 🐛 Bug fixes

- Fix background URL session completion handler not being called. ([#8599](https://github.com/expo/expo/pull/8599) by [@lukmccall](https://github.com/lukmccall))
- Fix compilation error on macOS Catalyst ([#9055](https://github.com/expo/expo/pull/9055) by [@andymatuschak](https://github.com/andymatuschak))
- Fixed `uploadAsync` native signature on Android. ([#9076](https://github.com/expo/expo/pull/9076) by [@lukmccall](https://github.com/lukmccall))
- Fixed `uploadAsync` throwing `Double cannot be cast to Integer` on Android. ([#9076](https://github.com/expo/expo/pull/9076) by [@lukmccall](https://github.com/lukmccall))
- Fixed `getInfo` returning incorrect size when provided path points to a folder. ([#9063](https://github.com/expo/expo/pull/9063) by [@lukmccall](https://github.com/lukmccall))
- Fixed `uploadAsync()` returning empty response on iOS. ([#9166](https://github.com/expo/expo/pull/9166) by [@barthap](https://github.com/barthap))

## 9.0.1 — 2020-05-29

*This version does not introduce any user-facing changes.*

## 9.0.0 — 2020-05-27

### 🛠 Breaking changes

- `FileSystem.downloadAsync` and `FileSystem.DownloadResumable` work by default when the app is in background too — they won't reject when the application is backgrounded. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
- `FileSystem.downloadAsync` and `FileSystem.DownloadResumable` will reject when invalid headers dictionary is provided. These methods accept only `Record<string, string>`. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
- `FileSystem.getContentUriAsync` now returns a string. ([#7192](https://github.com/expo/expo/pull/7192) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Add `FileSystem.uploadAsync` method. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
- Add ability to read Android `raw` and `drawable` resources in `FileSystem.getInfoAsync`, `FileSystem.readAsStringAsync`, and `FileSystem.copyAsync`. ([#8104](https://github.com/expo/expo/pull/8104) by [@esamelson](https://github.com/esamelson))
