# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

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
