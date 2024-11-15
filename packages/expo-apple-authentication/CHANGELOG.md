# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 7.1.1 — 2024-11-15

_This version does not introduce any user-facing changes._

## 7.1.0 — 2024-11-14

### 🎉 New features

- Add `formatFullName` method to format tokenized full name object into a local-aware string representation ([#32567](https://github.com/expo/expo/pull/32567) by [@Armster15](https://github.com/Armster15))

## 7.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 7.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Add missing `react-native` peer dependency. ([#30573](https://github.com/expo/expo/pull/30573) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))

## 6.4.2 - 2024-07-22

### 💡 Others

- Handle new error code on `iOS` 18. ([#29639](https://github.com/expo/expo/pull/29639) by [@alanjhughes](https://github.com/alanjhughes))

## 6.4.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 6.4.0 — 2024-04-18

_This version does not introduce any user-facing changes._

## 6.3.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 6.2.0 — 2023-10-17

### 💡 Others

- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 6.1.2 — 2023-09-04

_This version does not introduce any user-facing changes._

## 6.1.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 6.1.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 6.0.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 6.0.0 — 2023-02-03

### 🎉 New features

- Migrated to Expo Modules API and Swift. ([#20600](https://github.com/expo/expo/pull/20600) by [@tsapeta](https://github.com/tsapeta))
- Added support for Fabric. ([#20600](https://github.com/expo/expo/pull/20600) by [@tsapeta](https://github.com/tsapeta))

## 5.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 5.0.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 4.3.0 — 2022-07-07

### 🐛 Bug fixes

- Android: Warnings about `new NativeEventEmitter()` no longer appear when using React Native v0.65+. ([#17343](https://github.com/expo/expo/pull/17343) by [@chrisbobbe](https://github.com/chrisbobbe))

## 4.2.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

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

- Extend the `AppleAuthenticationButton` component type by the `View` component type. ([#13567](https://github.com/expo/expo/pull/13567) by [@Simek](https://github.com/Simek))
- Exclude `backgroundColor` and `borderRadius` properties from the `AppleAuthenticationButton`'s style prop. These two are invalid for `AppleAuthenticationButton`, but TypeScript allowed the usage of them; instead use `buttonStyle` and `cornerRadius` props repsectively. ([#13567](https://github.com/expo/expo/pull/13567) by [@Simek](https://github.com/Simek))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 3.2.0 — 2021-06-16

### 🎉 New features

- [plugin] Apply entitlements regardless of `ios.usesAppleSignIn`, add support for locales ([#12927](https://github.com/expo/expo/pull/12927) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.0 — 2021-03-10

### 🎉 New features

- Created config plugin ([#11979](https://github.com/expo/expo/pull/11979) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.2.2 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

### 🎉 New features

- Add 'Sign up with Apple' option (available as of iOS 13.2). ([#7471](https://github.com/expo/expo/pull/7471) by [@IjzerenHein](https://github.com/IjzerenHein))
