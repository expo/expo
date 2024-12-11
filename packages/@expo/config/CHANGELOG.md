# Changelog

## Unpublished

### 🛠 Breaking changes

- Remove getAccountUsername from package exports ([#33249](https://github.com/expo/expo/pull/33249) by [@wschurman](https://github.com/wschurman))

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

- Drop unintentional `console.log` when modifying config. ([#33330](https://github.com/expo/expo/pull/33330) by [@byCedric](https://github.com/byCedric))

## 10.0.5 — 2024-11-20

_This version does not introduce any user-facing changes._

## 10.0.4 — 2024-11-14

### 🐛 Bug fixes

- Skip modifying the plugins array in app.json when using a dynamic app config as well ([#32882](https://github.com/expo/expo/pull/32882) by [@brentvatne](https://github.com/brentvatne))

## 10.0.3 — 2024-11-11

_This version does not introduce any user-facing changes._

## 10.0.2 — 2024-10-28

### 🐛 Bug fixes

- Properly handle app manifest plugin modifications. ([#32405](https://github.com/expo/expo/pull/32405) by [@byCedric](https://github.com/byCedric))

## 10.0.1 — 2024-10-25

### 💡 Others

- Bump `sucrase@3.34.0` to `sucrase@3.35.0` to to remove transitive dependency on `glob@7` ([#32274](https://github.com/expo/expo/pull/32274) by [@kitten](https://github.com/kitten))

## 10.0.0 — 2024-10-22

### 🛠 Breaking changes

- Change the `config` return type from `AppJSONConfig` to `ExpoConfig` in `modifyConfigAsync`. ([#30783](https://github.com/expo/expo/pull/30783) by [@byCedric](https://github.com/byCedric))

### 🎉 New features

- Automatically write an `app.json` when attempting to modify a config and no file exists. ([#30026](https://github.com/expo/expo/pull/30026) by [@EvanBacon](https://github.com/EvanBacon))
- Add `resolveRelativeEntryPoint` that takes possible server root into account. ([#30633](https://github.com/expo/expo/pull/30633) by [@byCedric](https://github.com/byCedric))
- Export `getMetroServerRoot` method for monorepo root detection with bun, npm, pnpm, and yarn. ([#31124](https://github.com/expo/expo/pull/31124) by [@byCedric](https://github.com/byCedric))
- Add support for static and extending dynamic config modifications. ([#30782](https://github.com/expo/expo/pull/30782) by [@byCedric](https://github.com/byCedric))
- Add `getMetroWorkspaceGlobs` helper to set up pnpm monorepos properly. ([#31973](https://github.com/expo/expo/pull/31973) by [@byCedric](https://github.com/byCedric))

### 🐛 Bug fixes

- Move entry point path modifications to Node script instead of Gradle plugin. ([#30654](https://github.com/expo/expo/pull/30654) by [@byCedric](https://github.com/byCedric))
- Enable web as a default platform when `react-dom` is installed. ([#32149](https://github.com/expo/expo/pull/32149) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Upgrade `glob@7` to `glob@10`. ([#30425](https://github.com/expo/expo/pull/30425) by [@byCedric](https://github.com/byCedric))

## 9.0.2 — 2024-05-16

_This version does not introduce any user-facing changes._

## 9.0.1 — 2024-04-24

### 🎉 New features

- Added warning when extraneous top-level keys are ignored in the final config. ([#28399](https://github.com/expo/expo/pull/28399) by [@EvanBacon](https://github.com/EvanBacon))

## 9.0.0 — 2024-04-18

### 💡 Others

- Update unversioned expo config types. ([#28220](https://github.com/expo/expo/pull/28220) by [@wschurman](https://github.com/wschurman))

## 9.0.0-beta.0 — 2024-04-17

### 📚 3rd party library updates

- update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 8.5.4 - 2024-01-18

### 🐛 Bug fixes

- Pin `sucrase@3.34.0` to avoid yarn v1 incompatibilities with `@isaacs/cliui` module aliases ([#26459](https://github.com/expo/expo/pull/26459) by [@byCedric](https://github.com/byCedric))

## 8.5.3 - 2024-01-05

_This version does not introduce any user-facing changes._

## 8.5.2 - 2023-12-19

_This version does not introduce any user-facing changes._

## 8.5.1 — 2023-12-15

_This version does not introduce any user-facing changes._

## 8.5.0 — 2023-12-12

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25416](https://github.com/expo/expo/pull/25416) by [@byCedric](https://github.com/byCedric))

## 8.4.0 — 2023-10-17

- Warn when dynamic config doesn't use static config present in project. ([#24308](https://github.com/expo/expo/pull/24308) by [@keith-kurak](https://github.com/keith-kurak))

### 🛠 Breaking changes

- Remove `getEntryPoint`, `getEntryPointWithExtensions`, `resolveFromSilentWithExtensions` functions from `@expo/config/paths`. ([#24688](https://github.com/expo/expo/pull/24688) by [@EvanBacon](https://github.com/EvanBacon))
- Fully drop support for `expo.entryFile` in the `app.json`. ([#24688](https://github.com/expo/expo/pull/24688) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed the `withAnonymous` config plugins' property name for anonymous raw functions. ([#24363](https://github.com/expo/expo/pull/24363) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite `resolveEntryPoint` from `@expo/config/paths`. ([#21725](https://github.com/expo/expo/pull/21725) by [@EvanBacon](https://github.com/EvanBacon))

## 8.3.1 — 2023-09-15

_This version does not introduce any user-facing changes._

## 8.3.0 — 2023-09-04

### 🛠 Breaking changes

- Remove classic manifest types. ([#24054](https://github.com/expo/expo/pull/24054) by [@wschurman](https://github.com/wschurman))

## 8.2.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 8.2.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 8.1.1 — 2023-06-27

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 8.1.0 — 2023-06-21

_This version does not introduce any user-facing changes._

## 8.0.4 — 2023-05-08

### 🐛 Bug fixes

- Drop `entryPoint` usage. ([#22416](https://github.com/expo/expo/pull/22416) by [@EvanBacon](https://github.com/EvanBacon))

## 8.0.3 — 2023-05-08

### 🐛 Bug fixes

- Make `exp` type optional in `resolveEntryPoint`. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))

## 8.0.1 — 2023-02-09

### 🛠 Breaking changes

- Remove originalFullName currentFullName hack from exported config. ([#21070](https://github.com/expo/expo/pull/21070) by [@wschurman](https://github.com/wschurman))

## 8.0.0 — 2023-02-03

### 🛠 Breaking changes

- Assert that use of `expo.entryPoint` is not supported (never has been outside of classic builds). ([#20891](https://github.com/expo/expo/pull/20891) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Bump `@expo/json-file`, `@expo/plist`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
