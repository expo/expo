# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Enable relative fetch requests by default. ([#31707](https://github.com/expo/expo/pull/31707) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for CSS in server components. ([#31073](https://github.com/expo/expo/pull/31073) by [@EvanBacon](https://github.com/EvanBacon))
- Add initial version of DOM Components. ([#30938](https://github.com/expo/expo/pull/30938) by [@EvanBacon](https://github.com/EvanBacon))
- Add server HMR for native. ([#30334](https://github.com/expo/expo/pull/30334) by [@EvanBacon](https://github.com/EvanBacon))
- Add streaming fetch polyfill. ([#30334](https://github.com/expo/expo/pull/30334) by [@EvanBacon](https://github.com/EvanBacon))
- Use `src` directory for source code. ([#30300](https://github.com/expo/expo/pull/30300) by [@EvanBacon](https://github.com/EvanBacon))
- Always enable async bundle loading on native. ([#30146](https://github.com/expo/expo/pull/30146) by [@EvanBacon](https://github.com/EvanBacon))
- Support `location.reload()` in native production builds. ([#29572](https://github.com/expo/expo/pull/29572) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix logbox usage on native for router errors. ([#30651](https://github.com/expo/expo/pull/30651) by [@EvanBacon](https://github.com/EvanBacon))
- Update DevLoadingView on native. ([#30606](https://github.com/expo/expo/pull/30606) by [@EvanBacon](https://github.com/EvanBacon))
- Fix metro symbolication issue with web import errors. ([#30544](https://github.com/expo/expo/pull/30544) by [@EvanBacon](https://github.com/EvanBacon))
- Remount the failed component when a refresh event occurs. ([#30544](https://github.com/expo/expo/pull/30544) by [@EvanBacon](https://github.com/EvanBacon))
- Fix web styling bug. ([#30438](https://github.com/expo/expo/pull/30438) by [@EvanBacon](https://github.com/EvanBacon))
- Fix exceptions native import. ([#30433](https://github.com/expo/expo/pull/30433) by [@EvanBacon](https://github.com/EvanBacon))
- Improve error message for `window.location` polyfill. ([#30331](https://github.com/expo/expo/pull/30331) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent `LogBoxStateSubscription` calling `setState` while rendering a `<Suspense />` boundary.

### 💡 Others

- Improve API route errors ([#31485](https://github.com/expo/expo/pull/31485) by [@EvanBacon](https://github.com/EvanBacon))
- Remove downloading indicator for split bundles. ([#30146](https://github.com/expo/expo/pull/30146) by [@EvanBacon](https://github.com/EvanBacon))

## 3.2.3 - 2024-08-14

_This version does not introduce any user-facing changes._

## 3.2.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 3.2.0 — 2024-04-18

### 🎉 New features

- Mark React client components with "use client" directives. ([#27300](https://github.com/expo/expo/pull/27300) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix async loader for web being able to reload the entrypoint bundle. ([#28016](https://github.com/expo/expo/pull/28016) by [@kitten](https://github.com/kitten))

### 💡 Others

- Use `process.env.EXPO_OS` platform env checks to reduce `react-native` imports. ([#27636](https://github.com/expo/expo/pull/27636) by [@EvanBacon](https://github.com/EvanBacon))
- Use `typeof window` checks for removing server code. ([#27514](https://github.com/expo/expo/pull/27514) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.3 - 2024-02-06

### 🎉 New features

- Send platform to Metro. ([#26812](https://github.com/expo/expo/pull/26812) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.2 - 2024-01-23

### 🎉 New features

- Add error handling for Metro build errors in split chunks. ([#26609](https://github.com/expo/expo/pull/26609) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.1 - 2024-01-18

### 🐛 Bug fixes

- Fixed lazy component errors on Android. ([#26464](https://github.com/expo/expo/pull/26464) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2023-12-12

### 🎉 New features

- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Use `build` directory for native usage. ([#25655](https://github.com/expo/expo/pull/25655) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Skip showing "Downloading..." overlay on web. ([#25832](https://github.com/expo/expo/pull/25832) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.4 — 2023-11-14

### 💡 Others

- Improve testing for URL support on native. ([#25240](https://github.com/expo/expo/pull/25240) by [@EvanBacon](https://github.com/EvanBacon))
- Migrate to new standard `URL` support on native. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.3 — 2023-10-17

### 💡 Others

- Update jsx transpilation. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.2 — 2023-09-15

### 🎉 New features

- Enable async code loading in production for web. ([#24291](https://github.com/expo/expo/pull/24291) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Use `DeviceEventEmitter`. ([#24298](https://github.com/expo/expo/pull/24298) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Reduce size on web. ([#24294](https://github.com/expo/expo/pull/24294) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.1 — 2023-09-04

### 🎉 New features

- Tree shake error symbolication code in production. ([#24215](https://github.com/expo/expo/pull/24215) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Use `fixed` position for floating toast. ([#24074](https://github.com/expo/expo/pull/24074) by [@EvanBacon](https://github.com/EvanBacon))
- Fix error overlay not being applied on web. ([#24052](https://github.com/expo/expo/pull/24052) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Transpile down to commonjs for running in Node.js. ([#23871](https://github.com/expo/expo/pull/23871) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.0 — 2023-08-02

_This version does not introduce any user-facing changes._
