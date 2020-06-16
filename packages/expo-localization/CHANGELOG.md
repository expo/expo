# Changelog

## Unpublished

### 🛠 Breaking changes

- `Localization.region` changed from `undefined | string` to `null | string` on web to match iOS.

### 🎉 New features

- Added doc blocks for everything.
- Added support for SSR environments.
- `Localization.isRTL` defaults to `false` in node environments.

### 🐛 Bug fixes

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `Localization.locale` throwing an exception on the iOS simulator. ([#8193](https://github.com/expo/expo/pull/8193) by [@lukmccall](https://github.com/lukmccall))
