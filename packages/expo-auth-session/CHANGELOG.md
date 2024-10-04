# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 5.0.2 — 2023-06-28

### 💡 Others

- Remove references to `startAsync` from js doc. ([#23150](https://github.com/expo/expo/pull/23150) by [@alanhughes](https://github.com/alanjhughes))
- Remove unnecessary test. ([#23154](https://github.com/expo/expo/pull/23154) by [@alanhughes](https://github.com/alanjhughes))

## 5.0.1 — 2023-06-24

_This version does not introduce any user-facing changes._

## 5.0.0 — 2023-06-21

### 💡 Others

- Remove all auth proxy APIs. ([#22834](https://github.com/expo/expo/pull/22834) by [@alanhughes](https://github.com/alanjhughes))

## 4.1.0 — 2023-05-08

### 💡 Others

- Added deprecation warning to `promptAsync` when the `useProxy` option is used. ([#21367](https://github.com/expo/expo/pull/21367) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Warn on use of Constants.manifest. ([#22247](https://github.com/expo/expo/pull/22247) by [@wschurman](https://github.com/wschurman))

## 4.0.3 - 2023-02-23

_This version does not introduce any user-facing changes._

## 4.0.2 - 2023-02-21

### 💡 Others

- Deprecated `useProxy` option. ([#21313](https://github.com/expo/expo/pull/21313) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Replaced references of `makeRedirectUriAsync` with `makeRedirectUri`. ([#21314](https://github.com/expo/expo/pull/21314) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 4.0.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 4.0.0 — 2023-02-03

### 💡 Others

- Removed usage of the deprecated `expo-random` package. ([#21063](https://github.com/expo/expo/pull/21063) by [@lukmccall](https://github.com/lukmccall))

## 3.7.2 — 2022-10-25

### 💡 Others

- Update docs to remove mentions of `expo start:web`. ([#18419](https://github.com/expo/expo/pull/18419) by [@EvanBacon](https://github.com/EvanBacon))

## 3.7.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 3.7.0 — 2022-07-07

### 🎉 New features

- Add projectNameForProxy option. ([#17327](https://github.com/expo/expo/pull/17327) by [@wschurman](https://github.com/wschurman))

## 3.6.0 — 2022-04-18

### 💡 Others

- Export provider specific config types: `FacebookAuthRequestConfig` and `GoogleAuthRequestConfig`. ([#16223](https://github.com/expo/expo/pull/16223) by [@Simek](https://github.com/Simek))
- Add missing `language` field to the `GoogleAuthRequestConfig`. ([#16223](https://github.com/expo/expo/pull/16223) by [@Simek](https://github.com/Simek))

## 3.5.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 3.4.1 — 2021-10-01

### 🐛 Bug fixes

- Fixed an import from deprecated `@unimodules/react-native-adapter` package. ([#14585](https://github.com/expo/expo/pull/14585) by [@tsapeta](https://github.com/tsapeta))

## 3.4.0 — 2021-09-28

### 🎉 New features

- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))

## 3.3.0 — 2021-06-16

### 🐛 Bug fixes

- Add new manifest2 field and make existing field optional. ([#12817](https://github.com/expo/expo/pull/12817) by [@wschurman](https://github.com/wschurman))
- Use originalFullName instead of currentFullName ([#12953](https://github.com/expo/expo/pull/12953)) by [@wschurman](https://github.com/wschurman))

## 3.2.3 — 2021-04-13

_This version does not introduce any user-facing changes._

## 3.2.2 — 2021-04-09

### 🎉 New features

- Add support for useProxy in bare workflow. ([#12464](https://github.com/expo/expo/pull/12464) by [@EvanBacon](https://github.com/EvanBacon))

## 3.2.1 — 2021-03-30

_This version does not introduce any user-facing changes._

## 3.2.0 — 2021-03-10

### 🎉 New features

- Use sync random method for PKCE. ([#10298](https://github.com/expo/expo/pull/10298) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))
- Fix dependencies to align with bundledNativeModules.json. ([#12113](https://github.com/expo/expo/pull/12113) by [@brentvatne](https://github.com/brentvatne))

## 3.1.0 — 2021-01-15

_This version does not introduce any user-facing changes._

## 3.0.0 — 2020-12-09

### 🛠 Breaking changes

- Make expo-random a peer dependency. ([#11280](https://github.com/expo/expo/pull/11280) by [@brentvatne](https://github.com/brentvatne))

## 2.0.1 — 2020-11-17

### 🐛 Bug fixes

- Improved mechanism used to determine whether in bare or managed workflow. ([#10993](https://github.com/expo/expo/pull/10993) by [@esamelson](https://github.com/esamelson))

## 2.0.0 — 2020-09-22

_This version does not introduce any user-facing changes._

## 1.5.0 — 2020-08-26

### 🎉 New features

- Create built-in `providers/google` for easy Google auth. ([#9361](https://github.com/expo/expo/pull/9361) by [@EvanBacon](https://github.com/EvanBacon))
- Create built-in `providers/facebook` for easy Facebook auth. ([#9361](https://github.com/expo/expo/pull/9361) by [@EvanBacon](https://github.com/EvanBacon))

## 1.4.2 — 2020-08-18

_This version does not introduce any user-facing changes._

## 1.4.1 — 2020-06-23

### 🎉 New features

- Remove `assert` in favor of `invariant`. ([#8934](https://github.com/expo/expo/pull/8934) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Added custom `Platform.isDOMAvailable` pending `@unimodules/react-native-adapter` update. ([#8934](https://github.com/expo/expo/pull/8934) by [@EvanBacon](https://github.com/EvanBacon))

## 1.4.0 — 2020-06-23

### 🎉 New features

- Added missing `peerDependencies`. ([#8821](https://github.com/expo/expo/pull/8821) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `fbjs` dependency. ([#8821](https://github.com/expo/expo/pull/8821) by [@EvanBacon](https://github.com/EvanBacon))
- Created `ResponseType.IdToken` for id_token responses. ([#8719](https://github.com/expo/expo/pull/8719) by [@EvanBacon](https://github.com/EvanBacon))
- `authorizationEndpoint` and `tokenEndpoint` are now optional. ([#8736](https://github.com/expo/expo/pull/8736) by [@EvanBacon](https://github.com/EvanBacon))
- Added exchange, refresh, and revoke token request methods. ([#8051](https://github.com/expo/expo/pull/8051) by [@EvanBacon](https://github.com/EvanBacon))

## 1.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.3.0 — 2020-05-27

### 🐛 Bug fixes

- Fix `AuthSession.getDefaultReturnUrl()` returning wrong URL while using release channels. ([#7687](https://github.com/expo/expo/pull/7687) by [@lukmccall](https://github.com/lukmccall))
- Fixed a bug where the `useAutoDiscovery()` hook hadn't finished before a component was unmounted. There was no cleanup, so when the fetch request completed, a react state update was attempted on an unmounted component. ([#12491](https://github.com/expo/expo/pull/12491) by [@andrew1601](https://github.com/andrew1601))
