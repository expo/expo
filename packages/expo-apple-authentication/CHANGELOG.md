# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
