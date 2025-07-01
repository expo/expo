# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 7.1.5 — 2025-07-01

### 💡 Others

- [iOS] Refactor deprecated code ([#36714](https://github.com/expo/expo/pull/36714) by [@hirbod](https://github.com/hirbod))
- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 7.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 7.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 7.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 7.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 7.1.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 7.0.1 - 2025-01-10

_This version does not introduce any user-facing changes._

## 7.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840), [#30860](https://github.com/expo/expo/pull/30860) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [iOS] fix ClipboardPasteButton asking for paste permission ([#30623](https://github.com/expo/expo/pull/30623) by [@vonovak](https://github.com/vonovak))
- Fixed issue when copying PNG images on Android. ([#29629](https://github.com/expo/expo/pull/29629) by [@weslley75](https://github.com/weslley75))
- Add missing `react`/`react-native` peer dependencies for isolated modules. ([#30463](https://github.com/expo/expo/pull/30463) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Standardized Babel configuration to use `expo-module-scripts`. ([#31915](https://github.com/expo/expo/pull/31915) by [@reichhartd](https://github.com/reichhartd))

## 6.0.3 — 2024-05-01

_This version does not introduce any user-facing changes._

## 6.0.2 — 2024-04-24

### 💡 Others

- Update mocks for SDK51. ([#28424](https://github.com/expo/expo/pull/28424) by [@aleqsio](https://github.com/aleqsio))

## 6.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 6.0.0 — 2024-04-18

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Rename `CornerStyle` and `DisplayMode` types to include `Type` suffix in name. ([#27190](https://github.com/expo/expo/pull/27190) by [@simek](https://github.com/simek))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 5.0.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 5.0.0 — 2023-12-12

### 🐛 Bug fixes

- [Android] Fix path traversal vulnerability in `getFileForUri` function. ([#25549](https://github.com/expo/expo/pull/25549) by [@behenate](https://github.com/behenate))

## 4.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 4.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 💡 Others

- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 4.6.0 — 2023-09-15

_This version does not introduce any user-facing changes._

## 4.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 4.4.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 4.3.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `robolectric` to `4.10`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- On iOS, added native `ClipboardPasteButton` view that uses `UIPasteControl`. ([#22823](https://github.com/expo/expo/pull/22823) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 4.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 4.1.2 - 2023-03-03

### 🐛 Bug fixes

- Fixed crash in clipboard listener on Android SDK <26 ([#21383](https://github.com/expo/expo/pull/21383) by [@frw](https://github.com/frw))

## 4.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 4.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 4.0.2 — 2022-12-30

### 🐛 Bug fixes

- Fixed the `ImageFormat` or the `StringFormat` not working in the release builds on Android. ([#20155](https://github.com/expo/expo/pull/20155) by [@lukmccall](https://github.com/lukmccall))

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
