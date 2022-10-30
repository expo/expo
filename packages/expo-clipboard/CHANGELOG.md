# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 4.0.1 — 2022-10-30

### 🐛 Bug fixes

- Fixed clipboard listener is called twice on Android. ([#19723](https://github.com/expo/expo/pull/19723) by [@lukmccall](https://github.com/lukmccall))
- Fixed clipboard listener can crash the application during initialization on Android. ([#19723](https://github.com/expo/expo/pull/19723) by [@lukmccall](https://github.com/lukmccall))

## 4.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 3.1.0 — 2022-07-07

### 🐛 Bug fixes

- Fixed clipboard listener returning invalid `contentTypes` value for images on Android. ([#17644](https://github.com/expo/expo/pull/17644) by [@barthap](https://github.com/barthap))
- Fixed `setStringAsync` causing bouncing in Safari. ([#18010](https://github.com/expo/expo/pull/18010) by [@barthap](https://github.com/barthap))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))
- Migrated Android module to use Sweet API coroutines. ([#18036](https://github.com/expo/expo/pull/18036) by [@barthap](https://github.com/barthap))

## 3.0.1 — 2022-04-20

### 🐛 Bug fixes

- Fixed `setStringAsync` crashing when setting HTML content on web. ([#17115](https://github.com/expo/expo/pull/17115) by [@barthap](https://github.com/barthap))

## 3.0.0 — 2022-04-18

### 🛠 Breaking changes

- The `content` property of the clipboard event listener is now deprecated and always returns empty string and logs a warning message to the console. Use `getStringAsync()` instead.

### 🎉 New features

- Native module on Android is now written in Kotlin using the new API. ([#16269](https://github.com/expo/expo/pull/16269) by [@barthap](https://github.com/barthap))
- Added support for setting and getting images (`setImageAsync`, `hasImageAsync`, `getImageAsync`). ([#16391](https://github.com/expo/expo/pull/16391), [#16413](https://github.com/expo/expo/pull/16413), [#16481](https://github.com/expo/expo/pull/16481) by [@barthap](https://github.com/barthap))
- On iOS added support for setting and getting URLs (`setUrlAsync`, `hasUrlAsync`, `getUrlAsync`). ([#16391](https://github.com/expo/expo/pull/16391) by [@graszka22](https://github.com/graszka22), [@barthap](https://github.com/barthap))
- Added new method `hasStringAsync` that checks whether clipboard has text content. ([#16524](https://github.com/expo/expo/pull/16524) by [@barthap](https://github.com/barthap))
- Added support for HTML content in `getStringAsync` and `setStringAsync`. ([#16551](https://github.com/expo/expo/pull/16551), [#16687](https://github.com/expo/expo/pull/16687) by [@barthap](https://github.com/barthap))
- Added new property `contentTypes` to the clipboard event listener describing contents of the clipboard. ([#16787](https://github.com/expo/expo/pull/16787) by [@barthap](https://github.com/barthap))

### ⚠ Notices

- Deprecated `setString`. Use `setStringAsync` instead. ([#16320](https://github.com/expo/expo/pull/16320) by [@barthap](https://github.com/barthap))
- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 2.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 2.1.0 — 2021-12-03

### 🎉 New features

- Native module on iOS is now written in Swift using [Sweet API](https://blog.expo.dev/a-peek-into-the-upcoming-sweet-expo-module-api-6de6b9aca492). ([#14959](https://github.com/expo/expo/pull/14959) by [@tsapeta](https://github.com/tsapeta))

## 2.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 2.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Clean up Android code. ([#13517](https://github.com/expo/expo/pull/13517) by [@mstach60161](https://github.com/mstach60161))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 1.1.0 — 2021-06-16

### 🎉 New features

- Added Clipboard event listener ([#13050](https://github.com/expo/expo/pull/13050) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fixed `getStringAsync` causing crashes on Web when an exception is thrown. ([#12494](https://github.com/expo/expo/pull/12494) by [@robertherber](https://github.com/robertherber))
- Fixed newlines not being copied on web. ([#12951](https://github.com/expo/expo/pull/12951) by [@cruzach](https://github.com/cruzach))

## 1.0.2 — 2021-03-23

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 1.0.1 — 2020-12-08

_This version does not introduce any user-facing changes._

## 1.0.0 — 2020-12-07

### 🐛 Bug fixes

_This version does not introduce any user-facing changes._
