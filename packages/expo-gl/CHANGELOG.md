# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.1.1 — 2020-08-26

### 🎉 New features

- Enable stencil buffer on Android ([#9928](https://github.com/expo/expo/pull/9928) by [@wkozyra95](https://github.com/wkozyra95))

## 9.1.0 — 2020-08-18

### 🐛 Bug fixes

- Fix bug preventing GLView from rendering in SSR environments. ([#9691](https://github.com/expo/expo/pull/9691) by [@EvanBacon](https://github.com/EvanBacon))

## 9.0.0 — 2020-08-11

### 🛠 Breaking changes

- This version requires at least version 0.63.0 of React Native. It may crash when used with older versions. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))

### 🎉 New features

- Full rewrite of expo-gl-cpp, migration to JSI. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))
- Introduced compatibility with Hermes, however you should treat this feature as unstable so use it with Hermes at your own risk. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))

## 8.4.0 — 2020-07-17

### 🐛 Bug fixes

- Delete `prop-types` in favor of TypeScript. ([#8675](https://github.com/expo/expo/pull/8675) by [@EvanBacon](https://github.com/EvanBacon))
- Fix crashes on iOS14 caused by different integer representation in the new JSC. ([#9226](https://github.com/expo/expo/pull/9226) by [@wkozyra95](https://github.com/wkozyra95))

## 8.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-05-27

_This version does not introduce any user-facing changes._

## 8.2.0

### 🎉 New features

- Improved logging and added some more logging options. ([#7550](https://github.com/expo/expo/pull/7550) by [@tsapeta](https://github.com/tsapeta))
- Add WebP format as an option when taking GL snapshots (Android only). ([#7490](https://github.com/expo/expo/pull/7490) by [@pacoelayudante](https://github.com/pacoelayudante))

### 🐛 Bug fixes

- Fix `createElement` import error introduced in [#7995](https://github.com/expo/expo/pull/7995) - `react-native-web@0.12` ([#8671](https://github.com/expo/expo/pull/8671) by [@EvanBacon](https://github.com/EvanBacon))
- Fix crash in React Native 0.62 when creating a context. ([#8352](https://github.com/expo/expo/pull/8352) by [@wkozyra95](https://github.com/wkozyra95))
- Allow createElement & unstable_createElement usage for web. ([#7995](https://github.com/expo/expo/pull/7995) by [@wood1986](https://github.com/wood1986))
- Fix depth/stencil buffers not working correctly with `three.js`. ([#7543](https://github.com/expo/expo/pull/7543) by [@tsapeta](https://github.com/tsapeta))
