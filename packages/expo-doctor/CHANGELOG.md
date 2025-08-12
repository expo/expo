# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add a check for required peer dependencies ([#38445](https://github.com/expo/expo/pull/38445) by [@kadikraman](https://github.com/kadikraman))
- Add check that detects duplicated native modules ([#38683](https://github.com/expo/expo/pull/38683) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

### 💡 Others

- Switch Metro imports to `@expo/metro` wrapper package ([#38166](https://github.com/expo/expo/pull/38166) by [@kitten](https://github.com/kitten))
- Add missing packages to `DirectPackageInstallCheck` ([#38701](https://github.com/expo/expo/pull/38701) by [@kitten](https://github.com/kitten))
- Hide "no metadata available" for React Native Directory output if it's the only reported issue ([#38728](https://github.com/expo/expo/pull/38728) by [@kitten](https://github.com/kitten))

## 1.13.5 - 2025-07-03

_This version does not introduce any user-facing changes._

## 1.13.4 - 2025-07-01

### 🐛 Bug fixes

- Update to `getenv@2.0.0` to support upper case boolean environment variables ([#36688](https://github.com/expo/expo/pull/36688) by [@stephenlacy](https://github.com/stephenlacy))

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 1.13.3 — 2025-05-06

_This version does not introduce any user-facing changes._

## 1.13.2 — 2025-04-30

_This version does not introduce any user-facing changes._

## 1.13.1 — 2025-04-25

_This version does not introduce any user-facing changes._

## 1.13.0 — 2025-04-22

### 🎉 New features

- Add new check for compatible Xcode version. ([#32130](https://github.com/expo/expo/pull/35961) by [@betomoedano](https://github.com/betomoedano))

## 1.12.11 — 2025-04-21

### 💡 Others

- Formatting improvements. ([#36151](https://github.com/expo/expo/pull/36151) by [@keith-kurak](https://github.com/keith-kurak))
- Exclude `@expo/*` packages from the New Architecture compatibility check. ([#36175](https://github.com/expo/expo/pull/36175) by [@Simek](https://github.com/Simek))

## 1.12.10 — 2025-04-14

_This version does not introduce any user-facing changes._

## 1.12.9 — 2025-04-08

### 💡 Others

- Added `.env` support. ([#33988](https://github.com/expo/expo/pull/33988) by [@kudo](https://github.com/kudo))

## 1.12.8 — 2025-03-13

### 💡 Others

- Drop `fast-glob` in favor of `glob`. ([#35082](https://github.com/expo/expo/pull/35082) by [@kitten](https://github.com/kitten))
- Output formatting improvements ([#35483](https://github.com/expo/expo/pull/35483) by [@keith-kurak](https://github.com/keith-kurak))

## 1.12.7 — 2025-02-14

### 💡 Others

- Fix false positives on Metro config check ([#34934](https://github.com/expo/expo/pull/34934) by [@keith-kurak](https://github.com/keith-kurak))

## 1.12.6 — 2025-02-13

### 🐛 Bug fixes

- Handle gitignore checks when git is unavailable. e.g. EAS Build. ([#32130](https://github.com/expo/expo/pull/32833) by [@betomoedano](https://github.com/betomoedano))

### 💡 Others

- Change metro.config check to look for custom transformer key instead of asset plugin. ([#34208](https://github.com/expo/expo/pull/34208) by [@EvanBacon](https://github.com/EvanBacon))
- Removed cmd.exe warning. ([#33357](https://github.com/expo/expo/pull/33357) by [@keith-kurak](https://github.com/keith-kurak))
- Exclude `@expo-google-fonts/*` packages from the New Architecture compatibility check. ([#34127](https://github.com/expo/expo/pull/34127) by [@Simek](https://github.com/Simek))
- Only show errors by default, add --verbose flag to see all passed checks. ([#34729](https://github.com/expo/expo/pull/34729) by [@keith-kurak](https://github.com/keith-kurak))

## 1.12.4 — 2024-11-14

_This version does not introduce any user-facing changes._

## 1.12.3 — 2024-11-05

### 🐛 Bug fixes

- Avoid using path mutations in glob patterns for Windows. ([#32617](https://github.com/expo/expo/pull/32617) by [@byCedric](https://github.com/byCedric))

## 1.12.2 — 2024-10-31

### 🐛 Bug fixes

- Remove `updates` and `jsEngine` from unintentionally-not-CNG check, since they are used by non-native code as well ([#322006](https://github.com/expo/expo/pull/322006) by [@keith-kurak](https://github.com/keith-kurak))

## 1.12.1 — 2024-10-31

### 🐛 Bug fixes

- Fix crash when using config plugins with an entry point other than app.plugin.js ([#32130](https://github.com/expo/expo/pull/32443) by [@keith-kurak](https://github.com/keith-kurak))

## 1.12.0 — 2024-10-25

### 🎉 New features

- Add support to disable appConfigFieldsNotSyncedCheck via package.json. ([#32130](https://github.com/expo/expo/pull/32130) by [@betomoedano](https://github.com/betomoedano))

### 💡 Others

- Added a ternary check to validate if the project uses EAS; if so, it displays the relevant EAS documentation. ([#32126](https://github.com/expo/expo/pull/32126) by [@betomoedano](https://github.com/betomoedano))

## 1.11.3 — 2024-10-22

_This version does not introduce any user-facing changes._

## 1.11.2 — 2024-10-17

### 🐛 Bug fixes

- Re-enable `--minify` flag for ncc and add try-catch for better error handling. ([#32218](https://github.com/expo/expo/pull/32218) by [@betomoedano](https://github.com/betomoedano))
- Fix project setup check running on EAS Build and failing ([#32106](https://github.com/expo/expo/pull/32106) by [@brentvatne](https://github.com/brentvatne))

## 1.11.1 — 2024-10-15

### 🐛 Bug fixes

- Remove `--minify` from ncc for now, in order to prevent log spam on errors.

## 1.11.0 — 2024-10-15

### 🎉 New features

- Show more info on network errors, allow overriding of network errors ([#31926](https://github.com/expo/expo/pull/31926) by [@keith-kurak](https://github.com/keith-kurak))
- Add support for `.easignore` files when performing project validations. ([#31334](https://github.com/expo/expo/pull/31334) by [@betomoedano](https://github.com/betomoedano))

### 🐛 Bug fixes

- fix conditional on iOS non-CNG check ([#31920](https://github.com/expo/expo/pull/31920) by [@keith-kurak](https://github.com/keith-kurak))

## 1.10.1 — 2024-08-28

### 🐛 Bug fixes

- Fix error when `expo-build-properties` is present but `android` key is not. ([#31228](https://github.com/expo/expo/pull/31228) by [@keith-kurak](https://github.com/keith-kurak))

## 1.10.0 — 2024-08-27

### 🎉 New features

- Warn if project is incompatible with upcoming Play Store Android API level requirements. ([#31067](https://github.com/expo/expo/pull/31067) by [@keith-kurak](https://github.com/keith-kurak))

## 1.9.1 — 2024-08-16

### 💡 Others

- Add check for native folders and configuration fields in app.json. This warns that EAS Build will not sync the fields if the native folders are present. ([#30817](https://github.com/expo/expo/pull/30817) by [@betomoedano](https://github.com/betomoedano))

## 1.9.0 — 2024-07-26

### 🐛 Bug fixes

- Drop `node-fetch` in favor of Node built-in `fetch` to support Node 22. ([#30551](https://github.com/expo/expo/pull/30551) by [@byCedric](https://github.com/byCedric))
- Add missing dependencies `fast-glob`, `getenv`, and `terminal-link`. ([#30551](https://github.com/expo/expo/pull/30551) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Rename `directoryCheck` to `reactNativeDirectoryCheck`. ([#30647](https://github.com/expo/expo/pull/30647) by [@brentvatne](https://github.com/brentvatne))

## 1.8.2 — 2024-07-19

### 💡 Others

- Make directory checks more configurable in package.json and improve check message. ([#30538](https://github.com/expo/expo/pull/30538) by [@brentvatne](https://github.com/brentvatne))

## 1.8.1 — 2024-07-19

### 🐛 Bug fixes

- Change default ignore to string for react-native rather than regex. ([#30532](https://github.com/expo/expo/pull/30532) by [@brentvatne](https://github.com/brentvatne))

## 1.8.0 — 2024-07-19

### 🎉 New features

- List unvalidated packages in directory check. Add `expo.doctor.directoryCheck.exclude` to **package.json** config to skip validating packages entirely. ([#30517](https://github.com/expo/expo/pull/30517) by [@brentvatne](https://github.com/brentvatne))

## 1.7.0 — 2024-07-18

### 🎉 New features

- Add experimental check to validate packages against known issues in React Native Directory. Enable it with `EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK=1`. ([#30496](https://github.com/expo/expo/pull/30496) by [@brentvatne](https://github.com/brentvatne))

## 1.6.1 — 2024-05-16

_This version does not introduce any user-facing changes._

## 1.6.0 — 2024-05-01

### 🎉 New features

- Check if local modules native code is unintentionally gitignored ([#28484](https://github.com/expo/expo/pull/28484) by [@keith-kurak](https://github.com/keith-kurak))

### 🐛 Bug fixes

- Fix failed deep dependency checks when using npm@~10.6+ ([#28563](https://github.com/expo/expo/pull/28563) by [@keith-kurak](https://github.com/keith-kurak))

## 1.5.2 — 2024-04-24

### 🐛 Bug fixes

- Fix error when fetching schema for unpublished SDK versions ([#28204](https://github.com/expo/expo/pull/28204) by [@leonhh](https://github.com/leonhh))

## 1.5.1 — 2024-04-18

### 🐛 Bug fixes

- Skip Cocoapods version check when not on macOS ([#27751](https://github.com/expo/expo/pull/27751) by [@keith-kurak](https://github.com/keith-kurak))

## 1.5.0 — 2024-03-06

### 🎉 New features

- Warn if using Cocoapods versions 1.15.0 or 1.15.1. ([#26966](https://github.com/expo/expo/pull/26966) by [@keith-kurak](https://github.com/keith-kurak))

### 🐛 Bug fixes

- Fixed vulnerability with update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 1.4.0 — 2024-02-05

### 🎉 New features

- Added a check for expo-permissions in SDK50 as it will break the Android build if present ([#26929](https://github.com/expo/expo/pull/26929) by [@TomOConnor95](https://github.com/TomOConnor95))
- Check if a custom metro config doesn't extend @expo/metro-config. ([#26860](https://github.com/expo/expo/pull/26860) by [@keith-kurak](https://github.com/keith-kurak))
- Look for metro-config in deep dependency check, warn if inside resolutions. ([#26854](https://github.com/expo/expo/pull/26854) by [@keith-kurak](https://github.com/keith-kurak))

## 1.3.0 — 2023-12-15

### 🎉 New features

- Allow skipping dependency version check. ([#25822](https://github.com/expo/expo/pull/25822) by [@floatplane](https://github.com/floatplane))

## 1.2.0 — 2023-12-12

### 💡 Others

- Report if project has unused static config. ([#25674](https://github.com/expo/expo/pull/25674) by [@keith-kurak](https://github.com/keith-kurak))

## 1.1.6 — 2023-12-12

_This version does not introduce any user-facing changes._

## 1.1.5 — 2023-12-06

### 🐛 Bug fixes

- Fix bin command. ([#25672](https://github.com/expo/expo/pull/25672) by [@keith-kurak](https://github.com/keith-kurak))

## 1.1.4 — 2023-11-30

### 💡 Others

- Move package from `expo/expo-cli` to `expo/expo`. ([#25503](https://github.com/expo/expo/pull/25503) by [@keith-kurak](https://github.com/keith-kurak))
