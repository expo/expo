# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Properly support dark/tinted icon variant generation on Apple platforms. ([#30247](https://github.com/expo/expo/pull/30247) by [@fobos531](https://github.com/fobos531))

### 🐛 Bug fixes

### 💡 Others

- Drop `node-fetch` in favor of Node built-in `fetch` for Node 22 support. ([#30554](https://github.com/expo/expo/pull/30554) by [@byCedric](https://github.com/byCedric))
- Drop `tempy` in favor of equivalent code to avoid transitive, deprecated `rimraf` dependency. ([#30832](https://github.com/expo/expo/pull/30832) by [@kitten](https://github.com/kitten))

## 0.5.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 0.5.0 — 2024-04-18

### 🎉 New features

- Expose `createSquareAsync` to generate a square image from a color. ([#27774](https://github.com/expo/expo/pull/27774) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed vulnerability with update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 0.4.1 - 2023-12-19

### 💡 Others

- Remove `mime` package. ([#26005](https://github.com/expo/expo/pull/26005) by [@EvanBacon](https://github.com/EvanBacon))

## 0.4.0 — 2023-12-12

### 💡 Others

- Move package from `expo/expo-cli` to `expo/expo`. ([#25556](https://github.com/expo/expo/pull/25556) by [@byCedric](https://github.com/byCedric))
