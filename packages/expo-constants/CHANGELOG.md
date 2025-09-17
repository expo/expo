# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 18.0.9 — 2025-09-16

_This version does not introduce any user-facing changes._

## 18.0.8 — 2025-09-10

_This version does not introduce any user-facing changes._

## 18.0.7 — 2025-09-02

_This version does not introduce any user-facing changes._

## 18.0.6 — 2025-08-31

_This version does not introduce any user-facing changes._

## 18.0.5 — 2025-08-27

_This version does not introduce any user-facing changes._

## 18.0.4 — 2025-08-25

_This version does not introduce any user-facing changes._

## 18.0.3 — 2025-08-21

_This version does not introduce any user-facing changes._

## 18.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 18.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 18.0.0 — 2025-08-13

### 🐛 Bug fixes

- Remove invalid import from expo-dev-launcher. ([#37558](https://github.com/expo/expo/pull/37558) by [@douglowder](https://github.com/douglowder))
- Fix check-packages warning. ([#37570](https://github.com/expo/expo/pull/37570) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- [iOS] forward PROJECT_ROOT env var to app config script ([#38208](https://github.com/expo/expo/pull/38208) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 17.1.7 - 2025-07-03

_This version does not introduce any user-facing changes._

## 17.1.6 — 2025-05-06

_This version does not introduce any user-facing changes._

## 17.1.5 — 2025-05-01

_This version does not introduce any user-facing changes._

## 17.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 17.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 17.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 17.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 17.1.0 — 2025-04-04

### 🛠 Breaking changes

- Bump minimum macOS version to 11.0. ([#34980](https://github.com/expo/expo/pull/34980) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Add missing types to package exports ([#35223](https://github.com/expo/expo/pull/35223) by [@timostroehlein](https://github.com/timostroehlein))

### 💡 Others

- [android][ios] Updated Gradle build and Podspec files to ensure app.json/app.config.js values are correctly updated during each native build. ([#34228](https://github.com/expo/expo/pull/34228) by [@chrfalch](https://github.com/chrfalch))
- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))

## 17.0.8 - 2025-03-11

### 🐛 Bug fixes

- [iOS] Fix pod install in older CocoaPods versions ([#35181](https://github.com/expo/expo/pull/35181) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 17.0.7 - 2025-02-19

_This version does not introduce any user-facing changes._

## 17.0.6 - 2025-02-14

_This version does not introduce any user-facing changes._

## 17.0.4 - 2025-01-10

_This version does not introduce any user-facing changes._

## 17.0.3 — 2024-11-14

_This version does not introduce any user-facing changes._

## 17.0.2 — 2024-10-28

_This version does not introduce any user-facing changes._

## 17.0.1 — 2024-10-22

### 💡 Others

- Fixed check-package test errors. ([#32232](https://github.com/expo/expo/pull/32232) by [@kudo](https://github.com/kudo))

## 17.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Add support for React Server environments. ([#30586](https://github.com/expo/expo/pull/30586) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Add missing `react-native` peer dependencies for isolated modules. ([#30464](https://github.com/expo/expo/pull/30464) by [@byCedric](https://github.com/byCedric))
- Only import from `expo/config` to follow proper dependency chains. ([#30501](https://github.com/expo/expo/pull/30501) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Deprecate `Constants.appOwnership`. ([#30021](https://github.com/expo/expo/pull/30021) by [@amandeepmittal](https://github.com/amandeepmittal))
- Removed all `NativeModulesProxy` occurrences. ([#31496](https://github.com/expo/expo/pull/31496) by [@reichhartd](https://github.com/reichhartd))

## 16.0.2 - 2024-05-29

### 🐛 Bug fixes

- Source env when creating app config. ([#29099](https://github.com/expo/expo/pull/29099) by [@brentvatne](https://github.com/brentvatne))

## 16.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 16.0.0 — 2024-04-18

### 🛠 Breaking changes

- Remove deprecated installationId, isDevice, nativeAppVersion, nativeBuildVersion, platform.platform, platform.systemVersion, platform.userInterfaceIdiom properties. ([#26329](https://github.com/expo/expo/pull/26329) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- [iOS] Add privacy manifest describing required reason API usage. ([#27770](https://github.com/expo/expo/pull/27770) by [@aleqsio](https://github.com/aleqsio))
- [expo-updates] Migrate to requireNativeModule/requireOptionalNativeModule. ([#25648](https://github.com/expo/expo/pull/25648) by [@wschurman](https://github.com/wschurman))
- Remove most of Constants.appOwnership. ([#26313](https://github.com/expo/expo/pull/26313) by [@wschurman](https://github.com/wschurman))
- Improve updates types and clarity in expo-asset. ([#26337](https://github.com/expo/expo/pull/26337) by [@wschurman](https://github.com/wschurman))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 15.4.5 - 2024-01-18

_This version does not introduce any user-facing changes._

## 15.4.4 - 2024-01-15

### 🐛 Bug fixes

- Fixed build error on AGP 8.2. ([#26362](https://github.com/expo/expo/pull/26362) by [@kudo](https://github.com/kudo))

## 15.4.3 - 2024-01-10

### 🎉 New features

- Added support for macOS platform. ([#26233](https://github.com/expo/expo/pull/26233) by [@tsapeta](https://github.com/tsapeta))

## 15.4.2 - 2023-12-19

_This version does not introduce any user-facing changes._

## 15.4.1 — 2023-12-13

_This version does not introduce any user-facing changes._

## 15.4.0 — 2023-12-12

### 💡 Others

- Drop `crypto` usage on web. ([#25411](https://github.com/expo/expo/pull/25411) by [@EvanBacon](https://github.com/EvanBacon))

## 15.3.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 15.2.0 — 2023-10-17

_This version does not introduce any user-facing changes._

## 15.1.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Use dedicated `requireOptionalNativeModule` instead of try-catching `requireNativeModule`. ([#24262](https://github.com/expo/expo/pull/24262) by [@tsapeta](https://github.com/tsapeta))

## 15.0.0 — 2023-09-04

### 🛠 Breaking changes

- Change source of truth for constants types. ([#24049](https://github.com/expo/expo/pull/24049) by [@wschurman](https://github.com/wschurman))
- Remove classic manifest types. ([#24053](https://github.com/expo/expo/pull/24053) by [@wschurman](https://github.com/wschurman))
- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 14.5.1 — 2023-08-02

### 🛠 Breaking changes

- Drop support for `logUrl` which sent console logs to the legacy `expo-cli`. ([#18596](https://github.com/expo/expo/pull/18596) by [@EvanBacon](https://github.com/EvanBacon))

## 14.5.0 — 2023-07-28

### 🐛 Bug fixes

- Fix task ':expo-constants:packageDebugAssets' uses this output of task ':expo-constants:copyReleaseExpoConfig' without declaring an explicit or implicit dependency when running `gradlew test` on Android. ([#23511](https://github.com/expo/expo/pull/23511) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Fork `uuid@3.4.0` and move into `expo-modules-core`. Remove the original dependency. ([#23249](https://github.com/expo/expo/pull/23249) by [@alanhughes](https://github.com/alanjhughes))

## 14.4.2 — 2023-06-24

### 💡 Others

- Remove the long-deprecated `Constants.deviceYearClass` and `Constants.platform.ios.model`. These properties now live on `expo-device`. ([#23068](https://github.com/expo/expo/pull/23068) by [@brentvatne](https://github.com/brentvatne))

## 14.4.1 — 2023-06-22

_This version does not introduce any user-facing changes._

## 14.4.0 — 2023-06-13

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 14.3.0 — 2023-05-08

### 💡 Others

- Warn on use of Constants.manifest. ([#22247](https://github.com/expo/expo/pull/22247) by [@wschurman](https://github.com/wschurman))

## 14.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 14.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 14.1.0 — 2022-12-30

### 🎉 New features

- Migrated Android implementation to Expo Modules API. ([#19974](https://github.com/expo/expo/pull/19974) by [@alanhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fix the list of platform keys in expo-module.config.json ([#20017](https://github.com/expo/expo/pull/20017) by [@alanjhughes](https://github.com/alanjhughes))

## 14.0.2 — 2022-10-30

_This version does not introduce any user-facing changes._

## 14.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 14.0.0 — 2022-10-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed _with-node.sh_ doesn't keep quotes when passing arguments to Node.js and caused build errors when there are spaces in target name. ([#18741](https://github.com/expo/expo/pull/18741) by [@kudo](https://github.com/kudo))

### 💡 Others

- Refactored inline Android emulator checks to use enhanced checking in `EmulatorUtilities.isRunningOnEmulator()`. ([#16177](https://github.com/expo/expo/pull/16177)) by [@kbrandwijk](https://github.com/kbrandwijk), [@keith-kurak](https://github.com/keith-kurak))

## 13.2.3 — 2022-07-25

### 🐛 Bug fixes

- Deprecated the unreliable `source-login-scripts.sh` and sourcing the Node.js binary path from `.xcode.env` and `.xcode.env.local`. ([#18330](https://github.com/expo/expo/pull/18330) by [@kudo](https://github.com/kudo))

## 13.2.2 — 2022-07-16

_This version does not introduce any user-facing changes._

## 13.2.1 — 2022-07-11

_This version does not introduce any user-facing changes._

## 13.2.0 — 2022-07-07

### 🎉 New features

- Add getter for expo client config. ([#17865](https://github.com/expo/expo/pull/17865) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Improved support of nvm sourcing in iOS shell scripts. ([#17109](https://github.com/expo/expo/pull/17109) by [@liamronancb](https://github.com/liamronancb))
- Fixed `source-login-scripts.sh` ~/zlogin typo. ([#17622](https://github.com/expo/expo/pull/17622) by [@vrgimael](https://github.com/vrgimael))

## 13.1.0 — 2022-04-18

### 🐛 Bug fixes

- Fixed iOS script phase build error when `extendedglob` is enabled in zsh config. ([#17024](https://github.com/expo/expo/pull/17024) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config` from `6.0.6` to `6.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 13.0.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 13.0.1 — 2022-01-20

### 🐛 Bug fixes

- Fix the `PhaseScriptExecution` build errors when the `source_login_scripts.sh` failed to load. ([#15890](https://github.com/expo/expo/pull/15890) by [@kudo](https://github.com/kudo))

## 13.0.0 — 2021-12-03

### 🛠 Breaking changes

- Remove deprecated `Constants.deviceId`. ([#15280](https://github.com/expo/expo/pull/15280) by [@Simek](https://github.com/Simek))
- Remove legacy `Constants.linkingUrl` alias. ([#15280](https://github.com/expo/expo/pull/15280) by [@Simek](https://github.com/Simek))

### 💡 Others

- Add missing `null` to the `Constants.buildNumber` type. ([#15280](https://github.com/expo/expo/pull/15280) by [@Simek](https://github.com/Simek))

## 12.2.0 — 2021-11-17

### 🐛 Bug fixes

- Fix NODE_BINARY not found build error when using nvm via zsh ([#14895](https://github.com/expo/expo/pull/14895) by [@filipengberg](https://github.com/filipengberg))

### 💡 Others

- Extract nested objects from current types to new, separate types - `ExpoGoPackagerOpts` and `ManifestExtra`. ([#15113](https://github.com/expo/expo/pull/15113) by [@Simek](https://github.com/Simek))

## 12.1.3 — 2021-10-22

### 🐛 Bug fixes

- Don't include fonts from family "System Font" (introduced by iOS 15) ([#14577](https://github.com/expo/expo/pull/14577) by [@brentvatne](https://github.com/brentvatne))
- Fix `Constants.deviceId has been deprecated in favor of generating and storing your own ID.` warnings in classic react-native projects. ([#14837](https://github.com/expo/expo/pull/14837) by [@kudo](https://github.com/kudo))

## 12.1.2 — 2021-10-21

_This version does not introduce any user-facing changes._

## 12.1.1 — 2021-10-15

### 🛠 Breaking changes

- Deprecated `Constants.deviceYearClass`, moved to `expo-device` - `Device.deviceYearClass` ([#14691](https://github.com/expo/expo/pull/14691) by [@EvanBacon](https://github.com/EvanBacon))
- Deprecated `Constants.platform.ios.model`, moved to `expo-device` - `Device.modelName` ([#14691](https://github.com/expo/expo/pull/14691) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added support for iOS 15.0 devices ([#14640](https://github.com/expo/expo/pull/14640) by [@EvanBacon](https://github.com/EvanBacon))

## 12.1.0 — 2021-10-01

### 🐛 Bug fixes

- Don't include fonts from family "System Font" (introduced by iOS 15) ([#14577](https://github.com/expo/expo/pull/14577) by [@brentvatne](https://github.com/brentvatne))

## 12.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite Android code to Kotlin. ([#14434](https://github.com/expo/expo/pull/14434) by [@kkafar](https://github.com/kkafar))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 11.1.0 — 2021-09-08

### 🎉 New features

- Use stable manifest ID where applicable. ([#12964](https://github.com/expo/expo/pull/12964) by [@wschurman](https://github.com/wschurman))
- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))
- Update location of EAS projectId in new manifest. ([#13739](https://github.com/expo/expo/pull/13739) by [@wschurman](https://github.com/wschurman))
- Update location of scopeKey in new manifest. ([#13817](https://github.com/expo/expo/pull/13817) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- fix `__dir__` absolute path in script_phase making an inconsistent Podfile.lock. ([#13610](https://github.com/expo/expo/pull/13610) by [@kudo](https://github.com/kudo))
- Fix `PROJECT_ROOT` path resolution in `get-app-config-ios.sh`. ([#13439](https://github.com/expo/expo/pull/13439) by [@ajsmth](https://github.com/ajsmth))
- Fix app.config not generated. ([#13667](https://github.com/expo/expo/pull/13667) by [@kudo](https://github.com/kudo))
- Fix build phase error in xcode for nodejs possibly not found in nvm. ([#14047](https://github.com/expo/expo/pull/14047) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- Modularized expo-constants without further app setup. ([#13424](https://github.com/expo/expo/pull/13424) by [@kudo](https://github.com/kudo))

## 11.0.2 — 2021-09-02

### 💡 Others

- Skip running build scripts during iOS debug builds and add support for `SKIP_BUNDLING`/`FORCE_BUNDLING` environment variables. ([#14116](https://github.com/expo/expo/pull/14116) by [@fson](https://github.com/fson))

## 11.0.1 — 2021-06-22

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-06-16

### 🛠 Breaking changes

- Add new manifest2 field and make existing field optional. ([#12817](https://github.com/expo/expo/pull/12817) by [@wschurman](https://github.com/wschurman))
- Update `@expo/config` to include `originalFullName` in embedded config manifest. [Related PR on expo-cli](https://github.com/expo/expo-cli/pull/3494).

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Ensure classic manifest originalFullName is used over id. ([#12955](https://github.com/expo/expo/pull/12955) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated module interface from `unimodules-constants-interface` to `expo-modules-core`. ([#12876](https://github.com/expo/expo/pull/12876) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Inherit env vars in get-app-config-android.gradle. ([#13208](https://github.com/expo/expo/pull/13208) by [@jakub-gonet](https://github.com/jakub-gonet))

## 10.1.3 — 2021-04-13

_This version does not introduce any user-facing changes._

## 10.1.2 — 2021-04-09

### 🛠 Breaking changes

- Remove the `xde` property from `Constants.manifest`. ([#12438](https://github.com/expo/expo/pull/12438) by [@fson](https://github.com/fson))
- Update `@expo/config` to include `currentFullName` in embedded config manifest. [Related PR on expo-cli](https://github.com/expo/expo-cli/pull/3376).

## 10.1.1 — 2021-03-23

### 🎉 New features

- Added new `Constants.__unsafeNoWarnManifest` property that behaves as `Constants.manifest` property, but suppresses warning upon no manifest available. ([#12237](https://github.com/expo/expo/pull/12237) by [@bbarthec](https://github.com/bbarthec))
  > Warning: don't use this property, it's introduced for internal use only.

## 10.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Use `@expo/config-types` package for `ExpoConfig` type. ([#11810](https://github.com/expo/expo/pull/11810) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed support for Android Gradle plugin 4.1+ ([#11926](https://github.com/expo/expo/pull/11926) by [@esamelson](https://github.com/esamelson))
- Add deprecation messages for previously deprecated Constants fields. ([#11960](https://github.com/expo/expo/pull/11960) by [@ide](https://github.com/ide))

## 10.0.1 — 2021-01-25

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Add support for new Apple devices to `platform.ios.deviceModel`. ([#11446](https://github.com/expo/expo/pull/11446) by [@sjchmiela](https://github.com/sjchmiela))
- Changed `Constants.platform.ios.model` nullability — it can now be `null`, if the value cannot be determined. ([#11445](https://github.com/expo/expo/pull/11445) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))
- Added support for simulators running on Apple ARM64 processors (previously, constants expected to be exported by native code were unavailable). ([#11445](https://github.com/expo/expo/pull/11445) by [@sjchmiela](https://github.com/sjchmiela))

## 9.3.5 — 2020-12-11

### 🐛 Bug fixes

- Add @expo/config to dependencies

## 9.3.4 — 2020-12-09

### 🐛 Bug fixes

- Fixed an issue where `Constants.manifest` was still undefined in debug Android builds in the bare workflow

## 9.3.3 — 2020-12-02

_This version does not introduce any user-facing changes._

## 9.3.2 — 2020-12-01

### 🐛 Bug fixes

- Fixed the `getAppConfig.js` script to work with the latest version of `@expo/config`.

## 9.3.1 — 2020-11-25

### 🛠 Breaking changes

- Fixed `installationId` being backed up on Android which resulted in multiple devices having the same `installationId`. ([#11005](https://github.com/expo/expo/pull/11005) by [@sjchmiela](https://github.com/sjchmiela))
- Deprecated `.installationId` and `.deviceId` as these properties can be implemented in user space. Instead, implement the installation identifier on your own using `expo-application`'s `.androidId` on Android and a storage API like `expo-secure-store` on iOS and `localStorage` on Web. ([#10997](https://github.com/expo/expo/pull/10997) by [@sjchmiela](https://github.com/sjchmiela))

## 9.3.0 — 2020-11-17

### 🎉 New features

- Added `Constants.executionEnvironment` to distinguish between apps running in a bare, managed standalone, or App/Play Store development client environment. ([#10986](https://github.com/expo/expo/pull/10986) by [@esamelson](https://github.com/esamelson))
- Added script to embed app configuration into a bare app and export this object as `Constants.manifest`. ([#10948](https://github.com/expo/expo/pull/10948) and [#10949](https://github.com/expo/expo/pull/10949) by [@esamelson](https://github.com/esamelson))
- If `manifest` is defined on `expo-updates` then use it instead of `ExponentConstants.manifest` ([#10668](https://github.com/expo/expo/pull/10668) by [@esamelson](https://github.com/esamelson))
- Warn when developer attempts to access empty `Constants.manifest` in bare. Throw error when it is empty in managed. ([#11028](https://github.com/expo/expo/pull/11028) by [@esamelson](https://github.com/esamelson))
- Set `Contants.executionEnvironment` to `ExecutionEnvironment.Bare` on web.

## 9.2.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 9.1.1 — 2020-05-28

_This version does not introduce any user-facing changes._

## 9.1.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `uuid`'s deprecation of deep requiring ([#8114](https://github.com/expo/expo/pull/8114) by [@actuallymentor](https://github.com/actuallymentor))
