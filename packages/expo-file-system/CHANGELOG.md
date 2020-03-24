# Changelog

## master

### 🛠 Breaking changes

- `FileSystem.downloadAsync` and `FileSystem.DownloadResumable` now works in the background - they won't reject when the user backgrounds the application. ([#7380](https://github.com/expo/expo/pull/7380) [@lukmccall](https://github.com/lukmccall))
- `FileSystem.getContentUriAsync` now returns a string. ([#7192](https://github.com/expo/expo/pull/7192) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Add `FileSystem.uploadAsync` method. ([#7380](https://github.com/expo/expo/pull/7380) and [#7393](https://github.com/expo/expo/pull/7393) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes
