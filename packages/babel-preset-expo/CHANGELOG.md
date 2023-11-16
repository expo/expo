# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

- Replace `@expo/babel-preset-cli` with `babel-preset-expo`.

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
