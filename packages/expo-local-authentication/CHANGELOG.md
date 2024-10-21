# Changelog

## Unpublished

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added support for macOS platform. ([#29185](https://github.com/expo/expo/pull/29185) by [@hassankhan](https://github.com/hassankhan))

### 🐛 Bug fixes

- [iOS] `isEnrolledAsync()` returns correct value when biometry is locked out. ([#30565](https://github.com/expo/expo/pull/30565) by [@vonovak](https://github.com/vonovak))
- [Android] Fix `authenticateAsync` crash when `disableDeviceFallback` is `true`. ([#32076](https://github.com/expo/expo/pull/32076) by [@dcangulo](https://github.com/dcangulo))

### 💡 Others

## 14.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 14.0.0 — 2024-04-18

### 🛠 Breaking changes

- `SecurityLevel.BIOMETRIC` has been deprecated in favour of `SecurityLevel.BIOMETRIC_STRONG` and `SecurityLevel.BIOMETRIC_WEAK`. Using `SecurityLevel.BIOMETRIC` might lead to unexpected behaviour. ([#26768](https://github.com/expo/expo/pull/26768) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [Android] Add support for `weak` and `strong` biometric authentication. ([#26768](https://github.com/expo/expo/pull/26768) by [@behenate](https://github.com/behenate))

### 💡 Others

- Prevent config plugin from writing permissions until prebuild. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))
- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 13.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 13.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 13.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 💡 Others

- [Android] Migrate to use Expo Modules API. ([#24083](https://github.com/expo/expo/pull/24083) by [@lukmccall](https://github.com/lukmccall))

## 13.5.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 13.4.1 — 2023-06-13

### 🐛 Bug fixes

- [Android] Fixed device credentials fallback when biometric sensors are unavailable ([#22388](https://github.com/expo/expo/pull/22388) by [@hubastard](https://github.com/hubastard))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 13.4.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 13.3.0 - 2023-04-10

### 🐛 Bug fixes

- On iOS, fix incorrect nil check when checking for `NSFaceIDUsageDescription` in the Info.plist. ([#21500](https://github.com/expo/expo/pull/21500) by [@alanjhughes](https://github.com/alanjhughes))

## 13.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 13.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 13.1.0 — 2022-12-30

### 🎉 New features

- Native module on iOS is now written in Swift using the Sweet API. ([#19980](https://github.com/expo/expo/pull/19980) by [@fobos531](https://github.com/fobos531))

## 13.0.2 — 2022-11-02

_This version does not introduce any user-facing changes._

## 13.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 13.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Updated docs link. ([#18972](https://github.com/expo/expo/pull/18972) by [@EvanBacon](https://github.com/EvanBacon))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 12.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 12.2.0 — 2022-04-18

### 🎉 New features

- Add the ability to set confirmation requirement on Android. ([#16793](https://github.com/expo/expo/pull/16793) by [@fguitton](https://github.com/fguitton))

### 🐛 Bug fixes

- On Android fixed `BiometricPrompt.ERROR_CANCELED` returned when fallbacking to PIN/Pattern/Password authentication method. ([#16927](https://github.com/expo/expo/pull/16927) by [@bbarthec](https://github.com/bbarthec), [@Polidoro-root](https://github.com/Polidoro-root))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))
- Updated `androix.biometric.biometric` from `1.1.0` to `1.2.0-alphas04`. ([#16927](https://github.com/expo/expo/pull/16927) by [@bbarthec](https://github.com/bbarthec), ([#16927](https://github.com/expo/expo/pull/16927) by [@bbarthec](https://github.com/bbarthec), [@Polidoro-root](https://github.com/Polidoro-root))
- Bumped `compileSdkVersion` from `30` to `31`. ([#16927](https://github.com/expo/expo/pull/16927) by [@bbarthec](https://github.com/bbarthec), ([#16927](https://github.com/expo/expo/pull/16927) by [@bbarthec](https://github.com/bbarthec), [@Polidoro-root](https://github.com/Polidoro-root))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 12.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Added missing definition on type LocalAuthenticationResult. ([#13636](https://github.com/expo/expo/pull/13636) by [@mstach60161](https://github.com/mstach60161))
- Fixed detection of the available authentication types on some Samsung devices on Android. ([#14300](https://github.com/expo/expo/pull/14300) by [@beaur](https://github.com/beaur))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite module from Java to Kotlin. ([#13582](https://github.com/expo/expo/pull/13582) by [@mstach60161](https://github.com/mstach60161))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 11.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Fixed `authenticateAsync` not resolving when the user used PIN on some Android devices. ([#13023](https://github.com/expo/expo/pull/13023) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Removed unnecessary dependency on `unimodules-constants-interface`. ([#12876](https://github.com/expo/expo/pull/12876) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 11.0.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 11.0.1 — 2021-04-09

### 🐛 Bug fixes

- Avoid LAContext#biometryType bug on iOS 11.0.0. ([#12413](https://github.com/expo/expo/pull/12413) by [@mickamy](https://github.com/mickamy/))
- Do not require activity existence on getKeyguardManager. ([#12400](https://github.com/expo/expo/pull/12400) by [@mickamy](https://github.com/mickamy/))
- Flip `isAuthenticating` when the user dismisses the authentication dialog on Android. ([#12728](https://github.com/expo/expo/pull/12728) by [@mickamy](https://github.com/mickamy/))

## 11.0.0 — 2021-03-10

### 🛠 Breaking changes

- Remove deprecated support for passing a string to `authenticateAsync` in favor of the `promptMessage` option. ([#11906](https://github.com/expo/expo/pull/11906) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Added method to know enrolled security level of device. ([#11780](https://github.com/expo/expo/pull/11780) by [@mickamy](https://github.com/mickamy))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 9.5.0 — 2020-11-17

### 🐛 Bug fixes

- Guard against crash on Android when `FragmentActivity` is null creating the Biometric Prompt. ([#10679](https://github.com/expo/expo/pull/10679) by [@vascofg](https://github.com/vascofg))
- Guard against Null Pointer Exception on Android when calling `authenticate` on the Biometric Prompt after resuming the app on some devices. ([#10965](https://github.com/expo/expo/pull/10965) by [@vascofg](https://github.com/vascofg))

## 9.4.0 — 2020-10-12

### 🐛 Bug fixes

- Fixed `cancelAuthenticate` not working in Android as expected. ([#10482](https://github.com/expo/expo/pull/10482) by [@huisf](https://github.com/HuiSF))

## 9.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 9.2.0 — 2020-07-02

### 🐛 Bug fixes

- Fix crash when `NSFaceIDUsageDescription` is not provided and device fallback is disabled. ([#8595](https://github.com/expo/expo/pull/8595) by [@tsapeta](https://github.com/tsapeta))
- Added missing biometric permission to Android. ([#8692](https://github.com/expo/expo/pull/8692) by [@byCedric](https://github.com/byCedric))
- Use hardcoded system feature strings to support Android SDK 28. ([#9034](https://github.com/expo/expo/pull/9034) by [@bycedric](https://github.com/bycedric))

## 9.1.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 9.1.0 — 2020-05-27

### 🎉 New features

- Added support for `promptMessage`, `cancelLabel` and `disableDeviceFallback` on Android. ([#8219](https://github.com/expo/expo/pull/8219) by [@diegolmello](https://github.com/diegolmello))
- Added iris local authentication type for Android. ([#8431](https://github.com/expo/expo/pull/8364) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Added estimate of supported authentication types for Android. ([#8431](https://github.com/expo/expo/pull/8431) by [@bycedric](https://github.com/bycedric))

### 💡 Others

- Removed `console.warn` from the `authenticateAsync` function, preventing running it every time the user cancels authentication or authentication fails. ([#19803](https://github.com/expo/expo/pull/19803) by [@GustavoMont](https://github.com/GustavoMont))
