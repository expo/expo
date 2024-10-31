# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Remove `updates` and `jsEngine` from unintentionally-not-CNG check, since they are used by non-native code as well ([#322006](https://github.com/expo/expo/pull/322006) by [@keith-kurak](https://github.com/keith-kurak))

### 💡 Others

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
