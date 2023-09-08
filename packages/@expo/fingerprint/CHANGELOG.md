# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
