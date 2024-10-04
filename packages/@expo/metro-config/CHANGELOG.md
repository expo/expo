# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.11.0 — 2023-07-28

### 🛠 Breaking changes

- Use custom Babel transformer by default. ([#23607](https://github.com/expo/expo/pull/23607) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Expose default Babel transformer with `@expo/metro-config/babel-transformer`. ([#23607](https://github.com/expo/expo/pull/23607) by [@EvanBacon](https://github.com/EvanBacon))
- Expose `metroTarget: 'client' | 'node'` to the Babel caller. ([#23607](https://github.com/expo/expo/pull/23607) by [@EvanBacon](https://github.com/EvanBacon))

## 0.10.7 - 2023-07-21

### 🐛 Bug fixes

- Add missing `unstable_styles` export on native for CSS Modules. ([#23260](https://github.com/expo/expo/pull/23260) by [@EvanBacon](https://github.com/EvanBacon))
- Keep other URL components in place when rewriting full URLs for virtual entrypoints. ([#23546](https://github.com/expo/expo/pull/23546) by [@byCedric](https://github.com/byCedric))

## 0.10.6 - 2023-07-02

_This version does not introduce any user-facing changes._

## 0.10.5 - 2023-06-30

_This version does not introduce any user-facing changes._

## 0.10.4 - 2023-06-29

### 🎉 New features

- Silence dotenv file watching warnings. ([#23169](https://github.com/expo/expo/pull/23169) by [@EvanBacon](https://github.com/EvanBacon))

## 0.10.3 — 2023-06-27

### 🐛 Bug fixes

- Fix css modules syntax. ([#23086](https://github.com/expo/expo/pull/23086) by [@EvanBacon](https://github.com/EvanBacon))

## 0.10.2 — 2023-06-24

### 🎉 New features

- Ignore `@expo/metro-runtime` in stacks. ([#22738](https://github.com/expo/expo/pull/22738) by [@EvanBacon](https://github.com/EvanBacon))

## 0.10.1 — 2023-06-22

### 🐛 Bug fixes

- Re-arrange the `Libraries/Core/InitializeCore` import. ([#23049](https://github.com/expo/expo/pull/23049) by [@EvanBacon](https://github.com/EvanBacon))

## 0.10.0 — 2023-06-21

### 🛠 Breaking changes

- CSS Modules now export web-compatible styles by default and `unstable_styles` for `react-native-web` style objects. ([#23002](https://github.com/expo/expo/pull/23002) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Strip `app/+html` files from client bundles. ([#22881](https://github.com/expo/expo/pull/22881) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix metro type issues. ([#22867](https://github.com/expo/expo/pull/22867) by [@EvanBacon](https://github.com/EvanBacon))
- Fix metro JSC urls. ([#22929](https://github.com/expo/expo/pull/22929) by [@EvanBacon](https://github.com/EvanBacon))

## 0.9.0 — 2023-06-13

### 🎉 New features

- Ensure `@expo/metro-runtime` is shifted to be imported first when installed. ([#22628](https://github.com/expo/expo/pull/22628) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

## 0.8.0 — 2023-05-08

### 🛠 Breaking changes

- Add custom `server.rewriteRequestUrl` which is required for custom entry points in development builds that don't use `expo-dev-client`. This must now be extended in local projects that need to use `server.rewriteRequestUrl`. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))
- Import Metro dependencies directly from where ever the `expo/metro-config` package is being initialized. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- Drop `@unimodules` namespace from Exotic transformer. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- `expo-asset` is no longer optional. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add resource serializer for static CSS extraction in development. ([#22325](https://github.com/expo/expo/pull/22325) by [@EvanBacon](https://github.com/EvanBacon))
- Support custom entry files for development builds that don't use `expo-dev-client`. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))
- Export `MetroConfig` type. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for inlining environment variables using the `EXPO_PUBLIC_` prefix. ([#21983](https://github.com/expo/expo/pull/21983) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for loading environment variables from `.env` files. ([#21983](https://github.com/expo/expo/pull/21983) by [@EvanBacon](https://github.com/EvanBacon))
- Add CSS support on web and shims on native, requires `transformerPath` not be overwritten. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))
- Add CSS Module support on web and shims on native, requires `transformerPath` not be overwritten. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))
- Add PostCSS support on web, configurable with `postcss.config.js` and `postcss.config.json`, when `isCSSEnabled` is `true`. ([#22032](https://github.com/expo/expo/pull/22032) by [@EvanBacon](https://github.com/EvanBacon))
- Add partial SASS/SCSS support on web, enabled when `isCSSEnabled` is `true`. ([#22031](https://github.com/expo/expo/pull/22031) by [@EvanBacon](https://github.com/EvanBacon))
- Add `cjs` extension to `resolver.sourceExts` (without platform extension support). ([#22076](https://github.com/expo/expo/pull/22076) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Escape backticks in runtime CSS scripts. ([#22040](https://github.com/expo/expo/pull/22040) by [@EvanBacon](https://github.com/EvanBacon))
- Escape octal characters in runtime CSS scripts. ([#22054](https://github.com/expo/expo/pull/22054) by [@EvanBacon](https://github.com/EvanBacon))
- Allow environment variables to be mutable in development. ([#22072](https://github.com/expo/expo/pull/22072) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Drop `testing` and `native` from `resolver.platforms`. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))

## 0.7.0 — 2023-02-14

### 🎉 New features

- Add `EXPO_USE_METRO_WORKSPACE_ROOT` to enable using the workspace root for serving files. ([#21088](https://github.com/expo/expo/pull/21088) by [@EvanBacon](https://github.com/EvanBacon))

## 0.6.0 — 2023-02-03

### 🎉 New features

- Ignore `react-dom` traces. ([#21005](https://github.com/expo/expo/pull/21005) by [@EvanBacon](https://github.com/EvanBacon))
- Add `avif` and `heic` to the default `resolver.assetExts` to support `expo-image`. ([#20893](https://github.com/expo/expo/pull/20893) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix Exotic support for Expo SDK 47 projects. ([#20827](https://github.com/expo/expo/pull/20827) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Remove `@expo/json-file`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
