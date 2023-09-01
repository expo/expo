# Changelog

## Unpublished

- Fix false positive redirect deprecation since version 2.0.1 when using `<Screen />`. ([#23932](https://github.com/expo/expo/pull/23932) by [@sync](https://github.com/sync))

### 🛠 Breaking changes

- Remove `@bacons/react-views` -> the undocumented `hoverStyle` property is no longer supported on `<Link />`. ([#23889](https://github.com/expo/expo/pull/23889) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Tree shake error symbolication code in production. ([#24215](https://github.com/expo/expo/pull/24215) by [@EvanBacon](https://github.com/EvanBacon))
- Add static font extraction support with `expo-font`. ([#24027](https://github.com/expo/expo/pull/24027) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Support `push` going back to sibling with nested stack from a modal. ([#24166](https://github.com/expo/expo/pull/24166) by [@EvanBacon](https://github.com/EvanBacon))
- Use deeper clone to prevent state leak. ([#24149](https://github.com/expo/expo/pull/24149) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent double renders when pushing stacks. ([#24147](https://github.com/expo/expo/pull/24147) by [@EvanBacon](https://github.com/EvanBacon))
- Patch `react-native-web` AppContainer to prevent adding extra divs. ([#24093](https://github.com/expo/expo/pull/24093) by [@EvanBacon](https://github.com/EvanBacon))
- Allow pushing "sibling" routes by the same name. ([#23833](https://github.com/expo/expo/pull/23833) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent throwing in `canGoBack` before the navigation has mounted. ([#23959](https://github.com/expo/expo/pull/23959) by [@EvanBacon](https://github.com/EvanBacon))
- Fix error overlay not being applied on web. ([#24052](https://github.com/expo/expo/pull/24052) by [@EvanBacon](https://github.com/EvanBacon))
- Add missing `listener` types. ([#24174](https://github.com/expo/expo/pull/24174) by [@muneebahmedayub](https://github.com/muneebahmedayub))

### 💡 Others

- Move entry registration to `expo`. ([#23891](https://github.com/expo/expo/pull/23891) by [@EvanBacon](https://github.com/EvanBacon))
- Drop unused tests. ([#23890](https://github.com/expo/expo/pull/23890) by [@EvanBacon](https://github.com/EvanBacon))
- Fix `yarn tsc` in the repo. ([#23887](https://github.com/expo/expo/pull/23887) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.0 — 2023-08-02

### 🛠 Breaking changes

- Migrate to expo/expo monorepo. ([#23725](https://github.com/expo/expo/pull/23725) by [@EvanBacon](https://github.com/EvanBacon))
- Change source directory in production to use `build` instead of `src`. ([#23725](https://github.com/expo/expo/pull/23725) by [@EvanBacon](https://github.com/EvanBacon))
- Fold `expo-head` into `expo-router`. ([#23725](https://github.com/expo/expo/pull/23725) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix exports. ([#23789](https://github.com/expo/expo/pull/23789) by [@EvanBacon](https://github.com/EvanBacon))
