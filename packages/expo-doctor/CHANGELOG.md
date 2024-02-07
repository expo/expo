# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes
- Fixed vulnerability with update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

### 💡 Others

## 1.4.0 — 2024-02-05

### 🎉 New features

- Added a check for expo-permissions in SDK50 as it will break the Android build if present ([#26929](https://github.com/expo/expo/pull/26929) by [@TomOConnor95](https://github.com/TomOConnor95))
- Check if a custom metro config doesn't extend @expo/metro-config. ([#26860](https://github.com/expo/expo/pull/26860) by [@keith-kurak](https://github.com/keith-kurak))
- Look for metro-config in deep dependency check, warn if inside resolutions. ([#26854](https://github.com/expo/expo/pull/26854) by [@keith-kurak](https://github.com/keith-kurak))

## 1.3.0 — 2023-12-15

### 🎉 New features

- Allow skipping dependency version check. ([#25822](https://github.com/expo/expo/pull/25822) by [@floatplane](https://github.com/floatplane))

## 1.2.0 — 2023-12-12

### 💡 Others

- Report if project has unused static config. ([#25674](https://github.com/expo/expo/pull/25674) by [@keith-kurak](https://github.com/keith-kurak))

## 1.1.6 — 2023-12-12

_This version does not introduce any user-facing changes._

## 1.1.5 — 2023-12-06

### 🐛 Bug fixes

- Fix bin command. ([#25672](https://github.com/expo/expo/pull/25672) by [@keith-kurak](https://github.com/keith-kurak))

## 1.1.4 — 2023-11-30

### 💡 Others

- Move package from `expo/expo-cli` to `expo/expo`. ([#25503](https://github.com/expo/expo/pull/25503) by [@keith-kurak](https://github.com/keith-kurak))
