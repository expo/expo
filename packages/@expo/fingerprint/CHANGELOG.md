# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add silent option. ([#27325](https://github.com/expo/expo/pull/27325) by [@wschurman](https://github.com/wschurman))
- Add debug option to enable verbose debug output. ([#27457](https://github.com/expo/expo/pull/27457) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Fix fingerprint of ios (xcode projects). ([#26901](https://github.com/expo/expo/pull/26901) by [@wschurman](https://github.com/wschurman))
- Fix inconsistent hashes for autolinking. ([#27390](https://github.com/expo/expo/pull/27390) by [@wschurman](https://github.com/wschurman))
- Fixed expo-modules-autolinking sourcer missing some packages on iOS. ([#27442](https://github.com/expo/expo/pull/27442) by [@kudo](https://github.com/kudo))

### 💡 Others

- Remove runtimeVersion from ignore normalization of expo config when policy. ([#27141](https://github.com/expo/expo/pull/27141) by [@wschurman](https://github.com/wschurman))

## 0.6.0 — 2023-12-12

_This version does not introduce any user-facing changes._

## 0.5.0 — 2023-11-27

### 🎉 New features

- Add CLI parameter for diffing with an existing fingerprint file. ([#25565](https://github.com/expo/expo/pull/25565) by [@brentvatne](https://github.com/brentvatne))

### 🐛 Bug fixes

- Fixed an issue that the whole react-native-community autolinking sources are missing when one library does not enable autolinking on a platform. ([#25542](https://github.com/expo/expo/pull/25542) by [@alfonsocj](https://github.com/alfonsocj))

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25420](https://github.com/expo/expo/pull/25420) by [@byCedric](https://github.com/byCedric))

## 0.4.1 — 2023-11-14

_This version does not introduce any user-facing changes._

## 0.4.0 — 2023-10-17

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.0 — 2023-09-20

### 🛠 Breaking changes

- This version includes fingerprint result breaking changes. ([#24520](https://github.com/expo/expo/pull/24520) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Improve fingerprint sourcing scope for local config-plugins. ([#24520](https://github.com/expo/expo/pull/24520) by [@kudo](https://github.com/kudo))

## 0.2.0 — 2023-09-08

### 🛠 Breaking changes

- Normalize Expo config and remove `runtimeVersion` from fingerprint. Note that the fingerprint result will be changed from this version. ([#24290](https://github.com/expo/expo/pull/24290) by [@Kudo](https://github.com/kudo))

### 🎉 New features

- Added `options.ignorePaths` and **.fingerprintignore** to support. ([#24265](https://github.com/expo/expo/pull/24265) by [@Kudo](https://github.com/kudo))

## 0.1.0 — 2023-08-29

### 🛠 Breaking changes

- The fingerprint result is changed since this version. ([24097](https://github.com/expo/expo/pull/24097) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Added `diffFingerprints()` to support diff for two fingerprints. ([24097](https://github.com/expo/expo/pull/24097) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed non-deterministic hash if packages hoisted from monorepo. ([24097](https://github.com/expo/expo/pull/24097) by [@kudo](https://github.com/kudo))
