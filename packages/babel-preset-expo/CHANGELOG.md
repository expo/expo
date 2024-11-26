# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Test for UNIX paths when removing console polyfill from RSC client output. ([#33397](https://github.com/expo/expo/pull/33397) by [@byCedric](https://github.com/byCedric))
- Add support for `TSInterfaceDeclaration` in server component plugin. ([#33121](https://github.com/expo/expo/pull/33121) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

## 12.0.3 — 2024-11-29

_This version does not introduce any user-facing changes._

## 12.0.2 — 2024-11-22

_This version does not introduce any user-facing changes._

## 12.0.1 — 2024-11-14

_This version does not introduce any user-facing changes._

## 12.0.0 — 2024-11-11

_This version does not introduce any user-facing changes._

## 12.0.0-preview.6 — 2024-11-07

### 🎉 New features

- Support hoisting for inlined server actions. ([#32633](https://github.com/expo/expo/pull/32633) by [@EvanBacon](https://github.com/EvanBacon))

## 12.0.0-preview.5 — 2024-11-04

### 💡 Others

- Added EAS Updates support for DOM Components. ([#32502](https://github.com/expo/expo/pull/32502) by [@kudo](https://github.com/kudo))

## 12.0.0-preview.4 — 2024-10-31

### 🐛 Bug fixes

- Don't assert `client-only` in SSR bundles. ([#32479](https://github.com/expo/expo/pull/32479) by [@EvanBacon](https://github.com/EvanBacon))

## 12.0.0-preview.3 — 2024-10-30

### 🎉 New features

- Add support for server actions that use `export default`. ([#32458](https://github.com/expo/expo/pull/32458) by [@EvanBacon](https://github.com/EvanBacon))

## 12.0.0-preview.2 — 2024-10-29

### 🎉 New features

- Assert that layout routes and API routes cannot be DOM components. ([#32422](https://github.com/expo/expo/pull/32422) by [@EvanBacon](https://github.com/EvanBacon))

## 12.0.0-preview.1 — 2024-10-24

_This version does not introduce any user-facing changes._

## 12.0.0-preview.0 — 2024-10-22

### 🎉 New features

- Add experimental support for React Server Actions in Expo Router. ([#31959](https://github.com/expo/expo/pull/31959) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for inlining constants for native server environments. ([#30586](https://github.com/expo/expo/pull/30586) by [@EvanBacon](https://github.com/EvanBacon))
- Add basic support for using DOM Components in React Server Components projects. ([#31080](https://github.com/expo/expo/pull/31080) by [@EvanBacon](https://github.com/EvanBacon))
- Add initial version of DOM Components and expose `expoDomComponentReference` on metadata. ([#30938](https://github.com/expo/expo/pull/30938) by [@EvanBacon](https://github.com/EvanBacon))
- Add `hasCjsExports` metadata for tracking static exports. ([#30111](https://github.com/expo/expo/pull/30111) by [@EvanBacon](https://github.com/EvanBacon))
- Add `process.env.EXPO_SERVER` for detecting when the JS was bundled for a server or react server environment. ([#30147](https://github.com/expo/expo/pull/30147) by [@EvanBacon](https://github.com/EvanBacon))
- Update React Compiler version to latest. ([#29635](https://github.com/expo/expo/pull/29635) by [@reichhartd](https://github.com/reichhartd))

### 🐛 Bug fixes

- Fix React compiler support. ([#32187](https://github.com/expo/expo/pull/32187) by [@EvanBacon](https://github.com/EvanBacon))
- Mock out js console polyfill for server environments. ([#32028](https://github.com/expo/expo/pull/32028) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `@babel/plugin-transform-parameters` plugin when bundling for server environments that target native. ([#30147](https://github.com/expo/expo/pull/30147) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `ReferenceError: Property 'React' doesn't exist.` crash when a DOM component includes `import React from 'react';`. ([#31469](https://github.com/expo/expo/pull/31469) by [@kudo](https://github.com/kudo))

### 💡 Others

- Bump `react-native-web` patch ([#32105](https://github.com/expo/expo/pull/32105) by [@EvanBacon](https://github.com/EvanBacon))
- Remove web hydration flag injection. ([#31267](https://github.com/expo/expo/pull/31267) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `"use dom"` injection on web. ([#31259](https://github.com/expo/expo/pull/31259) by [@EvanBacon](https://github.com/EvanBacon))
- Inline the generated DOM component entry function for DOM bundles. ([#31182](https://github.com/expo/expo/pull/31182) by [@EvanBacon](https://github.com/EvanBacon))
- Make `babel-plugin-react-compiler` an optional peer dependency. ([#30960](https://github.com/expo/expo/pull/30960) by [@EvanBacon](https://github.com/EvanBacon))
- Changed the react client reference collection property to be a string. ([#29646](https://github.com/expo/expo/pull/29646) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed DOM components bundling issues for Android emulators and release builds. ([#30974](https://github.com/expo/expo/pull/30974) by [@kudo](https://github.com/kudo))
- Allows type exports in DOM components. ([#31855](https://github.com/expo/expo/pull/31855) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- Added support for React Native 0.75.x. ([#30034](https://github.com/expo/expo/pull/30034), [#30828](https://github.com/expo/expo/pull/30828), [#31015](https://github.com/expo/expo/pull/31015) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 11.0.14 - 2024-08-14

### 🐛 Bug fixes

- Fix JSC builds. ([#30763](https://github.com/expo/expo/pull/30763) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.12 - 2024-07-03

_This version does not introduce any user-facing changes._

## 11.0.11 - 2024-06-27

_This version does not introduce any user-facing changes._

## 11.0.10 - 2024-06-13

_This version does not introduce any user-facing changes._

## 11.0.9 - 2024-06-10

### 🎉 New features

- Add experimental React Compiler support. ([#29168](https://github.com/expo/expo/pull/29168) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for `export * from` to `use client` plugin. ([#29426](https://github.com/expo/expo/pull/29426) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.8 - 2024-06-06

_This version does not introduce any user-facing changes._

## 11.0.7 - 2024-06-05

### 💡 Others

- Pin @react-native subpackage versions to 0.74.83. ([#29441](https://github.com/expo/expo/pull/29441) by [@kudo](https://github.com/kudo))

## 11.0.6 — 2024-05-13

### 🐛 Bug fixes

- Fix replacement of `__DEV__` in export statement. ([#28786](https://github.com/expo/expo/pull/28786) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.5 — 2024-05-02

_This version does not introduce any user-facing changes._

## 11.0.4 — 2024-05-01

_This version does not introduce any user-facing changes._

## 11.0.3 — 2024-05-01

### 💡 Others

- Align versions of fast refresh. ([#28550](https://github.com/expo/expo/pull/28550) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 11.0.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 11.0.0 — 2024-04-18

### 🛠 Breaking changes

- Remove all unused babel plugins on web and SSR. ([#27907](https://github.com/expo/expo/pull/27907) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add faster `Platform.select` transform. ([#27533](https://github.com/expo/expo/pull/27533) by [@EvanBacon](https://github.com/EvanBacon))
- Minify `typeof window` in server and web contexts. ([#27530](https://github.com/expo/expo/pull/27530) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for using `process.env.EXPO_OS` to detect the platform without platform shaking imports. ([#27509](https://github.com/expo/expo/pull/27509) by [@EvanBacon](https://github.com/EvanBacon))
- Add basic `react-server` support. ([#27264](https://github.com/expo/expo/pull/27264) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix bug preventing reassignment of globals. ([#27533](https://github.com/expo/expo/pull/27533) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Add more tests for obscure syntax used in Expo apps. ([#27709](https://github.com/expo/expo/pull/27709) by [@EvanBacon](https://github.com/EvanBacon))
- Relax forbidden React server API errors to better support shared components. ([#27878](https://github.com/expo/expo/pull/27878) by [@EvanBacon](https://github.com/EvanBacon))
- Reset env in tests. ([#27950](https://github.com/expo/expo/pull/27950) by [@EvanBacon](https://github.com/EvanBacon))
- Add Hermes language support tests. ([#27900](https://github.com/expo/expo/pull/27900) by [@EvanBacon](https://github.com/EvanBacon))
- Remove unused peer dependency on `@babel/preset-env`. ([#27705](https://github.com/expo/expo/pull/27705) by [@EvanBacon](https://github.com/EvanBacon))
- Disable color in snapshot tests in CI. ([#27301](https://github.com/expo/expo/pull/27301) by [@EvanBacon](https://github.com/EvanBacon))
- Add additional tests for undefined platform minification behavior. ([#27515](https://github.com/expo/expo/pull/27515) by [@EvanBacon](https://github.com/EvanBacon))
- Upgrade `babel-plugin-react-native-web` for latest `react-native-web` aliases. ([#27214](https://github.com/expo/expo/pull/27214) by [@EvanBacon](https://github.com/EvanBacon))
- Directly resolve plugins. ([#27041](https://github.com/expo/expo/pull/27041) by [@EvanBacon](https://github.com/EvanBacon))
- Simplify react server code injection by using more expensive template code. ([#27879](https://github.com/expo/expo/pull/27879) by [@EvanBacon](https://github.com/EvanBacon))
- Update unversioned expo config types. ([#28220](https://github.com/expo/expo/pull/28220) by [@wschurman](https://github.com/wschurman))

## 10.0.1 - 2023-12-19

### 💡 Others

- Change `@babel/plugin-proposal-object-rest-spread` to `@babel/plugin-transform-object-rest-spread`. ([#26035](https://github.com/expo/expo/pull/26035) by [@EvanBacon](https://github.com/EvanBacon))

## 10.0.0 — 2023-12-12

### 🛠 Breaking changes

- Move `babel-plugin-module-resolver` alias for `react-native-vector-icons` to `@expo/vector-icons` to individual implementations in Metro (via `@expo/cli`) and `jest-expo`. ([#25512](https://github.com/expo/expo/pull/25512) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Support caller option `supportsStaticESM` to disable cjs transforms. ([#25833](https://github.com/expo/expo/pull/25833) by [@EvanBacon](https://github.com/EvanBacon))
- Inject async routes using caller. ([#25627](https://github.com/expo/expo/pull/25627) by [@EvanBacon](https://github.com/EvanBacon))
- Use babel caller to determine the `expo-router` root directory. ([#25658](https://github.com/expo/expo/pull/25658) by [@EvanBacon](https://github.com/EvanBacon))
- Moved `react-refresh` babel plugin from Metro/Webpack to `babel-preset-expo`. ([#25461](https://github.com/expo/expo/pull/25461) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Prevent enabling `react-refresh` in server environments. ([#25461](https://github.com/expo/expo/pull/25461) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25425](https://github.com/expo/expo/pull/25425) by [@byCedric](https://github.com/byCedric))
- Update reanimated test snapshots. ([#25644](https://github.com/expo/expo/pull/25644) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 9.9.0 — 2023-11-14

### 🛠 Breaking changes

- Remove support for `native.useTransformReactJSXExperimental` and `web.useTransformReactJSXExperimental` option in favor of `jsxRuntime: 'classic'`. React support can no longer be removed. ([#25125](https://github.com/expo/expo/pull/25125) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Rename `basePath` to `baseUrl` and expose to bundles with `process.env.EXPO_BASE_URL`. ([#25305](https://github.com/expo/expo/pull/25305) by [@EvanBacon](https://github.com/EvanBacon))
- Add `Platform.OS` shaking without needing to enable experimental ESM transforms. ([#25171](https://github.com/expo/expo/pull/25171) by [@EvanBacon](https://github.com/EvanBacon))
- Inline environment variables in production before the serializer to support source maps. ([#25239](https://github.com/expo/expo/pull/25239) by [@EvanBacon](https://github.com/EvanBacon))
- Support all options in top-level object and in `native` and `web` sub-objects. ([#25172](https://github.com/expo/expo/pull/25172) by [@EvanBacon](https://github.com/EvanBacon))
- Use the standard `@babel/preset-react` for all React transformations. ([#25125](https://github.com/expo/expo/pull/25125) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Only inline platforms when explicitly bundling for production. ([#25275](https://github.com/expo/expo/pull/25275) by [@EvanBacon](https://github.com/EvanBacon))
- Fix jsx dev transform with React components that are defined in the function parameters. ([#25235](https://github.com/expo/expo/pull/25235) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Drop unused `native.withDevTools` and `web.withDevTools` options. ([#25125](https://github.com/expo/expo/pull/25125) by [@EvanBacon](https://github.com/EvanBacon))
- Migrate from `@babel/plugin-proposal-export-namespace-from` to `@babel/plugin-transform-export-namespace-from`. ([#25127](https://github.com/expo/expo/pull/25127) by [@EvanBacon](https://github.com/EvanBacon))
- Update reanimated tests. ([#25126](https://github.com/expo/expo/pull/25126) by [@EvanBacon](https://github.com/EvanBacon))

## 9.8.0 — 2023-10-17

### 🎉 New features

- Automatically optimize transformations based on Hermes usage. ([#24672](https://github.com/expo/expo/pull/24672) by [@EvanBacon](https://github.com/EvanBacon))
- Enable `expo-router` Babel features when available. ([#24779](https://github.com/expo/expo/pull/24779) by [@EvanBacon](https://github.com/EvanBacon))

## 9.7.0 — 2023-09-15

### 🛠 Breaking changes

- Remove experimental native Webpack support. ([#24328](https://github.com/expo/expo/pull/24328) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Drop warning for invalid property `useTransformReactJsxExperimental`. ([#24328](https://github.com/expo/expo/pull/24328) by [@EvanBacon](https://github.com/EvanBacon))
- Re-write in TypeScript. ([#24328](https://github.com/expo/expo/pull/24328) by [@EvanBacon](https://github.com/EvanBacon))

## 9.6.2 — 2023-09-04

_This version does not introduce any user-facing changes._

## 9.6.1 — 2023-08-02

### 🎉 New features

- Automatically add `react-native-reanimated/plugin` when available. ([#23798](https://github.com/expo/expo/pull/23798) by [@EvanBacon](https://github.com/EvanBacon))

## 9.6.0 — 2023-07-28

### 📚 3rd party library updates

- Update `metro-react-native-babel-preset` to 0.76.7. ([#23517](https://github.com/expo/expo/pull/23517) by [@SimenB](https://github.com/SimenB), [#23693](https://github.com/expo/expo/pull/23693) by [@kudo](https://github.com/kudo))

## 9.5.0 — 2023-06-21

### 🎉 New features

- Add `@babel/plugin-proposal-export-namespace-from`. ([#22899](https://github.com/expo/expo/pull/22899) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Bump `babel-plugin-module-resolver` dev dependency. ([#22871](https://github.com/expo/expo/pull/22871) by [@EvanBacon](https://github.com/EvanBacon))

## 9.4.1 — 2023-06-13

### 📚 3rd party library updates

- Update `metro-react-native-babel-preset` to 0.76.5. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

## 9.4.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 9.3.2 - 2023-04-03

### 📚 3rd party library updates

- Update `metro-react-native-babel-preset` to 0.73.9. ([#21909](https://github.com/expo/expo/pull/21909) by [@kudo](https://github.com/kudo))

## 9.3.0 — 2023-02-03

### 🐛 Bug fixes

- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

## 9.2.2 — 2022-11-03

_This version does not introduce any user-facing changes._

## 9.2.1 — 2022-10-06

### ⚠️ Notices

- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))

## 9.2.0 — 2022-07-07

### 💡 Others

- Preserve `import/export` syntax on Webpack only. ([#17713](https://github.com/expo/expo/pull/17713) by [@EvanBacon](https://github.com/EvanBacon))

### 📚 3rd party library updates

- Updates `metro-react-native-babel-preset` for react-native 0.69. ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))

## 9.1.0 — 2022-04-18

### 📚 3rd party library updates

- Upgrade to react-native 0.66. ([#15914](https://github.com/expo/expo/pull/15914) by [@kudo](https://github.com/kudo))

## 9.0.2 — 2021-12-15

### 🐛 Bug fixes

- Fix support for node12. ([#15545](https://github.com/expo/expo/pull/15545) by [@lapz](https://github.com/lapz))

## 9.0.1 — 2021-12-08

_This version does not introduce any user-facing changes._

## 9.0.0 — 2021-12-03

### 🛠 Breaking changes

- Changed default value of `jsxRuntime` to `automatic` ([#14995](https://github.com/expo/expo/pull/14995) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added option `jsxImportSource` to allow passing in a custom importSource ([#15275](https://github.com/expo/expo/pull/15275) by [@kbrandwijk](https://github.com/kbrandwijk))
