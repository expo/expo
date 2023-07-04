# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 14.2.1 — 2023-07-04

_This version does not introduce any user-facing changes._

## 14.2.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 14.1.2 — 2023-05-08

_This version does not introduce any user-facing changes._

## 14.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 14.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 14.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 13.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 13.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 13.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 13.0.1 — 2021-10-01

### 💡 Others

- Updated `@testing-library/react-hooks` to version `7.0.1`. ([#14552](https://github.com/expo/expo/pull/14552)) by [@Simek](https://github.com/Simek))

## 13.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 12.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Migrated from `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))

## 12.0.1 — 2021-04-13

### 🐛 Bug fixes

- Guard updating hook state on unmounted components. ([#12482](https://github.com/expo/expo/pull/12482) by [@EvanBacon](https://github.com/EvanBacon))

## 12.0.0 — 2021-03-10

### 🛠 Breaking changes

- Splitting location permissions into `Foreground` and `Background` permissions. ([#12063](https://github.com/expo/expo/pull/12063) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 11.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 10.0.0 — 2020-11-17

### 🛠 Breaking changes

- Make background location an opt-in permission on Android. ([#10989](https://github.com/expo/expo/pull/10989) by [@bycedric](https://github.com/bycedric))
- Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))

## 9.3.0 — 2020-08-18

### 🛠 Breaking changes

- Fixed motion permission bug on web. ([#9670](https://github.com/expo/expo/pull/9670) by [@EvanBacon](https://github.com/EvanBacon))

## 9.2.0 — 2020-08-11

### 🎉 New features

- Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))

## 9.1.0 — 2020-07-27

### 🎉 New features

- Add `usePermissions` hook to simplify permission handling. ([#8788](https://github.com/expo/expo/pull/8788) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Ensure browser globals `DeviceMotionEvent` and `DeviceOrientationEvent` exist before attempting to read from them. ([#9236](https://github.com/expo/expo/pull/9236) by [@evanbacon](https://github.com/evanbacon))
- Fixed `askAsync` rejecting with `permission cannot be null or empty` in the bare workflow. ([#8910](https://github.com/expo/expo/pull/8910) by [@lukmccall](https://github.com/lukmccall))
- Fixed `getPermissionsAsync` returning incorrect status in the Expo Client app on iOS. ([#9060](https://github.com/expo/expo/pull/9060) by [@lukmccall](https://github.com/lukmccall))
- Remove require cycle for `usePermissions` hook. ([#9219](https://github.com/expo/expo/pull/9219) by [@EvanBacon](https://github.com/EvanBacon))

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
