# Changelog

## Unpublished

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Expose a typed config plugin function ([#44098](https://github.com/expo/expo/pull/44098) by [@zoontek](https://github.com/zoontek))

### 🐛 Bug fixes

### 💡 Others

- Make `backgroundColor` plugin prop optional, defaulting to `#ffffff`. ([#44098](https://github.com/expo/expo/pull/44098) by [@zoontek](https://github.com/zoontek))
- Removed the `expo_splash_screen_status_bar_translucent` Android leftover attribute. ([#43514](https://github.com/expo/expo/pull/43514) by [@zoontek](https://github.com/zoontek))

## 55.0.9 — 2026-02-25

_This version does not introduce any user-facing changes._

## 55.0.8 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-08

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🐛 Bug fixes

- [iOS] Fix crash when storyboard is not present ([#42178](https://github.com/expo/expo/pull/42178) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- [iOS] Remove new architecture checks. ([#41767](https://github.com/expo/expo/pull/41767) by [@alanjhughes](https://github.com/alanjhughes))

## 31.0.12 - 2025-12-05

_This version does not introduce any user-facing changes._

## 31.0.11 - 2025-11-17

_This version does not introduce any user-facing changes._

## 31.0.10 — 2025-09-12

_This version does not introduce any user-facing changes._

## 31.0.9 — 2025-09-11

_This version does not introduce any user-facing changes._

## 31.0.8 — 2025-09-03

_This version does not introduce any user-facing changes._

## 31.0.7 — 2025-08-31

_This version does not introduce any user-facing changes._

## 31.0.6 — 2025-08-28

_This version does not introduce any user-facing changes._

## 31.0.5 — 2025-08-26

_This version does not introduce any user-facing changes._

## 31.0.4 — 2025-08-21

_This version does not introduce any user-facing changes._

## 31.0.3 — 2025-08-19

_This version does not introduce any user-facing changes._

## 31.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 31.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 31.0.0 — 2025-08-13

### 🐛 Bug fixes

- [iOS] Resolve StoryBoard name from Info.plist. ([#37151](https://github.com/expo/expo/pull/37151) by [@Vadko](https://github.com/Vadko))

## 0.30.10 - 2025-07-03

_This version does not introduce any user-facing changes._

## 0.30.9 - 2025-06-04

_This version does not introduce any user-facing changes._

## 0.30.8 — 2025-05-01

_This version does not introduce any user-facing changes._

## 0.30.7 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.30.6 — 2025-04-25

_This version does not introduce any user-facing changes._

## 0.30.5 — 2025-04-22

_This version does not introduce any user-facing changes._

## 0.30.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.30.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.30.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 0.30.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 0.30.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))

## 0.29.22 - 2025-02-14

_This version does not introduce any user-facing changes._

## 0.29.21 - 2025-01-19

_This version does not introduce any user-facing changes._

## 0.29.20 - 2025-01-10

_This version does not introduce any user-facing changes._

## 0.29.19 - 2025-01-08

### 🐛 Bug fixes

- On `iOS`, show the splashscreen again when the app is reloaded. ([#33793](https://github.com/expo/expo/pull/33793) by [@alanjhughes](https://github.com/alanjhughes))

## 0.29.18 - 2024-12-10

_This version does not introduce any user-facing changes._

## 0.29.17 - 2024-12-10

### 🎉 New features

- On Android, add support for providing vector drawables as the splashscreen icon. ([#33507](https://github.com/expo/expo/pull/33507) by [@alanjhughes](https://github.com/alanjhughes))

## 0.29.16 - 2024-12-05

_This version does not introduce any user-facing changes._

## 0.29.15 - 2024-12-05

_This version does not introduce any user-facing changes._

## 0.29.14 - 2024-12-05

### 💡 Others

- Use `light` and `dark` colors on `iOS` instead of `any`. ([#33472](https://github.com/expo/expo/pull/33472) by [@alanjhughes](https://github.com/alanjhughes))

## 0.29.13 — 2024-11-22

### 🐛 Bug fixes

- Correctly handle `resizeMode` in config plugin. ([#33143](https://github.com/expo/expo/pull/33143) by [@alanjhughes](https://github.com/alanjhughes))

## 0.29.12 — 2024-11-20

### 🐛 Bug fixes

- Prevent `setOptions` from being called in Expo Go. ([#33104](https://github.com/expo/expo/pull/33104) by [@alanjhughes](https://github.com/alanjhughes))

## 0.29.11 — 2024-11-15

_This version does not introduce any user-facing changes._

## 0.29.10 — 2024-11-14

### 💡 Others

- Bump minimum @expo/prebuild-config version.

## 0.29.9 — 2024-11-14

_This version does not introduce any user-facing changes._

## 0.29.8 — 2024-11-13

_This version does not introduce any user-facing changes._

## 0.29.7 — 2024-11-12

_This version does not introduce any user-facing changes._

## 0.29.6 — 2024-11-11

_This version does not introduce any user-facing changes._

## 0.29.5 — 2024-11-10

### 🐛 Bug fixes

- [Android] Added guard to prevent null pointer exception when the splashScreen property is referenced without an activity (headless JS) ([#32707](https://github.com/expo/expo/pull/32707) by [@chrfalch](https://github.com/chrfalch))

## 0.29.4 — 2024-11-07

_This version does not introduce any user-facing changes._

## 0.29.3 — 2024-11-06

_This version does not introduce any user-facing changes._

## 0.29.2 — 2024-11-05

### 💡 Others

- Migrate internal logic used by router from JS to native ([#32610](https://github.com/expo/expo/pull/32610) by [@brentvatne](https://github.com/brentvatne))

## 0.29.1 — 2024-10-31

_This version does not introduce any user-facing changes._

## 0.29.0 — 2024-10-31

_This version does not introduce any user-facing changes._

## 0.28.5 — 2024-10-30

_This version does not introduce any user-facing changes._

## 0.28.4 — 2024-10-28

_This version does not introduce any user-facing changes._

## 0.28.3 — 2024-10-28

_This version does not introduce any user-facing changes._

## 0.28.2 — 2024-10-24

_This version does not introduce any user-facing changes._

## 0.28.1 — 2024-10-24

_This version does not introduce any user-facing changes._

## 0.28.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed `preventAutoHideAsync()` broken on iOS bridgeless mode. ([#28234](https://github.com/expo/expo/pull/28234) by [@kudo](https://github.com/kudo))

## 0.27.6 - 2024-09-23

_This version does not introduce any user-facing changes._

## 0.27.5 - 2024-06-06

_This version does not introduce any user-facing changes._

## 0.27.4 — 2024-05-03

### 💡 Others

- No-op when native module is not installed ([#28599](https://github.com/expo/expo/pull/28599) by [@brentvatne](https://github.com/brentvatne))

## 0.27.3 — 2024-05-01

_This version does not introduce any user-facing changes._

## 0.27.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 0.27.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 0.27.0 — 2024-04-18

### 🐛 Bug fixes

- Fixed white screen flickering when using expo-updates with longer `fallbackToCacheTimeout`. ([#28227](https://github.com/expo/expo/pull/28227) by [@kudo](https://github.com/kudo))

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 0.26.4 - 2024-01-24

_This version does not introduce any user-facing changes._

## 0.26.3 - 2024-01-18

_This version does not introduce any user-facing changes._

## 0.26.2 - 2024-01-10

### 🐛 Bug fixes

- Fixed return value of the `preventAutoHideAsync` function. ([#26348](https://github.com/expo/expo/pull/26348) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Replace deprecated `com.facebook.react:react-native:+` Android dependency with `com.facebook.react:react-android`. ([#26237](https://github.com/expo/expo/pull/26237) by [@kudo](https://github.com/kudo))

## 0.26.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 0.26.0 — 2023-12-12

### 💡 Others

- Removed 'The current activity is no longer available' warning on Android. ([#25608](https://github.com/expo/expo/pull/25608) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.25.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🎉 New features

- Automatically dismiss splash screen when an error is thrown to prevent blocking error information. ([#24893](https://github.com/expo/expo/pull/24893) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Moved changes required for splash screen orchestration from `expo-router` to `expo-splash-screen`. ([#24893](https://github.com/expo/expo/pull/24893) by [@EvanBacon](https://github.com/EvanBacon))

## 0.24.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- On Android, remove `isClickable` on `SplashScreenView` that caused incorrect behaviour with `TalkBack`. ([#24601](https://github.com/expo/expo/pull/24601) by [@alanhughes](https://github.com/alanjhughes))

## 0.23.1 — 2023-09-18

_This version does not introduce any user-facing changes._

## 0.23.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Delete deprecated `hide` and `preventAutoHide` methods. ([#24296](https://github.com/expo/expo/pull/24296) by [@EvanBacon](https://github.com/EvanBacon))

## 0.22.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 💡 Others

- Removed 'No native splash screen registered' warning on iOS when opening and reloading the app. ([#24210](https://github.com/expo/expo/pull/24210) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.21.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 0.21.0 — 2023-07-28

### 🐛 Bug fixes

- [Android] Fixed splash screen is missing when using the `getDelayLoadAppHandler()` from expo-updates. ([#23747](https://github.com/expo/expo/pull/23747) by [@kudo](https://github.com/kudo))

## 0.20.2 — 2023-06-28

_This version does not introduce any user-facing changes._

## 0.20.1 — 2023-06-24

_This version does not introduce any user-facing changes._

## 0.20.0 — 2023-06-21

### 🛠 Breaking changes

- Deprecated `@expo/configure-splash-screen` in favor of the splash screen config plugin. ([#21464](https://github.com/expo/expo/pull/21464) by [@byCedric](https://github.com/byCedric))

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))
- Migrated Android codebase to use Expo modules API. ([#22827](https://github.com/expo/expo/pull/22827) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 0.19.0 — 2023-05-08

### 💡 Others

- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 0.18.2 — 2023-04-26

_This version does not introduce any user-facing changes._

## 0.18.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 0.18.0 — 2023-02-03

### 🐛 Bug fixes

- Fixed `No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.` warning being displayed on iOS when app is started in background. ([#20064](https://github.com/expo/expo/pull/20064) by [@grigorigoldman](https://github.com/grigorigoldman))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 0.17.4 - 2022-11-08

### 🐛 Bug fixes

- Fixed Android `NullPointerException` in `FrameLayout.onMeasure()` when running on new architecture mode with expo-dev-client. ([#19931](https://github.com/expo/expo/pull/19931) by [@kudo](https://github.com/kudo))

## 0.17.3 — 2022-10-30

_This version does not introduce any user-facing changes._

## 0.17.2 — 2022-10-28

_This version does not introduce any user-facing changes._

## 0.17.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 0.17.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))

## 0.16.2 - 2022-08-22

### 🐛 Bug fixes

- Fixed `'SplashScreen.show' has already been called for given view controller.` warning being displayed when using `expo-dev-client` on iOS. ([#18682](https://github.com/expo/expo/pull/18682) by [@lukmccall](https://github.com/lukmccall))

## 0.16.1 — 2022-07-16

### 🐛 Bug fixes

- Fixed splash screen not showing when reloading apps on iOS. ([#18229](https://github.com/expo/expo/pull/18229) by [@kudo](https://github.com/kudo))

## 0.16.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 0.15.1 — 2022-04-27

_This version does not introduce any user-facing changes._

## 0.15.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 0.14.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.14.1 — 2021-12-22

### 🐛 Bug fixes

- Remove duplicated `expo-modules-autolinking` package coming from `expo-splash-screen` dependencies. ([#15685](https://github.com/expo/expo/pull/15685) by [@kudo](https://github.com/kudo))

## 0.14.0 — 2021-12-03

### 🐛 Bug fixes

- Fix `Cannot remove an observer <EXSplashScreenService> for the key path "rootViewController"` exception if applcation keyWindow changed. ([#14982](https://github.com/expo/expo/pull/14982) by [@kudo](https://github.com/kudo))

## 0.13.4 — 2021-10-22

_This version does not introduce any user-facing changes._

## 0.13.3 — 2021-10-15

### 🐛 Bug fixes

- Fix `No native splash screen registered for given view controller` error happening when project is using both `expo-dev-client` and `expo-splash-screen` packages. ([#14745](https://github.com/expo/expo/pull/14745) by [@kudo](https://github.com/kudo))

## 0.13.2 — 2021-10-15

_This version does not introduce any user-facing changes._

## 0.13.1 — 2021-10-01

### 🐛 Bug fixes

- Fix expo-screen-orientation breaking for expo-updates + expo-splash-screen integration. ([#14519](https://github.com/expo/expo/pull/14519) by [@kudo](https://github.com/kudo))

## 0.13.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix 'No native splash screen registered' warning from reloading apps. ([#14467](https://github.com/expo/expo/pull/14467) by [@kudo](https://github.com/kudo))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/configure-splash-screen`, `@expo/prebuild-config` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 0.12.0 — 2021-09-09

### 🎉 New features

- Add warning for splash screen if visible for too long ([#12882](https://github.com/expo/expo/pull/12882) by [@ajsmth](https://github.com/ajsmth))
- Show splash screen without additional setup in MainActivity and could customize resizeMode/statusBarTranslucent in resource. See PR description for changes migration. ([#14061](https://github.com/expo/expo/pull/14061) by [@kudo](https://github.com/kudo))
- Re-show splash screen if rootViewController be replaced when splash is showing. ([#14063](https://github.com/expo/expo/pull/14063) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- On iOS, search for a view controller with a RCTRootView rather than always using the keyWindow's rootViewController. ([#13429](https://github.com/expo/expo/pull/13429) by [@esamelson](https://github.com/esamelson))
- Fix splash screen not dismissed if there is alert view appearing. ([#14208](https://github.com/expo/expo/pull/14208) by [@kudo](https://github.com/kudo))
- Fix splash screen not dismissed while alert view appearing before RCTRootView did load. ([#14213](https://github.com/expo/expo/pull/14213) by [@kudo](https://github.com/kudo))

## 0.11.0 — 2021-06-16

### 🎉 New features

- [plugin] Re-export unversioned expo-cli plugin as a versioned plugin. ([#13241](https://github.com/expo/expo/pull/13241) by [@EvanBacon](https://github.com/EvanBacon))
- Bump `@expo/configure-splash-screen@0.4.0`. ([#12940](https://github.com/expo/expo/pull/12940) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- [plugin] Match status bar color on android. ([#13227](https://github.com/expo/expo/pull/13227) by [@EvanBacon](https://github.com/EvanBacon))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 0.10.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 0.10.1 — 2021-04-09

_This version does not introduce any user-facing changes._

## 0.10.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Bump `@expo/configure-splash-screen`. ([#11831](https://github.com/expo/expo/pull/11831) by [@EvanBacon](https://github.com/EvanBacon))

## 0.9.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 0.8.1 — 2020-11-26

_This version does not introduce any user-facing changes._

## 0.8.0 — 2020-11-17

### 🛠 Breaking changes

- On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))
- Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))

## 0.7.1 — 2020-09-28

## 0.7.0 — 2020-09-21

## 0.6.2 - 2020-09-28

### 🛠 Breaking changes

- On Android fixed `SplashScreen` methods not working in managed workflow. Scoped the `SplashScreen` native object to the separate `singletons` sub-package to work with versioned code. ([#10294](https://github.com/expo/expo/pull/10294) by [@bbarthec](https://github.com/bbarthec))
- Updated `@expo/configure-splash-screen` to `v0.2.0`.
  - This version fixes the problem with the wrong `SplashScreen.show` method signature on Android. It properly adds the `ReactRootView` parameter now.
  - Additionally it properly imports the `SplashScreen` object from the `singletons` sub-packagae on Android.
- `yarn run expo-splash-screen` changed its parameters layout. Run `yarn run expo-splash-screen --help` to see the new options layout. Every parameter has to provided via the `--[option name]` syntax now.

## 0.6.1 - 2020-09-17

### 🐛 Bug fixes

- On iOS fixed non-working `SplashScreen.preventAutoHide` introduced in version `0.4.0`. ([#10192](https://github.com/expo/expo/pull/10192) by [@bbarthec](https://github.com/bbarthec))
- Fixed crash when the app was opened in the background on iOS. ([#10157](https://github.com/expo/expo/pull/10157) by [@sjchmiela](https://github.com/sjchmiela))

## 0.6.0 — 2020-08-18

### 🎉 New features

- On iOS the name of the LaunchScreen file is read from the project configuration and fallbacks to default `SplashScreen` if not found. ([#9622](https://github.com/expo/expo/pull/9622) by [@bbarthec](https://github.com/bbarthec))

## 0.5.0 — 2020-07-30

### 🐛 Bug fixes

- Bump dependency on @expo/configure-splash-screen to transitively bump logkitty version pulled in through @react-native-community/cli-platform-android.
- Fixed crash adding `splashScreenView` to parent when it was already added on Android. ([#9451](https://github.com/expo/expo/pull/9451) by [@RodolfoGS](https://github.com/RodolfoGS))

## 0.4.0 — 2020-07-16

### 🛠 Breaking changes

- `SplashScreen.show()` native method changes it's signature. Its third argument is now a `Boolean` flag that tells the system whether the `StatusBar` component should be `translucent`. Pass `false` to preserve the previous default behavior. ([#8535](https://github.com/expo/expo/pull/8535) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fixed flicker in-between SplashScreen and ReactApp phases on iOS. ([#8739](https://github.com/expo/expo/pull/8739) by [@bbarthec](https://github.com/bbarthec))

## 0.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 0.3.0 — 2020-05-27

### 🛠 Breaking changes

- `expo-splash-screen-command` is now replaced by `@expo/configure-splash-screen`. Functionality is not affected.

### 🐛 Bug fixes

- add polyfill for usage within managed workflow

## 0.2.0

### 🎉 New features

- expo-splash-screen-command is now bundled with expo-splash-screen and helps you to automatically configure your splash screen in bare React Native apps. Install expo-splash-screen in your project then run `yarn expo-splash-screen --help` for more information.
