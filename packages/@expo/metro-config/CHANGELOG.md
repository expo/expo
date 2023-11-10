# Changelog

## Unpublished

### 🛠 Breaking changes

- Pass assets and artifacts back from static serializer. This cannot be used with older versions of Expo CLI. ([#25312](https://github.com/expo/expo/pull/25312) by [@EvanBacon](https://github.com/EvanBacon))
- Drop support for running arbitrary Metro packages. ([#25197](https://github.com/expo/expo/pull/25197) by [@EvanBacon](https://github.com/EvanBacon))
- Enable `inlineRequires` by default. ([#25089](https://github.com/expo/expo/pull/25089) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Rename `basePath` to `baseUrl` and expose to bundles with `process.env.EXPO_BASE_URL`. ([#25305](https://github.com/expo/expo/pull/25305) by [@EvanBacon](https://github.com/EvanBacon))
- Pass `isDev` to the Babel caller. ([#25125](https://github.com/expo/expo/pull/25125) by [@EvanBacon](https://github.com/EvanBacon))
- Ignore stack traces from whatwg modules. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Ensure the `react-native` exports condition is not used on web. ([#25260](https://github.com/expo/expo/pull/25260) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Improve source map generation for static web. ([#25245](https://github.com/expo/expo/pull/25245) by [@EvanBacon](https://github.com/EvanBacon))
- Improve types. ([#25257](https://github.com/expo/expo/pull/25257) by [@EvanBacon](https://github.com/EvanBacon))
- Move environment variables production inlining to `babel-preset-expo` to support source maps. ([#25239](https://github.com/expo/expo/pull/25239) by [@EvanBacon](https://github.com/EvanBacon))
- Update tests. ([#25149](https://github.com/expo/expo/pull/25149) by [@EvanBacon](https://github.com/EvanBacon))
- Unrevert `URL` support. ([#25005](https://github.com/expo/expo/pull/25005) by [@EvanBacon](https://github.com/EvanBacon))
- Revert `URL` support. ([#25006](https://github.com/expo/expo/pull/25006) by [@EvanBacon](https://github.com/EvanBacon))
- "Exotic mode", `EXPO_USE_EXOTIC`, and `EXPO_USE_FB_SOURCES` have been deprecated and no longer enable any experimental functionality. ([#24927](https://github.com/expo/expo/pull/24927) by [@EvanBacon](https://github.com/EvanBacon))

## 0.14.0 — 2023-10-17

### 🛠 Breaking changes

- `isCSSEnabled` now defaults to `true` ([#24489](https://github.com/expo/expo/pull/24489) by [@marklawlor](https://github.com/marklawlor))

### 🎉 New features

- Pass `projectRoot` to the Babel caller. ([#24779](https://github.com/expo/expo/pull/24779) by [@EvanBacon](https://github.com/EvanBacon))
- Automatically optimize transformations based on Hermes usage. ([#24672](https://github.com/expo/expo/pull/24672) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 0.13.1 — 2023-09-15

### 🎉 New features

- Shim server files in client environments. ([#24429](https://github.com/expo/expo/pull/24429) by [@EvanBacon](https://github.com/EvanBacon))

## 0.13.0 — 2023-09-15

### 🎉 New features

- Add `basePath` support. ([#23911](https://github.com/expo/expo/pull/23911) by [@EvanBacon](https://github.com/EvanBacon))
- Replace `metroTarget: 'client' | 'node'` with `isServer: boolean` in the Babel caller. ([#24410](https://github.com/expo/expo/pull/24410) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix exporting paths on Windows machines. ([#24382](https://github.com/expo/expo/pull/24382) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Move `process.env` polyfill strip to `expo/metro-config`. ([#24455](https://github.com/expo/expo/pull/24455) by [@EvanBacon](https://github.com/EvanBacon))
- Fix build. ([#24309](https://github.com/expo/expo/pull/24309) by [@EvanBacon](https://github.com/EvanBacon))

## 0.12.0 — 2023-09-04

### 🎉 New features

- Add source map support with static Metro web exports. ([#24213](https://github.com/expo/expo/pull/24213) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Use stable hashing for static CSS asset names. ([#23890](https://github.com/expo/expo/pull/23890) by [@EvanBacon](https://github.com/EvanBacon))

## 0.11.1 — 2023-08-02

### 🛠 Breaking changes

- Add support for `.mjs` extensions in Expo Metro. ([#23528](https://github.com/expo/expo/pull/23528) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Automatically invalidate cache when `react-native-reanimated` version changes or is added. ([#23798](https://github.com/expo/expo/pull/23798) by [@EvanBacon](https://github.com/EvanBacon))

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
