# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add internal support for exporting native assets for hosting. ([#38265](https://github.com/expo/expo/pull/38265) by [@EvanBacon](https://github.com/EvanBacon))
- Add `browserslist` and automatic vendor prefixing support ([#37489](https://github.com/expo/expo/pull/37489) by [@EvanBacon](https://github.com/EvanBacon))
- Fork Import Export Plugin from `metro` and enhance its syntax support (`experimentalImportSupport` now supports export namespace from, export destructed named object, live bindings by default and more) ([#38135](https://github.com/expo/expo/pull/38135) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Enable ESM Import Export Support by default ([#38298](https://github.com/expo/expo/pull/38298)) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Allow running server middleware with `+middleware.ts` ([#38330](https://github.com/expo/expo/pull/38330) by [@hassankhan](https://github.com/hassankhan))
- Create `metro-runtime` and `common` chunks when bundle splitting is enabled ([#38339](https://github.com/expo/expo/pull/38339) by [@krystofwoldrich](https://github.com/krystofwoldrich))

### 🐛 Bug fixes

- Ensure react-native projects without Expo code-loading can use async routes. ([#38587](https://github.com/expo/expo/pull/38587) by [@EvanBacon](https://github.com/EvanBacon))
- Fix Fast Refresh on web by calling `module.hot.accept()` in the transformer. ([#37767](https://github.com/expo/expo/pull/37767) by [@hirbod](https://github.com/hirbod))
- Fix failing build with tree shaking due to missing import location ([#37916](https://github.com/expo/expo/pull/37916) by [@krystofwoldrich](https://github.com/krystofwoldrich))

### 💡 Others

- Improve debug logs and types of `import-export-plugin` ([#38203](https://github.com/expo/expo/pull/38203) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Fix Babel dependencies by removing reliance on `@babel/parser`, `@babel/types`, and `@babel/template`, and adding missing `@babel/code-frame` dependency ([#38171](https://github.com/expo/expo/pull/38171) by [@kitten](https://github.com/kitten))
- Switch Metro imports to `@expo/metro` wrapper package ([#38166](https://github.com/expo/expo/pull/38166) by [@kitten](https://github.com/kitten))
- Fix `@react-native/js-polyfills`, `hermes-parser`, and `babel-preset-expo` (fallback) dependency resolution for isolated dependencies ([#38535](https://github.com/expo/expo/pull/38535) by [@kitten](https://github.com/kitten))
- Resolve `react-native` from project root when looking up Hermes compiler ([#38547](https://github.com/expo/expo/pull/38547) by [@kitten](https://github.com/kitten))
- Import `getDefaultConfig` and `mergeConfig` from pinned `metro-config` version ([#38682](https://github.com/expo/expo/pull/38682) by [@kitten](https://github.com/kitten))

## 0.20.17 - 2025-07-03

_This version does not introduce any user-facing changes._

## 0.20.16 - 2025-07-02

### 🐛 Bug fixes

- Fix require path of assets with RSC client references ([#37663](https://github.com/expo/expo/pull/37663) by [@byCedric](https://github.com/byCedric))

## 0.20.15 - 2025-06-18

### 🐛 Bug fixes

- Fix tree shaking overlapping exports ([#36717](https://github.com/expo/expo/pull/36717) by [@EvanBacon](https://github.com/EvanBacon))
- Update to `getenv@2.0.0` to support upper case boolean environment variables ([#36688](https://github.com/expo/expo/pull/36688) by [@stephenlacy](https://github.com/stephenlacy))

### 💡 Others

- Remove flipper hack support from types. ([#37532](https://github.com/expo/expo/pull/37532) by [@EvanBacon](https://github.com/EvanBacon))
- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 0.20.14 — 2025-05-06

### 🐛 Bug fixes

- Fix issue with HMR env vars in development not being readable in development. ([#36652](https://github.com/expo/expo/pull/36652) by [@EvanBacon](https://github.com/EvanBacon))

## 0.20.13 — 2025-05-03

### 🐛 Bug fixes

- Avoid mixing up ESM imports with non-ESM imports when collecting dependencies of single line files. ([#36594](https://github.com/expo/expo/pull/36594) by [@byCedric](https://github.com/byCedric))

## 0.20.12 — 2025-05-01

### 🐛 Bug fixes

- Fix env vars when no .env files are defined. ([#36513](https://github.com/expo/expo/pull/36513) by [@EvanBacon](https://github.com/EvanBacon))

## 0.20.11 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.20.10 — 2025-04-30

### 💡 Others

- Pass `metroSourceType` from Babel transformer options via Babel caller ([#36463](https://github.com/expo/expo/pull/36463) by [@kitten](https://github.com/kitten))

## 0.20.9 — 2025-04-28

_This version does not introduce any user-facing changes._

## 0.20.8 — 2025-04-28

### 🐛 Bug fixes

- Remove absolute paths from server components output. ([#35276](https://github.com/expo/expo/pull/35276) by [@EvanBacon](https://github.com/EvanBacon))
- Fix importing polyfills. ([#36406](https://github.com/expo/expo/pull/36406) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Move virtual rsc entry to expo ([#36408](https://github.com/expo/expo/pull/36408) by [@EvanBacon](https://github.com/EvanBacon))
- Shim web streams API when bundling for native client environments. ([#36407](https://github.com/expo/expo/pull/36407) by [@EvanBacon](https://github.com/EvanBacon))

## 0.20.7 — 2025-04-25

_This version does not introduce any user-facing changes._

## 0.20.6 — 2025-04-23

### 🎉 New features

- Add hot reloading for environment variables. ([#36189](https://github.com/expo/expo/pull/36189) by [@EvanBacon](https://github.com/EvanBacon))

## 0.20.5 — 2025-04-21

### 🐛 Bug fixes

- Add `exporting` config option for serializer to generate correct entry bundle file name. ([#35563](https://github.com/expo/expo/pull/35563) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Collapse more unused stacks. ([#36272](https://github.com/expo/expo/pull/36272) by [@EvanBacon](https://github.com/EvanBacon))

## 0.20.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.20.3 — 2025-04-11

### 🐛 Bug fixes

- Fix `withSerializerPlugins` maintaining original Metro config reference - receiving serializer customization changes. ([#36099](https://github.com/expo/expo/pull/36099) by [@byCedric](https://github.com/byCedric))

## 0.20.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 0.20.1 — 2025-04-08

### 💡 Others

- Update RSC tests. ([#35957](https://github.com/expo/expo/pull/35957) by [@EvanBacon](https://github.com/EvanBacon))
- Add backup stack trace ([#35913](https://github.com/expo/expo/pull/35913) by [@EvanBacon](https://github.com/EvanBacon))

## 0.20.0 — 2025-04-04

### 🎉 New features

- Add support for `Worker` and `require.unstable_resolveWorker()`. ([#34938](https://github.com/expo/expo/pull/34938) by [@EvanBacon](https://github.com/EvanBacon))
- Include import hints for all optional imports. ([#35239](https://github.com/expo/expo/pull/35239) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for `postcss.config.mjs`. ([#34840](https://github.com/expo/expo/pull/34840) by [@EvanBacon](https://github.com/EvanBacon))
- Fork `asyncRequireModulePath` to support adding custom require types (Workers) in the future. ([#35110](https://github.com/expo/expo/pull/35110) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for `require.resolveWeak` with tree shaking. ([#34988](https://github.com/expo/expo/pull/34988) by [@EvanBacon](https://github.com/EvanBacon))
- Remove need for `expo-asset/tools/hashAssetFiles` and add legacy support for projects that still have it. ([#34208](https://github.com/expo/expo/pull/34208) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for `/* webpackIgnore: true */` magic comment in code splitting. ([#33366](https://github.com/expo/expo/pull/33366) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for new unstable `isESMImport` resolution. ([#35306](https://github.com/expo/expo/pull/35306) by [@byCedric](https://github.com/byCedric))

### 🐛 Bug fixes

- Remove empty files during bundle splitting. ([#35277](https://github.com/expo/expo/pull/35277) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent bumping specificity of hot-reloaded CSS style tags. ([#35123](https://github.com/expo/expo/pull/35123) by [@kitten](https://github.com/kitten))
- Unwrap PostCSS when imported ESM through require on Node 22/23. ([#35268](https://github.com/expo/expo/pull/35268) by [@byCedric](https://github.com/byCedric))
- Remove hardcoded `require` and `import` condition names to support improved Metro ESM resolution. ([#35520](https://github.com/expo/expo/pull/35520) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Fix internal monorepo types on Metro require. ([#35859](https://github.com/expo/expo/pull/35859) by [@EvanBacon](https://github.com/EvanBacon))
- Drop `fs-extra` in favor of `fs`. ([#35036](https://github.com/expo/expo/pull/35036) by [@kitten](https://github.com/kitten))
- Upgrade to `minimatch@9` ([#35313](https://github.com/expo/expo/pull/35313) by [@kitten](https://github.com/kitten))

### ⚠️ Notices

- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.19.12 - 2025-03-11

### 🐛 Bug fixes

- Fix tree shaking multiple exports in the same variable declaration. ([#35330](https://github.com/expo/expo/pull/35330) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed DOM Components support for updates. ([#35280](https://github.com/expo/expo/pull/35280), [#35290](https://github.com/expo/expo/pull/35290) by [@kudo](https://github.com/kudo))

## 0.19.11 - 2025-02-19

_This version does not introduce any user-facing changes._

## 0.19.10 - 2025-02-14

_This version does not introduce any user-facing changes._

## 0.19.9 - 2025-01-10

_This version does not introduce any user-facing changes._

## 0.19.8 - 2024-12-16

### 🐛 Bug fixes

- Make exported sourcemap paths relative on Windows. ([#33503](https://github.com/expo/expo/pull/33503) by [@byCedric](https://github.com/byCedric))

## 0.19.7 - 2024-12-10

_This version does not introduce any user-facing changes._

## 0.19.6 - 2024-12-05

### 🐛 Bug fixes

- Exclude `beforeAssetSerializationPlugins.preModules` from `stableChunkSource` ([#33344](https://github.com/expo/expo/pull/33344) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Use POSIX-formatted relative module paths to stabelize module IDs across platforms. ([#33393](https://github.com/expo/expo/pull/33393) by [@byCedric](https://github.com/byCedric))
- Use POSIX-formatted filenames when transforming CSS modules for consistent class names. ([#33394](https://github.com/expo/expo/pull/33394) by [@byCedric](https://github.com/byCedric))
- Use POSIX-formatted relative CSS asset paths for URL consistency across platforms. ([#33395](https://github.com/expo/expo/pull/33395) by [@byCedric](https://github.com/byCedric))
- Use POSIX-formatted check to handle virtual RSC module with correctly escaped client boundary paths across platforms. ([#33396](https://github.com/expo/expo/pull/33396) by [@byCedric](https://github.com/byCedric))

## 0.19.5 - 2024-11-29

### 🐛 Bug fixes

- Fixed DOM Components support on Windows. ([#33114](https://github.com/expo/expo/pull/33114) by [@kudo](https://github.com/kudo))

## 0.19.4 — 2024-11-14

_This version does not introduce any user-facing changes._

## 0.19.3 — 2024-11-13

### 🐛 Bug fixes

- Fix Expo Router root path on Windows. ([#32792](https://github.com/expo/expo/pull/32792) by [@marklawlor](https://github.com/marklawlor))

## 0.19.2 — 2024-11-13

### 🎉 New features

- Add scoped module IDs for Metro SSR. ([#32737](https://github.com/expo/expo/pull/32737) by [@EvanBacon](https://github.com/EvanBacon))

## 0.19.1 — 2024-11-12

### 🐛 Bug fixes

- Fixed `npx expo export` to support Hermes bytecode bundling. ([#32770](https://github.com/expo/expo/pull/32770) by [@kudo](https://github.com/kudo))

## 0.19.0 — 2024-11-10

### 💡 Others

- Remove clientBoundaries warning. ([#32735](https://github.com/expo/expo/pull/32735) by [@EvanBacon](https://github.com/EvanBacon))

## 0.19.0-preview.3 — 2024-11-04

_This version does not introduce any user-facing changes._

## 0.19.0-preview.2 — 2024-10-25

### 🐛 Bug fixes

- Fix CSS `url()` support for DOM IDs, public files, and data URIs. ([#32332](https://github.com/expo/expo/pull/32332) by [@EvanBacon](https://github.com/EvanBacon))
- Disable `hermesParser` and conditionally enable for files with `@flow` pragma. ([#32325](https://github.com/expo/expo/pull/32325) by [@EvanBacon](https://github.com/EvanBacon))

## 0.19.0-preview.1 — 2024-10-22

### 💡 Others

- Fixed check-package test errors. ([#32232](https://github.com/expo/expo/pull/32232) by [@kudo](https://github.com/kudo))

## 0.19.0-preview.0 — 2024-10-22

### 🛠 Breaking changes

- Emit assets as strings instead of numeric lookups when bundling for web and server environments. ([#31955](https://github.com/expo/expo/pull/31955) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add experimental support for React Server Actions in Expo Router. ([#31959](https://github.com/expo/expo/pull/31959) by [@EvanBacon](https://github.com/EvanBacon))
- add support for magic import comments to opt dynamic imports out of the dependency graph. ([#31868](https://github.com/expo/expo/pull/31868) by [@EvanBacon](https://github.com/EvanBacon))
- add support for css imports from other css files ([#31574](https://github.com/expo/expo/pull/31574) by [@EvanBacon](https://github.com/EvanBacon))
- Add virtual entry generation for DOM components on web. ([#31259](https://github.com/expo/expo/pull/31259) by [@EvanBacon](https://github.com/EvanBacon))
- Pass `isDOM` to the Babel caller for changing behavior during DOM component bundling. ([#31182](https://github.com/expo/expo/pull/31182) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for CSS in server components. ([#31073](https://github.com/expo/expo/pull/31073) by [@EvanBacon](https://github.com/EvanBacon))
- Add initial version of DOM Components and expose `expoDomComponentReference` on metadata. ([#30938](https://github.com/expo/expo/pull/30938) by [@EvanBacon](https://github.com/EvanBacon))
- Implement `require.unstable_importMaybeSync` and use it in JSResource. ([#30703](https://github.com/expo/expo/pull/30703) by [@EvanBacon](https://github.com/EvanBacon))
- Add experimental support for bundling split native chunks in production. ([#30334](https://github.com/expo/expo/pull/30334) by [@EvanBacon](https://github.com/EvanBacon))
- Added experimental support for tree shaking. ([#30111](https://github.com/expo/expo/pull/30111) by [@EvanBacon](https://github.com/EvanBacon))
- Add experimental support for transforming a virtual client boundary. ([#30534](https://github.com/expo/expo/pull/30534) by [@EvanBacon](https://github.com/EvanBacon))
- Added experimental support for production graph optimizations. ([#30417](https://github.com/expo/expo/pull/30417) by [@EvanBacon](https://github.com/EvanBacon))
- Add detection for CJS module exports for tree shaking. ([#30348](https://github.com/expo/expo/pull/30348) by [@EvanBacon](https://github.com/EvanBacon))
- Added `EXPO_USE_METRO_REQUIRE` to enable stable string module IDs. ([#30176](https://github.com/expo/expo/pull/30176) by [@EvanBacon](https://github.com/EvanBacon))
- Allow dynamic import/require statements in server bundles. ([#30175](https://github.com/expo/expo/pull/30175) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for bundling assets in React Server mode. ([#29646](https://github.com/expo/expo/pull/29646) by [@EvanBacon](https://github.com/EvanBacon))
- Disable require rename. ([#29619](https://github.com/expo/expo/pull/29619) by [@EvanBacon](https://github.com/EvanBacon))
- Add experimental React Compiler support. ([#29168](https://github.com/expo/expo/pull/29168) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix cache sharing across Expo Go and dev client. ([#31566](https://github.com/expo/expo/pull/31566) by [@EvanBacon](https://github.com/EvanBacon))
- Fix bundle split HBC paths for server manifest. ([#31491](https://github.com/expo/expo/pull/31491) by [@EvanBacon](https://github.com/EvanBacon))
- Support global CSS in tree shaking. ([#31304](https://github.com/expo/expo/pull/31304) by [@EvanBacon](https://github.com/EvanBacon))
- Update source map URL when config mutates modules. ([#30980](https://github.com/expo/expo/pull/30980) by [@EvanBacon](https://github.com/EvanBacon))
- Terminate module source maps with a null mapping [upstream](https://github.com/facebook/metro/commit/96c6b893eb77b5929b6050d7189905232ddf6d6d). ([#30701](https://github.com/expo/expo/pull/30701) by [@EvanBacon](https://github.com/EvanBacon))
- Fix Typescript type export. ([#22410](https://github.com/expo/expo/pull/22410) by [@dcposch](https://github.com/dcposch])
- Account for the entire dependency tree when creating module name hashes. ([#30512](https://github.com/expo/expo/pull/30512) by [@EvanBacon](https://github.com/EvanBacon))
- Improve missing module errors. ([#30354](https://github.com/expo/expo/pull/30354) by [@EvanBacon](https://github.com/EvanBacon))
- Fix support for defining variables named `module`, `require`, `global`, and `exports` with `experimentalImportSupport`. ([#30348](https://github.com/expo/expo/pull/30348) by [@EvanBacon](https://github.com/EvanBacon))
- Support showing the hidden entry file in chrome dev tools. ([#30113](https://github.com/expo/expo/pull/30113) by [@EvanBacon](https://github.com/EvanBacon))
- Align source map behavior with community exports. ([#29811](https://github.com/expo/expo/pull/29811) by [@EvanBacon](https://github.com/EvanBacon))
- Fix source map generation in development. ([#29463](https://github.com/expo/expo/pull/29463) by [@EvanBacon](https://github.com/EvanBacon))
- Invalidate Metro cache for monorepos with identical Expo projects. ([#29733](https://github.com/expo/expo/pull/29733) by [@byCedric](https://github.com/byCedric))
- Fix `TypeError: (0 , sourceMapString_1.default) is not a function` bug due to an incompatibiliy with `metro@0.80.10`'s `sourceMapString` module. ([#30905](https://github.com/expo/expo/pull/30905) by [@kitten](https://github.com/kitten))
- Detect workspace root for monorepos using pnpm. ([#31124](https://github.com/expo/expo/pull/31124) by [@byCedric](https://github.com/byCedric))
- Automatically configure `watchFolders` for monorepos using pnpm. ([#31973](https://github.com/expo/expo/pull/31973) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Block all `node_modules` stacks in LogBox ([#31485](https://github.com/expo/expo/pull/31485) by [@EvanBacon](https://github.com/EvanBacon))
- Fix tree shaking error. ([#30585](https://github.com/expo/expo/pull/30585) by [@EvanBacon](https://github.com/EvanBacon))
- Fork collectDependencies to support customizations for tree shaking and RSC. ([#30140](https://github.com/expo/expo/pull/30140) by [@EvanBacon](https://github.com/EvanBacon))
- Rework mini-metro tests to support full transformation. ([#29980](https://github.com/expo/expo/pull/29980) by [@EvanBacon](https://github.com/EvanBacon))
- Downgrade routerRoot warning to a debug log. ([#29812](https://github.com/expo/expo/pull/29812) by [@EvanBacon](https://github.com/EvanBacon))
- Upgrade `glob@7` to `glob@10`. ([#29929](https://github.com/expo/expo/pull/29929) by [@byCedric](https://github.com/byCedric))

### ⚠️ Notices

- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.18.4 — 2024-05-16

_This version does not introduce any user-facing changes._

## 0.18.3 — 2024-04-25

_This version does not introduce any user-facing changes._

## 0.18.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 0.18.1 — 2024-04-19

_This version does not introduce any user-facing changes._

## 0.18.0 — 2024-04-18

### 🛠 Breaking changes

- Fully remove "exotic" transformer (`@expo/metro-config/transformer`) in favor of the default Expo transformer. ([#27855](https://github.com/expo/expo/pull/27855) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add basic `react-server` support. ([#27264](https://github.com/expo/expo/pull/27264) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for splitting on `require.resolveWeak` syntax. ([#27014](https://github.com/expo/expo/pull/27014) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix serializer creating async imports to the main entrypoint, which could cause an infinite loop of loading the entrypoint bundle. ([#28016](https://github.com/expo/expo/pull/28016) by [@kitten](https://github.com/kitten))

### 💡 Others

- Add unstable environment variable to disable bundle splitting. ([#27932](https://github.com/expo/expo/pull/27932) by [@EvanBacon](https://github.com/EvanBacon))
- Use `typeof window` checks for removing server code. ([#27514](https://github.com/expo/expo/pull/27514) by [@EvanBacon](https://github.com/EvanBacon))
- Uncomment all Metro tests. ([#26610](https://github.com/expo/expo/pull/26610) by [@EvanBacon](https://github.com/EvanBacon))
- Add `db` to the default `resolver.assetExts` to support `expo-sqlite`. ([#28290](https://github.com/expo/expo/pull/28290) by [@kudo](https://github.com/kudo))

## 0.17.6 - 2024-03-07

_This version does not introduce any user-facing changes._

## 0.17.5 - 2024-02-27

### 🎉 New features

- Add `--no-bytecode` flag to `expo export` to disable generating Hermes bytecode for use with debugging tools. ([#26985](https://github.com/expo/expo/pull/26985) by [@EvanBacon](https://github.com/EvanBacon))

## 0.17.4 - 2024-02-06

### 💡 Others

- Add more node modules to collapsed stack regex. ([#26812](https://github.com/expo/expo/pull/26812) by [@EvanBacon](https://github.com/EvanBacon))
- Remove lazy loading in build process for easier development. ([#26559](https://github.com/expo/expo/pull/26559) by [@EvanBacon](https://github.com/EvanBacon))

## 0.17.3 - 2024-01-18

### 🐛 Bug fixes

- Pin `sucrase@3.34.0` to avoid yarn v1 incompatibilities with `@isaacs/cliui` module aliases ([#26459](https://github.com/expo/expo/pull/26459) by [@byCedric](https://github.com/byCedric))

## 0.17.2 - 2024-01-15

### 💡 Others

- Bump `postcss` to 8.4.32. ([#26385](https://github.com/expo/expo/pull/26385) by [@EvanBacon](https://github.com/EvanBacon))

## 0.17.1 - 2023-12-19

### 🎉 New features

- Add plugin callbacks that run before each code asset is serialized. ([#25859](https://github.com/expo/expo/pull/25859) by [@quinlanj](https://github.com/quinlanj))

### 🐛 Bug fixes

- Fix matching async chunks with special characters in the file names. ([#26008](https://github.com/expo/expo/pull/26008) by [@EvanBacon](https://github.com/EvanBacon))
- Add missing `glob` dependency. ([#26020](https://github.com/expo/expo/pull/26020) by [@byCedric](https://github.com/byCedric))
- Add missing `@expo/spawn-async` dependency. ([#26021](https://github.com/expo/expo/pull/26021) by [@byCedric](https://github.com/byCedric))
- Add missing `fs-extra` dependency. ([#26022](https://github.com/expo/expo/pull/26022) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Improve bundle splitting by reducing duplicate dependencies. ([#26010](https://github.com/expo/expo/pull/26010) by [@EvanBacon](https://github.com/EvanBacon))

## 0.17.0 — 2023-12-15

### 🎉 New features

- Add `debugId` annotations automatically. ([#25935](https://github.com/expo/expo/pull/25935) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Unpin minor upgrades for `@babel/generator` to `^7.20.5`. ([#25872](https://github.com/expo/expo/pull/25872) by [@kitten](https://github.com/kitten))
- Remove extraneous Babel pass. ([#25930](https://github.com/expo/expo/pull/25930) by [@kitten](https://github.com/kitten))

## 0.16.1 — 2023-12-13

### 🛠 Breaking changes

- Remove `loadAsync` method and prevent loading default config twice. ([#25861](https://github.com/expo/expo/pull/25861) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix bundle splitting and async routes. ([#25901](https://github.com/expo/expo/pull/25901) by [@EvanBacon](https://github.com/EvanBacon))

## 0.16.0 — 2023-12-12

### 🛠 Breaking changes

- Moved `react-refresh` babel plugin from Metro to `babel-preset-expo`. ([#25461](https://github.com/expo/expo/pull/25461) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Fork entire `metro-transform-worker` and remove redundant steps. ([#25833](https://github.com/expo/expo/pull/25833) by [@EvanBacon](https://github.com/EvanBacon))
- Eagerly load async chunks with async web routes. ([#25627](https://github.com/expo/expo/pull/25627) by [@EvanBacon](https://github.com/EvanBacon))
- Add custom Expo Router root directory support with full cache invalidation on server reset. ([#25658](https://github.com/expo/expo/pull/25658) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Fix common chunk loading order. ([#25831](https://github.com/expo/expo/pull/25831) by [@EvanBacon](https://github.com/EvanBacon))
- Infer missing transform options for redirected requests from react native clients without `expo-dev-client`. ([#25686](https://github.com/expo/expo/pull/25686) by [@EvanBacon](https://github.com/EvanBacon))
- Add missing dependency. ([#25446](https://github.com/expo/expo/pull/25446) by [@douglowder](https://github.com/douglowder))
- Resolve all module references from the default `metro-config`. ([#25804](https://github.com/expo/expo/pull/25804) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Revert enabling inline requires by default. ([#25680](https://github.com/expo/expo/pull/25680) by [@EvanBacon](https://github.com/EvanBacon))
- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25421](https://github.com/expo/expo/pull/25421) by [@byCedric](https://github.com/byCedric))

## 0.15.0 — 2023-11-14

### 🛠 Breaking changes

- Pass assets and artifacts back from static serializer. This cannot be used with older versions of Expo CLI. ([#25312](https://github.com/expo/expo/pull/25312) by [@EvanBacon](https://github.com/EvanBacon))
- Drop support for running arbitrary Metro packages. ([#25197](https://github.com/expo/expo/pull/25197) by [@EvanBacon](https://github.com/EvanBacon))
- Enable `inlineRequires` by default. ([#25089](https://github.com/expo/expo/pull/25089) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Use multi-bundle output serializer for all exports. ([#25369](https://github.com/expo/expo/pull/25369) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for Tailwind with PostCSS. ([#25339](https://github.com/expo/expo/pull/25339) by [@EvanBacon](https://github.com/EvanBacon))
- Expose new FileStore superclass with `@expo/metro-config/file-store`. ([#25339](https://github.com/expo/expo/pull/25339) by [@EvanBacon](https://github.com/EvanBacon))
- Rename `basePath` to `baseUrl` and expose to bundles with `process.env.EXPO_BASE_URL`. ([#25305](https://github.com/expo/expo/pull/25305) by [@EvanBacon](https://github.com/EvanBacon))
- Pass `isDev` to the Babel caller. ([#25125](https://github.com/expo/expo/pull/25125) by [@EvanBacon](https://github.com/EvanBacon))
- Ignore stack traces from whatwg modules. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Disable bundle splitting on native platforms. ([#25366](https://github.com/expo/expo/pull/25366) by [@EvanBacon](https://github.com/EvanBacon))
- Ensure the `react-native` exports condition is not used on web. ([#25260](https://github.com/expo/expo/pull/25260) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Collapse re-export of `react-native/Libraries/Image/AssetRegistry` to `@react-native/assets-registry/registry`. ([#25265](https://github.com/expo/expo/pull/25265) by [@EvanBacon](https://github.com/EvanBacon))
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
- Enable `EXPO_USE_METRO_WORKSPACE_ROOT` by default and replace with `EXPO_NO_METRO_WORKSPACE_ROOT`. ([#30621](https://github.com/expo/expo/pull/30621) by [@byCedric](https://github.com/byCedric))

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
