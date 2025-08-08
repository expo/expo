# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Mock Expo's default async-require messaging socket. ([#37524](https://github.com/expo/expo/pull/37524) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Change the `global.expo` polyfill to work with package exports and be more explicit. ([#37588](https://github.com/expo/expo/pull/37588) by [@EvanBacon](https://github.com/EvanBacon))
- add experimental link preview ([#37336](https://github.com/expo/expo/pull/37336) by [@Ubax](https://github.com/Ubax))
- Add ExpoFont to ignorelist. ([#37736](https://github.com/expo/expo/pull/37736) by [@aleqsio](https://github.com/aleqsio))
- Update mocks for SDK54. ([#38679](https://github.com/expo/expo/pull/38679) by [@alanjhughes](https://github.com/alanjhughes))

## 53.0.9 - 2025-07-03

_This version does not introduce any user-facing changes._

## 53.0.8 - 2025-07-01

_This version does not introduce any user-facing changes._

## 53.0.7 - 2025-06-06

_This version does not introduce any user-facing changes._

## 53.0.6 - 2025-06-04

### 🐛 Bug fixes

- Fix `requireOptionalNativeModule` throwing error if mock is missing. ([#36839](https://github.com/expo/expo/pull/36839) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- Fix ES6 import syntax inconsistency in setup.js by converting to CommonJS require. ([#37240](https://github.com/expo/expo/pull/37240) by [@huextrat](https://github.com/huextrat))
- Rework mock generation for expo modules. ([#36677](https://github.com/expo/expo/pull/36677) by [@aleqsio](https://github.com/aleqsio))

## 53.0.5 — 2025-05-06

_This version does not introduce any user-facing changes._

## 53.0.4 — 2025-05-02

### 🐛 Bug fixes

- Add ExpoFontUtils mock ([#36585](https://github.com/expo/expo/pull/36585) by [@brentvatne](https://github.com/brentvatne))

## 53.0.3 — 2025-05-01

_This version does not introduce any user-facing changes._

## 53.0.2 — 2025-04-30

_This version does not introduce any user-facing changes._

## 53.0.1 — 2025-04-28

### 🎉 New features

- add web stream API support globally on native ([#36407](https://github.com/expo/expo/pull/36407) by [@EvanBacon](https://github.com/EvanBacon))

## 53.0.0 — 2025-04-25

_This version does not introduce any user-facing changes._

## 53.0.0-preview.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 53.0.0-preview.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 53.0.0-preview.1 — 2025-04-08

_This version does not introduce any user-facing changes._

## 53.0.0-preview.0 — 2025-04-04

### 🛠 Breaking changes

- upgrade RN to 0.78 ([#35050](https://github.com/expo/expo/pull/35050) by [@vonovak](https://github.com/vonovak))

### 🐛 Bug fixes

- Drop `fbemitter` in favor of internal logic. ([#35318](https://github.com/expo/expo/pull/35319) by [@kitten](https://github.com/kitten)
- Update mocks to for esm exports. ([#35574](https://github.com/expo/expo/pull/35574) by [@alanjhughes](https://github.com/alanjhughes))

## 52.0.6 - 2025-03-11

### 🐛 Bug fixes

- Fixed jest error from `FormData`. ([#35162](https://github.com/expo/expo/pull/35162) by [@WoLewicki](https://github.com/WoLewicki))

## 52.0.5 - 2025-02-21

_This version does not introduce any user-facing changes._

## 52.0.4 - 2025-02-14

_This version does not introduce any user-facing changes._

## 52.0.3 - 2025-01-10

_This version does not introduce any user-facing changes._

## 52.0.2 — 2024-11-15

### 🐛 Bug fixes

- Fixed error when `babel.config.js` is not existed. ([#32942](https://github.com/expo/expo/pull/32942) by [@kudo](https://github.com/kudo))

## 52.0.1 — 2024-11-14

_This version does not introduce any user-facing changes._

## 52.0.0 — 2024-11-11

### 🐛 Bug fixes

- Update transform ignore patterns to replace deprecated Sentry SDK with current one. ([#32528](https://github.com/expo/expo/pull/32528) by [@KoenCa](https://github.com/KoenCa))

## 52.0.0-preview.4 — 2024-11-05

### 💡 Others

- Add mocks for internal native methods in splash screen ([#32610](https://github.com/expo/expo/pull/32610) by [@brentvatne](https://github.com/brentvatne))

## 52.0.0-preview.3 — 2024-10-31

### 💡 Others

- Update SplashScreen api to add `hide` method. ([#32484](https://github.com/expo/expo/pull/32484) by [@alanjhughes](https://github.com/alanjhughes))

## 52.0.0-preview.2 — 2024-10-29

### 🐛 Bug fixes

- Fix mocking for requireOptionalNativeModule. ([#32412](https://github.com/expo/expo/pull/32412) by [@aleqsio](https://github.com/aleqsio))

## 52.0.0-preview.1 — 2024-10-24

_This version does not introduce any user-facing changes._

## 52.0.0-preview.0 — 2024-10-22

### 🎉 New features

- Add experimental `jest-expo/rsc` preset for testing React Server Components. ([#29404](https://github.com/expo/expo/pull/29404) by [@EvanBacon](https://github.com/EvanBacon))
- Load view mocks included in packages. ([#28157](https://github.com/expo/expo/pull/28157) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- Fix snapshot writing for RSC. ([#30589](https://github.com/expo/expo/pull/30589) by [@EvanBacon](https://github.com/EvanBacon))
- Fixes jest spitting console error caused by ref stubbing. ([#29420](https://github.com/expo/expo/pull/29420) by [@aleqsio](https://github.com/aleqsio))
- Avoid adding typescript wildcard paths as jest module mapping. ([#29836](https://github.com/expo/expo/pull/29836) by [@byCedric](https://github.com/byCedric))
- Add missing `fbemitter` dependency and `expo`/`react-native` peer dependencies. ([#30573](https://github.com/expo/expo/pull/30573) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Mock files from the `src` folder instead of `build`. ([#29702](https://github.com/expo/expo/pull/29702) by [@tsapeta](https://github.com/tsapeta))
- Rewrite experimental `jest-expo/rsc` matchers to Jest only matchers. ([#30710](https://github.com/expo/expo/pull/30710) by [@byCedric](https://github.com/byCedric))

### ⚠️ Notices

- Added support for React Native 0.75.x. ([#30034](https://github.com/expo/expo/pull/30034), [#30828](https://github.com/expo/expo/pull/30828) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 51.0.2 — 2024-05-16

_This version does not introduce any user-facing changes._

## 51.0.1 — 2024-04-24

### 💡 Others

- Update mocks for SDK51. ([#28424](https://github.com/expo/expo/pull/28424) by [@aleqsio](https://github.com/aleqsio))

## 51.0.0 — 2024-04-18

### 🎉 New features

- Add support for internal `process.env.EXPO_OS` environment variable and passing `platform` to `babel-jest` caller. ([#27637](https://github.com/expo/expo/pull/27637) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Mock `EventEmitter` from `expo-modules-core`. ([#26945](https://github.com/expo/expo/pull/26945) by [@aleqsio](https://github.com/aleqsio))
- Remove most of Constants.appOwnership. ([#26313](https://github.com/expo/expo/pull/26313) by [@wschurman](https://github.com/wschurman))
- Simulate the mocked `expo-modules-core.EventEmitter` like a true EventEmitter. ([#27257](https://github.com/expo/expo/pull/27257) by [@kudo](https://github.com/kudo))
- Rename `ExpoCamera` to `ExpoCameraLegacy`. ([#28226](https://github.com/expo/expo/pull/28226) by [@alanjhughes](https://github.com/alanjhughes))

## 50.0.4 - 2024-03-13

_This version does not introduce any user-facing changes._

## 50.0.3 - 2024-03-07

### 💡 Others

- Add mock for `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` if undefined. ([#27434](https://github.com/expo/expo/pull/27434) by [@marklawlor](https://github.com/marklawlor))
- Add off() stub to `__REACT_DEVTOOLS_GLOBAL_HOOK__` mock ([#27487](https://github.com/expo/expo/pull/27487) by [@marklawlor](https://github.com/marklawlor))

## 50.0.2 - 2024-02-06

_This version does not introduce any user-facing changes._

## 50.0.1 — 2023-12-13

_This version does not introduce any user-facing changes._

## 50.0.0 — 2023-12-12

### 🎉 New features

- Alias `react-native-vector-icons` to `@expo/vector-icons` in the Metro resolver. ([#25512](https://github.com/expo/expo/pull/25512) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Update `expo-font` mock for custom native fonts checks. ([#25770](https://github.com/expo/expo/pull/25770) by [@kudo](https://github.com/kudo))

## 50.0.0-alpha.4 — 2023-11-14

### 🎉 New features

- Install `URL` API support on the global for native. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Ensure `experienceUrl` is defined in `expo-constants`. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Collapse re-export of `react-native/Libraries/Image/AssetRegistry` to `@react-native/assets-registry/registry`. ([#25265](https://github.com/expo/expo/pull/25265) by [@EvanBacon](https://github.com/EvanBacon))
- Renamed `ExponentCamera` to `ExpoCamera`. ([#22604](https://github.com/expo/expo/pull/22604) by [@alanjhughes](https://github.com/alanjhughes))

## 50.0.0-alpha.3 — 2023-10-17

### 🎉 New features

- Read mocks for native code from individual modules. ([#24065](https://github.com/expo/expo/pull/24065) by [@aleqsio](https://github.com/aleqsio))

## 50.0.0-alpha.2 — 2023-09-15

_This version does not introduce any user-facing changes._

## 50.0.0-alpha.1 — 2023-09-04

### 🎉 New features

- Automatically generate `moduleNameMapping` from `tsconfig.json` when available. ([#23442](https://github.com/expo/expo/pull/23442) by [@byCedric](https://github.com/byCedric))

### 🐛 Bug fixes

- Files under `/node_modules/react-native-reanimated/plugin/` are excluded from being transformed by Jest. This fixes a "Reentrant plugin detected" error that occurred when running tests that applied to multiple platforms, like `__tests__/example.native.js` (run for both Android and iOS tests). ([#23912](https://github.com/expo/expo/pull/23912) by [@ide](https://github.com/ide))

## 50.0.0-alpha.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 49.0.0 — 2023-06-28

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.5 — 2023-06-27

### 💡 Others

- upgrade `json5` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 49.0.0-alpha.4 — 2023-06-24

### 🎉 New features

- Updated mocks for Expo SDK 49. ([#23062](https://github.com/expo/expo/pull/23062) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 49.0.0-alpha.3 — 2023-06-22

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.2 — 2023-06-13

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.1 — 2023-05-08

_This version does not introduce any user-facing changes._

## 48.0.2 - 2023-03-08

### 🐛 Bug fixes

- Use the mocked `globalThis` rather than `global`. ([#21581](https://github.com/expo/expo/pull/21581) by [@kudo](https://github.com/kudo))

## 48.0.1 - 2023-02-21

### 🎉 New features

- Updated mocks for Expo SDK 48. ([#21308](https://github.com/expo/expo/pull/21308) by [@aleqsio](https://github.com/aleqsio))

## 48.0.0 — 2023-02-03

### 🛠 Breaking changes

- Drop support for `.expo.*` extensions (deprecated in SDK 41). ([#19910](https://github.com/expo/expo/pull/19910) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 💡 Others

- Renamed `ExponentMediaLibrary` to `ExpoMediaLibrary` ([#20232](https://github.com/expo/expo/pull/20232) by [@alanhughes](https://github.com/alanjhughes))

## 47.0.1 — 2022-10-30

_This version does not introduce any user-facing changes._

## 47.0.0 — 2022-10-27

### 🎉 New features

- Updated mocks for Expo SDK 47. ([#19706](https://github.com/expo/expo/pull/19706) by [@tsapeta](https://github.com/tsapeta))

## 46.0.2 — 2022-10-25

### 🐛 Bug fixes

- Update `transform` in `jest-preset` to support transforming other file extensions such as .jsx, .tsx, etc. ([#18476](https://github.com/expo/expo/pull/18476) by [@@amandeepmittal](https://github.com/@amandeepmittal))

### ⚠️ Notices

- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))

## 46.0.1 — 2022-07-11

_This version does not introduce any user-facing changes._

## 46.0.0 — 2022-07-07

### 🛠 Breaking changes

- Remove base mocked manifest and test both manifest types. ([#17402](https://github.com/expo/expo/pull/17402) by [@wschurman](https://github.com/wschurman))

### 🎉 New features

- Make `jest-expo` compatible with Jest 28. ([#17874](https://github.com/expo/expo/pull/17874) by [@madhums](https://github.com/madhums))

### 🐛 Bug fixes

- Added support for react-native-web 0.18. ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))
