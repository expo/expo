# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add support for passing options to `expo/metro-config` -- enables CSS support. ([#22325](https://github.com/expo/expo/pull/22325) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

### 💡 Others

## 2.1.0 — 2023-02-03

### 💡 Others

- Bump `@expo/metro-config`, `@expo/webpack-config`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))

## 2.0.4 — 2022-10-25

_This version does not introduce any user-facing changes._

## 2.0.2 — 2022-07-25

_This version does not introduce any user-facing changes._

## 2.0.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 2.0.0 — 2022-04-18

### 🛠 Breaking changes

- Remove deprecated metro config `blacklistRE` and drop `react-native@<0.64.0` support. ([#16479](https://github.com/expo/expo/pull/16479) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Support looking up .cjs (still the bundler's job to be able to handle these files; EYW just allows them to be found) ([#15836](https://github.com/expo/expo/pull/15836) by [@ide](https://github.com/ide))

### 💡 Others

- Updated `@expo/metro-config` from `4.2.6` to `0.3.7` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))
- Updated `@expo/webpack-config` from `0.16.6` to `0.16.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

## 1.7.0 — 2021-12-03

### 💡 Others

- Update `debug` and `glob` dependencies. ([#15069](https://github.com/expo/expo/pull/15069) by [@Simek](https://github.com/Simek))

## 1.6.0 — 2021-09-28

### 🎉 New features

- Support React Native 0.64 while also maintaining backwards compatibility with 0.63 and earlier. ([#14136](https://github.com/expo/expo/pull/14136) by [@brentvatne](https://github.com/brentvatne))

### 💡 Others

- Update `@expo/metro-config` dependency. ([#14801](https://github.com/expo/expo/pull/14801) by [@Simek](https://github.com/Simek))
- Updated `@expo/metro-config`, `@expo/webpack-config` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 1.5.2 — 2021-06-16

_This version does not introduce any user-facing changes._

## 1.5.1 — 2021-04-20

### 🐛 Bug fixes

- add package files to package.json. ([#12622](https://github.com/expo/expo/pull/12622) by [@ajsmth](https://github.com/ajsmth))

## 1.5.0 — 2021-04-20

### 🎉 New features

- Add `createWebpackConfigAsync` export. ([#12566](https://github.com/expo/expo/pull/12566) by [@ajsmth](https://github.com/ajsmth))

## 1.4.1 — 2021-03-23

### 🎉 New features

- Updated `@expo/metro-config` with deprecated `.expo.*` extension support and improved error stack traces. ([#12252](https://github.com/expo/expo/pull/12252) by [@EvanBacon](https://github.com/EvanBacon))

## 1.4.0 — 2021-03-10

### 🎉 New features

- Extend `expo/metro-config`. ([#11912](https://github.com/expo/expo/pull/11912) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Use junction symlinks on Windows to avoid admin privileges ([#11739](https://github.com/expo/expo/pull/11739) by [@byCedric](https://github.com/byCedric))

## 1.3.1 — 2021-01-08

### 🐛 Bug fixes

- Do not attempt to symlink non-existent packages ([#11567](https://github.com/expo/expo/pull/11567) by [@SimenB](https://github.com/SimenB))
