# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 8.2.1 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-08-18

### 🎉 New features

- Add `useAssets` hook to simplify assets handling. ([#8928](https://github.com/expo/expo/pull/8928) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fixed `Asset.loadAsync()` TypeScript signature to match `Asset.fromModule()` types. ([#9246](https://github.com/expo/expo/pull/9246) by [@barthap](https://github.com/barthap))

## 8.1.7 — 2020-05-29

*This version does not introduce any user-facing changes.*

## 8.1.6 — 2020-05-27

*This version does not introduce any user-facing changes.*

## 8.1.5

### 🎉 New features

- `asset.downloadAsync()` returns the resolved `Asset` when it resolves. ([#8646](https://github.com/expo/expo/pull/8646) by [@EvanBacon](https://github.com/EvanBacon))
- `Asset.loadAsync()` returns an array of resolved `Asset`s when it finishes loading the resources. ([#8646](https://github.com/expo/expo/pull/8646) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for the `expo-updates` **no-publish workflow**. ([#8003](https://github.com/expo/expo/pull/8003) by [@esamelson](https://github.com/esamelson))
