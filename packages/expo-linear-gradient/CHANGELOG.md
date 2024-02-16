# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.7.2 — 2024-02-16

### 🎉 New features

- Added support for Apple tvOS. ([#26965](https://github.com/expo/expo/pull/26965) by [@douglowder](https://github.com/douglowder))

## 12.7.1 — 2024-01-23

### 💡 Others

- On `Android`, remove type annotation on `View`. ([#26545](https://github.com/expo/expo/pull/26545) by [@alanjhughes](https://github.com/alanjhughes))

## 12.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 12.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 💡 Others

- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 12.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 12.4.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.1.2 - 2023-03-08

### 🐛 Bug fixes

- Fixed crashes when R8 or Proguard is enabled. ([#21580](https://github.com/expo/expo/pull/21580) by [@kudo](https://github.com/kudo))

## 12.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.0.1 — 2022-11-02

_This version does not introduce any user-facing changes._

## 12.0.0 — 2022-10-25

### 🐛 Bug fixes

- Fix default start and end points on Android. ([#19460](https://github.com/expo/expo/pull/19460) by [@tsapeta](https://github.com/tsapeta))

## 12.0.0-beta.1 — 2022-10-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 11.4.0 — 2022-07-07

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 11.3.0 — 2022-04-18

### 🐛 Bug fixes

- Extract `react-native-web` internals into package to minimize bundler setup. ([#16098](https://github.com/expo/expo/pull/16098) by [@EvanBacon](https://github.com/EvanBacon))
- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))
- Fixed the component not rendering correctly when the border radius style is set. ([#16671](https://github.com/expo/expo/pull/16671) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.2.0 — 2022-01-26

### 🐛 Bug fixes

- Fix display issue on iOS when more than 2 colors are used without explicit locations. ([#15955](https://github.com/expo/expo/pull/15955) by [@kbrandwijk](https://github.com/kbrandwijk))

## 11.1.0 — 2022-01-26

### 🐛 Bug fixes

- Prevent crashes by adding unimplemented `CALayer` initializer `init(layer:)`. ([#15843](https://github.com/expo/expo/pull/15843) by [@dillonhafer](https://github.com/dillonhafer))

## 11.0.3 — 2022-02-06

### 🐛 Bug fixes

- Prevent crashes by adding unimplemented `CALayer` initializer `init(layer:)`. ([#15843](https://github.com/expo/expo/pull/15843) by [@dillonhafer](https://github.com/dillonhafer))

## 11.0.2 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.0.1 — 2022-01-27

### 🐛 Bug fixes

- Fix display issue on iOS when more than 2 colors are used without explicit locations. ([#15955](https://github.com/expo/expo/pull/15955) by [@kbrandwijk](https://github.com/kbrandwijk))

## 11.0.0 — 2021-12-03

### 💡 Others

- Rewrote code to Swift, removed legacy Objective-C module implementation and changed the pod name to `ExpoLinearGradient`. ([#15168](https://github.com/expo/expo/pull/15168) by [@tsapeta](https://github.com/tsapeta))
- Rewrote module using Sweet API on Android. ([#15166](https://github.com/expo/expo/pull/15166) by [@lukmccall](https://github.com/lukmccall))

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 9.3.0-alpha.0 — 2021-08-17

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. (by [@tsapeta](https://github.com/tsapeta))
- Experimental Swift implementation using Sweet API. (by [@tsapeta](https://github.com/tsapeta))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 9.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.4.0 — 2020-11-25

### 🐛 Bug fixes

- Revert to class component. ([#11111](https://github.com/expo/expo/pull/11111) by [@EvanBacon](https://github.com/EvanBacon))

## 8.3.1 — 2020-09-23

### 🐛 Bug fixes

- Added `children` property to `LinearGradient` component ([#10227](https://github.com/expo/expo/pull/10227) by [@sjchmiela](https://github.com/sjchmiela))

## 8.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.2.2 — 2020-07-29

### 🎉 New features

- Remove `prop-types` ([#8681](https://github.com/expo/expo/pull/8681) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Renamed type export `LinearGradienPoint` to `LinearGradientPoint`. ([#8673](https://github.com/expo/expo/pull/8673) by [@EvanBacon](https://github.com/EvanBacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
