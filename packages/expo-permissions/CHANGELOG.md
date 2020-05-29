# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.0.1 — 2020-05-29

### 🎉 New features

- If permission is not recognized, show the correct expo package to link. ([#8546])(https://github.com/expo/expo/pull/8046) by [@jarvisluong](https://github.com/jarvisluong)

## 9.0.0 — 2020-05-28

### 🛠 Breaking changes

- Removed support for fetching notifications-related permissions (they have been moved to `expo-notifications` package). You no longer will be able to call `getAsync` or `askAsync` with `.NOTIFICATIONS` or `.USER_FACING_NOTIFICATIONS` without having `expo-notifications` package installed. ([#8486](https://github.com/expo/expo/pull/8486) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- Fixed `Permissions.NOTIFICATIONS` was granted even if notifications were disabled. ([#8539](https://github.com/expo/expo/pull/8539) by [@lukmccall](https://github.com/lukmccall))

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fix permissions in the headless mode. ([#7962](https://github.com/expo/expo/pull/7962) by [@lukmccall](https://github.com/lukmccall))
- Fixed `permission cannot be null or empty` error when asking for `WRITE_SETTINGS` permission on Android. ([#7276](https://github.com/expo/expo/pull/7276) by [@lukmccall](https://github.com/lukmccall))
- Fixed a rare undetermined behavior that may have been a result of misuse of `dispatch_once_t` on iOS ([#7576](https://github.com/expo/expo/pull/7576) by [@sjchmiela](https://github.com/sjchmiela))
