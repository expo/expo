# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

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
