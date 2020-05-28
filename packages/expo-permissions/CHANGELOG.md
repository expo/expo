# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- If permission is not recognized, show the correct expo package to link. ([#8546])(https://github.com/expo/expo/pull/8046) by [@jarvisluong](https://github.com/jarvisluong)

### 🐛 Bug fixes

- Fix permissions in the headless mode. ([#7962](https://github.com/expo/expo/pull/7962) by [@lukmccall](https://github.com/lukmccall))
- Fixed `permission cannot be null or empty` error when asking for `WRITE_SETTINGS` permission on Android. ([#7276](https://github.com/expo/expo/pull/7276) by [@lukmccall](https://github.com/lukmccall))
- Fixed a rare undetermined behavior that may have been a result of misuse of `dispatch_once_t` on iOS ([#7576](https://github.com/expo/expo/pull/7576) by [@sjchmiela](https://github.com/sjchmiela))
