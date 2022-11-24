# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.4.1 — 2022-11-24

### 🐛 Bug fixes

- Fixed `extraProguardRules` be overwritten from multiple `withBuildProperties` execution. ([#20106](https://github.com/expo/expo/pull/20106) by [@kudo](https://github.com/kudo))

## 0.4.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.0 — 2022-07-07

### 🎉 New features

- Add `android.minSdkVersion` to override the minimum required Android SDK version. ([#17647](https://github.com/expo/expo/pull/17647) by [@Kudo](https://github.com/Kudo))
