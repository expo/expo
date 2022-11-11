# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 14.0.2 — 2022-10-30

_This version does not introduce any user-facing changes._

## 14.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 14.0.0 — 2022-10-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed *with-node.sh* doesn't keep quotes when passing arguments to Node.js and caused build errors when there are spaces in target name. ([#18741](https://github.com/expo/expo/pull/18741) by [@kudo](https://github.com/kudo))

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
