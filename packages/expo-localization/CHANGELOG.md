# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- `Localization.region` changed from `undefined | string` to `null | string` on web to match iOS. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added doc blocks for everything. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for SSR environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- `Localization.isRTL` defaults to `false` in node environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- `Localization.region` now returns `null` when a partial `locale` is defined by the browser on web. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `Localization.locale` throwing an exception on the iOS simulator. ([#8193](https://github.com/expo/expo/pull/8193) by [@lukmccall](https://github.com/lukmccall))
