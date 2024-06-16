# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 6.3.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 6.3.0 — 2024-04-18

_This version does not introduce any user-facing changes._

## 6.2.2 - 2024-01-12

_This version does not introduce any user-facing changes._

## 6.2.1 — 2023-12-12

_This version does not introduce any user-facing changes._

## 6.2.0 — 2023-11-14

### 💡 Others

- Migrate to new standard `URL` support on native. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

## 6.1.1 — 2023-10-17

_This version does not introduce any user-facing changes._

## 6.1.0 — 2023-09-15

### 🛠 Breaking changes

- Remove deprecated `makeUrl` function. ([#24300](https://github.com/expo/expo/pull/24300) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix parsing web URLs with `+` symbols in the pathname. ([#24300](https://github.com/expo/expo/pull/24300) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Reduce bundle size on web. ([#24300](https://github.com/expo/expo/pull/24300) by [@EvanBacon](https://github.com/EvanBacon))

## 6.0.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 5.0.2 — 2023-06-24

_This version does not introduce any user-facing changes._

## 5.0.1 — 2023-06-22

_This version does not introduce any user-facing changes._

## 5.0.0 — 2023-06-21

### 🛠 Breaking changes

- Drop support for `detach.scheme` schemes (ExpoKit). ([#22848](https://github.com/expo/expo/pull/22848) by [@EvanBacon](https://github.com/EvanBacon))

## 4.1.0 — 2023-05-08

### 💡 Others

- Warn on use of Constants.manifest. ([#22247](https://github.com/expo/expo/pull/22247) by [@wschurman](https://github.com/wschurman))

## 4.0.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 4.0.0 — 2023-02-03

### 🛠 Breaking changes

- Removed the deprecated `Linking.removeEventListener`. ([#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 💡 Others

- Fix link in README that was incorrectly pointing to to expo-asset. ([#20616](https://github.com/expo/expo/pull/20616) by [@stereoplegic](https://github.com/stereoplegic))

## 3.3.1 — 2023-02-27

### 🐛 Bug fixes

- Fixed crash when calling `Linking.removeEventListener` and added warning about `Linking.removeEventListener` being removed from react-native. ([#21371](https://github.com/expo/expo/pull/21371) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.2.3 — 2022-10-25

### 🐛 Bug fixes

- Recognize EAS Updates (u.expo.dev) URL's as Expo-hosted so `createURL` can make a valid default URL for expo-auth-session ([#19258](https://github.com/expo/expo/pull/19258) by [@confraria](https://github.com/confraria)) and [@keith-kurak](https://github.com/keith-kurak))

### 💡 Others

- Update docs link. ([#18935](https://github.com/expo/expo/pull/18935) by [@EvanBacon](https://github.com/EvanBacon))

## 3.2.2 — 2022-07-25

_This version does not introduce any user-facing changes._

## 3.2.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 3.2.0 — 2022-07-07

### 🐛 Bug fixes

- Fix bug in isExpoHosted for new manifests. ([#17402](https://github.com/expo/expo/pull/17402) by [@wschurman](https://github.com/wschurman))
- Fix `addEventListener` not returning a subscription on web. ([#17925](https://github.com/expo/expo/pull/17925) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.0 — 2022-04-18

### 🎉 New features

- `addEventListener` returns `EmitterSubscription` rather than `void` ([#17014](https://github.com/expo/expo/pull/17014) by [@frankcalise](https://github.com/frankcalise))

### 🐛 Bug fixes

- `addEventListener` and `removeEventListener` only accept `'url'` as `type` param, rather than `string`
- `useURL` hook now cleans up `addEventListener` via `remove` rather than `removeEventListener` ([#17014](https://github.com/expo/expo/pull/17014) by [@frankcalise](https://github.com/frankcalise))

### 💡 Others

- Export public `Schemes` methods in main file. ([#17058](https://github.com/expo/expo/pull/17058) by [@Simek](https://github.com/Simek))

## 3.0.0 — 2021-12-03

### 🛠 Breaking changes

- Remove deprecated `useUrl` method. ([#15226](https://github.com/expo/expo/pull/15226) by [@Simek](https://github.com/Simek))

### 💡 Others

- Update `qs` dependency. ([#15069](https://github.com/expo/expo/pull/15069) by [@Simek](https://github.com/Simek))
- Extract `sendIntent` method `extras` parameter to the separate type named `SendIntentExtras`. ([#15226](https://github.com/expo/expo/pull/15226) by [@Simek](https://github.com/Simek))

## 2.4.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 2.4.0 — 2021-09-09

### 🎉 New features

- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))

## 2.3.0 — 2021-06-16

### 🐛 Bug fixes

- Fix accidental condition that caused AuthSession Google Provider to error when no scheme in Expo Go. ([#12846](https://github.com/expo/expo/pull/12846) by [@brentvatne](https://github.com/brentvatne))
- Add new manifest2 field and make existing field optional. ([#12817](https://github.com/expo/expo/pull/12817) by [@wschurman](https://github.com/wschurman))

## 2.2.3 — 2021-04-13

_This version does not introduce any user-facing changes._

## 2.2.2 — 2021-04-09

### 🎉 New features

- Add internal ability to skip warnings for scheme resolution. ([#12464](https://github.com/expo/expo/pull/12464) by [@EvanBacon](https://github.com/EvanBacon))

## 2.2.1 — 2021-03-30

### 🐛 Bug fixes

- Replace useUrl with useURL and update documentation. ([#12310](https://github.com/expo/expo/pull/12310) by [@brentvatne](https://github.com/brentvatne))

## 2.2.0 — 2021-03-10

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 2.1.1 — 2021-01-21

### 🎉 New features

- Added bare workflow support. ([#11560](https://github.com/expo/expo/pull/11560) by [@EvanBacon](https://github.com/EvanBacon))
- `Linking.createURL` creates URLs with two slashes in bare workflow. ([#11702](https://github.com/expo/expo/pull/11702) by [@EvanBacon](https://github.com/EvanBacon))

## 2.1.0 — 2021-01-15

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))

## 2.0.0 — 2020-12-08

_This version does not introduce any user-facing changes._

## 1.0.6 — 2020-11-17

### 🐛 Bug fixes

- Improved mechanism used to determine whether in bare or managed workflow. ([#10993](https://github.com/expo/expo/pull/10993) by [@esamelson](https://github.com/esamelson))

## 1.0.5 — 2020-10-22

### 🐛 Bug fixes

- Prevent crash in bare workflow if `Constants.manifest` isn't defined.

## 1.0.4 — 2020-08-18

_This version does not introduce any user-facing changes._

## 1.0.3 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.0.2 — 2020-05-27

_This version does not introduce any user-facing changes._
