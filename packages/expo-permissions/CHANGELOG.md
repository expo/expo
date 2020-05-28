# Changelog

## Unpublished

### 🛠 Breaking changes

- Removed support for fetching notifications-related permissions (they have been moved to `expo-notifications` package). You no longer will be able to call `getAsync` or `askAsync` with `.NOTIFICATIONS` or `.USER_FACING_NOTIFICATIONS` without having `expo-notifications` package installed. ([#8486](https://github.com/expo/expo/pull/8486) by [@sjchmiela](https://github.com/sjchmiela))

### 🎉 New features

### 🐛 Bug fixes

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fix permissions in the headless mode. ([#7962](https://github.com/expo/expo/pull/7962) by [@lukmccall](https://github.com/lukmccall))
- Fixed `permission cannot be null or empty` error when asking for `WRITE_SETTINGS` permission on Android. ([#7276](https://github.com/expo/expo/pull/7276) by [@lukmccall](https://github.com/lukmccall))
- Fixed a rare undetermined behavior that may have been a result of misuse of `dispatch_once_t` on iOS ([#7576](https://github.com/expo/expo/pull/7576) by [@sjchmiela](https://github.com/sjchmiela))
