# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fix missing `await` syntax that was causing build error for `android.adapative.monochromeImage` field, if specified in `app.json`. [#22000](https://github.com/expo/expo/pull/22000) by [@amandeepmittal](https://github.com/amandeepmittal))

### 💡 Others

- Update tests to use latest Expo template. ([#21339](https://github.com/expo/expo/pull/21339) by [@EvanBacon](https://github.com/EvanBacon))
- Update build files. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))
- Bump `xml2js` from `0.4.23` to `0.5.0` in `@expo/prebuild-config` to patch security vulnerability. ([#22071](https://github.com/expo/expo/pull/22071) by [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates) and [cheng-alvin](https://github.com/cheng-alvin))

## 6.0.0 — 2023-02-03

### 🛠 Breaking changes

- Removed deprecated facebook types and plugins. ([#21018](https://github.com/expo/expo/pull/21018) by [@byCedric](https://github.com/expo/expo/pull/21018))

### 🎉 New features

- Switch default JS engine to Hermes. ([#21001](https://github.com/expo/expo/pull/21001) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Bump `@expo/json-file`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
- Removed warning about the (deprecated property) `expo.ios.splash.xib` being unsupported. ([#20377](https://github.com/expo/expo/pull/20377) by [@EvanBacon](https://github.com/EvanBacon))
- Fix tests. ([#20379](https://github.com/expo/expo/pull/20379) by [@EvanBacon](https://github.com/EvanBacon))
