# Changelog

## Unpublished

### 🛠 Breaking changes

- Rename functions to include `async` suffix. ([#40447](https://github.com/expo/expo/pull/40447) by [@nishan](https://github.com/intergalacticspacehighway))

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.1.8 — 2025-09-22

### 🎉 New features

- [Android] Add Android hardware attestation support. ([#39725](https://github.com/expo/expo/pull/39725) by [@nishan](https://github.com/intergalacticspacehighway))

## 0.1.7 — 2025-09-11

### 🐛 Bug fixes

- [iOS] Fixed `attestKey` and `generateAssertion` methods failing due to improper UTF-8 decoding of binary data. Now returns base64-encoded strings as expected. ([#39566](https://github.com/expo/expo/pull/39566) by [@nishan](https://github.com/intergalacticspacehighway))
