# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.20.5 — 2023-07-29

### 🐛 Bug fixes

- [Android] Fixed splash screen is missing when using the `getDelayLoadAppHandler()` from expo-updates. ([#23747](https://github.com/expo/expo/pull/23747) by [@kudo](https://github.com/kudo))

## 0.20.4 — 2023-07-05

_This version does not introduce any user-facing changes._

## 0.20.3 — 2023-07-02

_This version does not introduce any user-facing changes._

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
