# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fix screenshot listener not being called on Android 34. ([#26549](https://github.com/expo/expo/pull/26549) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Native module on iOS is now written in Swift using the Sweet API. ([#26103](https://github.com/expo/expo/pull/26103) by [@fobos531](https://github.com/fobos531))

## 5.8.0 — 2023-12-15

### 🎉 New features

- Added `getPermissionsAsync` and `requestPermissionsAsync` methods. ([#25849](https://github.com/expo/expo/pull/25849) by [@behenate](https://github.com/behenate))

## 5.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 5.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 5.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 5.4.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 5.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 5.2.0 — 2023-05-08

### 🎉 New features

- On Android, migrated to Expo Modules API. ([#22208](https://github.com/expo/expo/pull/22208) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 5.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 5.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 5.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 4.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 4.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 4.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 4.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Export missing `Subscription` type. ([#13352](https://github.com/expo/expo/pull/13352) by [@Simek](https://github.com/Simek))

## 3.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Added `isAvailableAsync` method. ([#12121](https://github.com/expo/expo/pull/12121) by [@bycedric](https://github.com/bycedric))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.0.0 — 2020-11-17

### 🛠 Breaking changes

- Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))

## 1.1.1 — 2020-08-20

_This version does not introduce any user-facing changes._

## 1.1.0 — 2020-08-18

### 🎉 New features

- Added `addScreenshotListener` and `removeScreenshotListener` methods so you can take action in your app whenever a user takes a screenshot. ([#9747](https://github.com/expo/expo/pull/9747) by [@cruzach](https://github.com/cruzach))

## 1.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.0.0 — 2020-05-27

### 🎉 New features

- Initial release of `expo-screen-capture` module with support for preventing screen capture on iOS and Android ([#8326](https://github.com/expo/expo/pull/8326) by [@cruzach](https://github.com/cruzach))
