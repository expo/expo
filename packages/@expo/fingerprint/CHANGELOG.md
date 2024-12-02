# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.11.3 — 2024-12-02

### 🐛 Bug fixes

- Fixed `USE_RNCORE_AUTOLINKING_FROM_EXPO does not exist and no fallback value provided.` error. ([#33323](https://github.com/expo/expo/pull/33323) by [@kudo](https://github.com/kudo))
- Fixed a directory be entirely ignored even if there is negated pattern like `!**/dir/file`. ([#33324](https://github.com/expo/expo/pull/33324) by [@kudo](https://github.com/kudo))

## 0.11.2 — 2024-11-04

### 🎉 New features

- Show more information in fingerprint diff ([#32486](https://github.com/expo/expo/pull/32486) by [@wschurman](https://github.com/wschurman))
- Add ability to diff two fingeprint files to CLI ([#32488](https://github.com/expo/expo/pull/32488) by [@wschurman](https://github.com/wschurman))
- Create more formalized CLI ([#32541](https://github.com/expo/expo/pull/32541) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Add function signature stability test ([#32493](https://github.com/expo/expo/pull/32493) by [@quinlanj](https://github.com/quinlanj))
- Convert cli to typescript ([#32487](https://github.com/expo/expo/pull/32487) by [@wschurman](https://github.com/wschurman))

## 0.11.1 — 2024-10-22

### 💡 Others

- Fixed check-package test errors. ([#32232](https://github.com/expo/expo/pull/32232) by [@kudo](https://github.com/kudo))

## 0.11.0 — 2024-10-22

### 🛠 Breaking changes

- This version includes fingerprint result breaking changes. ([#31638](https://github.com/expo/expo/pull/31638) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Added `useRNCoreAutolinkingFromExpo` option to support react-native core autolinking from `expo-modules-autolinking. ([#31638](https://github.com/expo/expo/pull/31638) by [@kudo](https://github.com/kudo))

### 💡 Others

- Upgrade `glob@7` to `glob@10`. ([#29927](https://github.com/expo/expo/pull/29927) by [@byCedric](https://github.com/byCedric))
- Set `enableReactImportsPatcher` as false by default from Expo SDK 52. ([#31728](https://github.com/expo/expo/pull/31728) by [@kudo](https://github.com/kudo))

## 0.10.3 - 2024-08-07

### 🎉 New features

- Added support to pass string array for `sourceSkips` in the `fingerprint.config.js`. ([#30754](https://github.com/expo/expo/pull/30754) by [@kudo](https://github.com/kudo))
- Added `ignorePaths` support to `fingerprint.config.js`. ([#30768](https://github.com/expo/expo/pull/30768) by [@kudo](https://github.com/kudo))

### 💡 Others

- Ignored nested node_modules by default. ([#30768](https://github.com/expo/expo/pull/30768) by [@kudo](https://github.com/kudo))
- Improved performance from matching ignoredPaths. ([#30784](https://github.com/expo/expo/pull/30784) by [@kudo](https://github.com/kudo))

## 0.10.2 - 2024-07-22

### 🐛 Bug fixes

- Fixed `fingerprint.config.js` loading error on EAS build. ([#30505](https://github.com/expo/expo/pull/30505) by [@kudo](https://github.com/kudo))

## 0.10.1 - 2024-07-15

### 🐛 Bug fixes

- Fixed broken `SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun`. ([#30344](https://github.com/expo/expo/pull/30344) by [@kudo](https://github.com/kudo))

## 0.10.0 - 2024-06-20

### 🛠 Breaking changes

- `diffFingerprints()` and `diffFingerprintChangesAsync()` have new output structure. ([#29709](https://github.com/expo/expo/pull/29709) by [@kudo](https://github.com/kudo))
- This version includes fingerprint result breaking changes because `SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun` is enabled by default. ([#29679](https://github.com/expo/expo/pull/29679) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed `diffFingerprints()` missing some items when the second fingerprint has fewer items than the first fingerprint. ([#29709](https://github.com/expo/expo/pull/29709) by [@kudo](https://github.com/kudo))
- Fixed Expo config sourcer using incorrect `cwd` by ([#29810](https://github.com/expo/expo/pull/29810) by [@a-gierczak](https://github.com/a-gierczak))
- Introduced `enableReactImportsPatcher` to fix inconsistent fingerprint hash between workflows. ([#29660](https://github.com/expo/expo/pull/29660) by [@kudo](https://github.com/kudo))
- Introduced `SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun` to fix inconsistent fingerprint for expo-updates. ([#29679](https://github.com/expo/expo/pull/29679) by [@kudo](https://github.com/kudo))

## 0.9.0 — 2024-06-05

### 🛠 Breaking changes

- Include `runtimeVersion` back to fingerprint. Use `SourceSkips.ExpoConfigRuntimeVersionIfString` to keep original behavior. ([#28712](https://github.com/expo/expo/pull/28712) by [@kudo](https://github.com/kudo))

## 0.8.0 — 2024-05-15

### 🎉 New features

- Added `fingerprint.config.js` support for a project to customize some options. ([#28860](https://github.com/expo/expo/pull/28860) by [@kudo](https://github.com/kudo))
- Added `sourceSkips` support to skip specific sourcers from fingerprint. ([#28712](https://github.com/expo/expo/pull/28712) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed missing community CLI autolinking source when it returns null values. ([#28835](https://github.com/expo/expo/pull/28835) by [@kudo](https://github.com/kudo))

## 0.7.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 0.7.0 — 2024-04-18

### 🎉 New features

- Add silent option. ([#27325](https://github.com/expo/expo/pull/27325) by [@wschurman](https://github.com/wschurman))
- Add debug option to enable verbose debug output. ([#27457](https://github.com/expo/expo/pull/27457) by [@wschurman](https://github.com/wschurman))
- Added sourcer for `patch-project` patches support. ([#27653](https://github.com/expo/expo/pull/27653) by [@kudo](https://github.com/kudo))
- [CLI] Enable debug info when `process.env.DEBUG` is defined. ([#27662](https://github.com/expo/expo/pull/27662) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix fingerprint of ios (xcode projects). ([#26901](https://github.com/expo/expo/pull/26901) by [@wschurman](https://github.com/wschurman))
- Fix inconsistent hashes for autolinking. ([#27390](https://github.com/expo/expo/pull/27390) by [@wschurman](https://github.com/wschurman))
- Fixed expo-modules-autolinking sourcer missing some packages on iOS. ([#27442](https://github.com/expo/expo/pull/27442) by [@kudo](https://github.com/kudo))
- Add more default android ignores that differ per machine. ([#27577](https://github.com/expo/expo/pull/27577) by [@wschurman](https://github.com/wschurman))
- Added `react-native` package.json to fingerprint. **This will typically introduce fingerprint result breaking changes**. ([#27657](https://github.com/expo/expo/pull/27657) by [@kudo](https://github.com/kudo))
- Exclude `chalk` and `picocolors` packages from fingerprint. **This will introduce fingerprint result breaking changes**. ([#27760](https://github.com/expo/expo/pull/27760) by [@kudo](https://github.com/kudo))
- Add more default excludes for various xcode files. ([#28166](https://github.com/expo/expo/pull/28166) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Remove runtimeVersion from ignore normalization of expo config when policy. ([#27141](https://github.com/expo/expo/pull/27141) by [@wschurman](https://github.com/wschurman))

## 0.6.0 — 2023-12-12

_This version does not introduce any user-facing changes._

## 0.5.0 — 2023-11-27

### 🎉 New features

- Add CLI parameter for diffing with an existing fingerprint file. ([#25565](https://github.com/expo/expo/pull/25565) by [@brentvatne](https://github.com/brentvatne))

### 🐛 Bug fixes

- Fixed an issue that the whole react-native-community autolinking sources are missing when one library does not enable autolinking on a platform. ([#25542](https://github.com/expo/expo/pull/25542) by [@alfonsocj](https://github.com/alfonsocj))

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25420](https://github.com/expo/expo/pull/25420) by [@byCedric](https://github.com/byCedric))

## 0.4.1 — 2023-11-14

_This version does not introduce any user-facing changes._

## 0.4.0 — 2023-10-17

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.0 — 2023-09-20

### 🛠 Breaking changes

- This version includes fingerprint result breaking changes. ([#24520](https://github.com/expo/expo/pull/24520) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Improve fingerprint sourcing scope for local config-plugins. ([#24520](https://github.com/expo/expo/pull/24520) by [@kudo](https://github.com/kudo))

## 0.2.0 — 2023-09-08

### 🛠 Breaking changes

- Normalize Expo config and remove `runtimeVersion` from fingerprint. Note that the fingerprint result will be changed from this version. ([#24290](https://github.com/expo/expo/pull/24290) by [@Kudo](https://github.com/kudo))

### 🎉 New features

- Added `options.ignorePaths` and **.fingerprintignore** to support. ([#24265](https://github.com/expo/expo/pull/24265) by [@Kudo](https://github.com/kudo))

## 0.1.0 — 2023-08-29

### 🛠 Breaking changes

- The fingerprint result is changed since this version. ([24097](https://github.com/expo/expo/pull/24097) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Added `diffFingerprints()` to support diff for two fingerprints. ([24097](https://github.com/expo/expo/pull/24097) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed non-deterministic hash if packages hoisted from monorepo. ([24097](https://github.com/expo/expo/pull/24097) by [@kudo](https://github.com/kudo))
