# Changelog

## Unpublished

### 🛠 Breaking changes

- Add custom `server.rewriteRequestUrl` which is required for custom entry points in development builds that don't use `expo-dev-client`. This must now be extended in local projects that need to use `server.rewriteRequestUrl`. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))
- Import Metro dependencies directly from where ever the `expo/metro-config` package is being initialized. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- Drop `@unimodules` namespace from Exotic transformer. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- `expo-asset` is no longer optional. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Support custom entry files for development builds that don't use `expo-dev-client`. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))
- Export `MetroConfig` type. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for inlining environment variables using the `EXPO_PUBLIC_` prefix. ([#21983](https://github.com/expo/expo/pull/21983) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for loading environment variables from `.env` files. ([#21983](https://github.com/expo/expo/pull/21983) by [@EvanBacon](https://github.com/EvanBacon))
- Add CSS support on web and shims on native, requires `transformerPath` not be overwritten. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))
- Add CSS Module support on web and shims on native, requires `transformerPath` not be overwritten. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))
- Add partial SASS/SCSS support on web, enabled when `isCSSEnabled` is `true`. ([#22031](https://github.com/expo/expo/pull/22031) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Escape backticks in runtime CSS scripts. ([#22040](https://github.com/expo/expo/pull/22040) by [@EvanBacon](https://github.com/EvanBacon))
- Escape octal characters in runtime CSS scripts. ([#22054](https://github.com/expo/expo/pull/22054) by [@EvanBacon](https://github.com/EvanBacon))
- Allow environment variables to be mutable in development.

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
