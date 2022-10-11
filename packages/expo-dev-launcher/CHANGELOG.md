# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.3.1 — 2022-10-11

### 🐛 Bug fixes

- Fixed development servers not showing up in the `expo-dev-launcher` on the first boot. ([#19286](https://github.com/expo/expo/pull/19286) by [@lukmccall](https://github.com/lukmccall))

## 1.3.0 — 2022-09-16

### 🎉 New features

- Better support for landscape orientation. ([#19010](https://github.com/expo/expo/pull/19010) by [@ajsmth](https://github.com/ajsmth))

### 🐛 Bug fixes

- Remove the deprecated `Linking.removeEventListener` in expo-dev-launcher bundle. ([#18939](https://github.com/expo/expo/pull/18939) by [@kudo](https://github.com/kudo))
- Fixed the incompatibility with react-native-v8 on Android. ([#19117](https://github.com/expo/expo/pull/19117) by [@kudo](https://github.com/kudo))
- Fixed crash when loading bundle without explicit port on Android. ([#19136](https://github.com/expo/expo/pull/19136) by [@kudo](https://github.com/kudo))

### 💡 Others

- Switched uncaught exception logging to use metro websocket instead of expo-cli logUrl. ([#18787](https://github.com/expo/expo/pull/18787) by [@esamelson](https://github.com/esamelson))
- Disable onboarding popup with URL query param. ([#19024](https://github.com/expo/expo/pull/19024) by [@douglowder](https://github.com/douglowder))

## 1.2.1 — 2022-08-16

### 🐛 Bug fixes

- Fix deferred deep link handling on iOS. ([#18614](https://github.com/expo/expo/pull/18614)) by [@ajsmth](https://github.com/ajsmth)

## 1.2.0 — 2022-08-11

### 🎉 New features

- Add landscape orienation support. ([#18509](https://github.com/expo/expo/pull/18509)) by [@ajsmth](https://github.com/ajsmth)

### 🐛 Bug fixes

- Fixed `the function must be called on main queue` error when the app is reload from the error screen on iOS. ([#18563](https://github.com/expo/expo/pull/18563) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Made deep link error screen on iOS show a friendlier message. ([#18467](https://github.com/expo/expo/pull/18467) by [@esamelson](https://github.com/esamelson))
- Added URL to deep link error screen message on iOS. ([#18511](https://github.com/expo/expo/pull/18511) by [@esamelson](https://github.com/esamelson))

## 1.1.1 — 2022-07-20

_This version does not introduce any user-facing changes._

## 1.1.0 — 2022-07-18

### 🎉 New features

- Added support for React Native 0.69.X. ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo) & [#18182](https://github.com/expo/expo/pull/18182) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Add support for improved missing module error messages in React Native 0.65+. ([#18064](https://github.com/expo/expo/pull/18064) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- [Android] Get downloaded update IDs. ([#17933](https://github.com/expo/expo/pull/17933) by [@douglowder](https://github.com/douglowder))

## 1.0.1 — 2022-07-14

### 🎉 New features

- Include extra information in the recently opened list ([#17633](https://github.com/expo/expo/pull/17633) by [@ajsmth](https://github.com/ajsmth))
- Add debug settings for EAS Updates (admin only) ([#17842](https://github.com/expo/expo/pull/17842) by [@ajsmth](https://github.com/ajsmth))
- Add organizations to account selector ([#18152](https://github.com/expo/expo/pull/18152) by [@ajsmth](https://github.com/ajsmth))
- Restore navigation state after loading an update ([#18189](https://github.com/expo/expo/pull/18189) by [@ajsmth](https://github.com/ajsmth))

### 🐛 Bug fixes

- Fixed the application crashing when the user forces a dark mode only for the dev-client app in the system setting on Android. ([#17858](https://github.com/expo/expo/pull/17858) by [@lukmccall](https://github.com/lukmccall))
- Fixed the error screen is sometimes empty on Android. ([#17857](https://github.com/expo/expo/pull/17857) by [@lukmccall](https://github.com/lukmccall))
- Partially fixed retrieving the React Context from the Android Flipper plugin. ([#18105](https://github.com/expo/expo/pull/18105) by [@lukmccall](https://github.com/lukmccall))

## 1.0.0 — 2022-06-09

### 🐛 Bug fixes

- Fixed the singleton `RCTBridge.currentBridge` instance value be override by expo-dev-launcher bridge instance on iOS. ([#17780](https://github.com/expo/expo/pull/17780) by [@kudo](https://github.com/kudo))

## 0.11.7 — 2022-06-07

### 🐛 Bug fixes

- Fix opening published EAS Update from URL on Android. ([#17734](https://github.com/expo/expo/pull/17734) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- Stop persisting remote debugging setting between app loads on iOS. ([#17650](https://github.com/expo/expo/pull/17650) by [@esamelson](https://github.com/esamelson))
- Autodetect dev-launcher packager on iOS. ([#17712](https://github.com/expo/expo/pull/17712) by [@douglowder](https://github.com/douglowder))

## 0.11.6 — 2022-05-19

_This version does not introduce any user-facing changes._

## 0.11.5 — 2022-05-06

_This version does not introduce any user-facing changes._

## 0.11.4 — 2022-05-05

### 🐛 Bug fixes

- Fix crash on initial deep link ([#17268](https://github.com/expo/expo/pull/17268) by [@ajsmth](https://github.com/ajsmth))
- Fix remote debugging crashing the application on iOS. ([#17248](https://github.com/expo/expo/pull/17248) by [@lukmccall](https://github.com/lukmccall))
- Fix reload button on iOS native error screen in certain cases. ([#17272](https://github.com/expo/expo/pull/17272) by [@esamelson](https://github.com/esamelson))
- Fix infinite query refetching on extensions panel. ([#17314](https://github.com/expo/expo/pull/17314) by [@ajsmth](https://github.com/ajsmth))
- Fix airplane mode hanging on splash screen. ([#17325](https://github.com/expo/expo/pull/17325) by [@ajsmth](https://github.com/ajsmth))

## 0.11.3 — 2022-04-26

### 🐛 Bug fixes

- Fix the error screen sometimes not showing on iOS. ([#17216](https://github.com/expo/expo/pull/17216) by [@lukmccall](https://github.com/lukmccall))

## 0.11.2 — 2022-04-25

_This version does not introduce any user-facing changes._

## 0.11.1 — 2022-04-21

_This version does not introduce any user-facing changes._

## 0.11.0 — 2022-04-20

### 🎉 New features

- Add expo-modules and ReactDelegate-based automatic setup on iOS. ([#16190](https://github.com/expo/expo/pull/16190) by [@esamelson](https://github.com/esamelson))
- Add support for auto-setup with updates integration on iOS. ([#16230](https://github.com/expo/expo/pull/16230) by [@esamelson](https://github.com/esamelson))
- Send uncaught exceptions to the bundler server if possible. ([#15938](https://github.com/expo/expo/pull/15938) & [#15964](https://github.com/expo/expo/pull/15964) by [@lukmccall](https://github.com/lukmccall))
- Add support for React Native `0.67.X`. ([#16038](https://github.com/expo/expo/pull/16038) by [@kudo](https://github.com/kudo))
- Add the crash report screen. ([#16341](https://github.com/expo/expo/pull/16341) by [@lukmccall](https://github.com/lukmccall))
- Add the `isDevelopmentBuild` function to determine if you are running in a development build. ([#16486](https://github.com/expo/expo/pull/16486) by [@lukmccall](https://github.com/lukmccall))
- Add expo-modules automatic setup on Android. ([#16441](https://github.com/expo/expo/pull/16441) by [@esamelson](https://github.com/esamelson))
- Add support for auto-setup with updates integration on Android. ([#16442](https://github.com/expo/expo/pull/16442) by [@esamelson](https://github.com/esamelson))
- Remove regex-based config plugin mods in SDK 45+ projects. ([#16495](https://github.com/expo/expo/pull/16495) by [@esamelson](https://github.com/esamelson))
- Restore ability of host apps to disable dev client. ([#16521](https://github.com/expo/expo/pull/16521) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fix `androidNavigationBar` app.json config settings having no effect at runtime ([#15030](https://github.com/expo/expo/issues/15030)). ([#16711](https://github.com/expo/expo/pull/16711) by [@esamelson](https://github.com/esamelson))
- Removed the unused `jcenter()` maven dependencies. ([#16846](https://github.com/expo/expo/pull/16846) by [@kudo](https://github.com/kudo))
- Fix app not appearing after deeplinking from cold boot on iOS. ([#17010](https://github.com/expo/expo/pull/17010) by [@ajsmth](https://github.com/ajsmth))
- Fix `RCTStatusBarManager module requires that the UIViewControllerBasedStatusBarAppearance to be false.` on iOS. ([#17022](https://github.com/expo/expo/pull/17022) by [@lukmccall](https://github.com/lukmccall))
- Fix loading published projects on Android. ([#17069](https://github.com/expo/expo/pull/17069) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- Move unrelated dev-menu functions into dev-launcher. ([#16124](https://github.com/expo/expo/pull/16124) by [@ajsmth](https://github.com/ajsmth))
- Simplify dev-launcher / dev-menu relationship on iOS. ([#16067](https://github.com/expo/expo/pull/16067) by [@ajsmth](https://github.com/ajsmth))
- Simplify dev-launcher / dev-menu relationship on Android. ([#16228](https://github.com/expo/expo/pull/16228) by [@ajsmth](https://github.com/ajsmth))
- Compatibility with expo-dev-menu auto-setup on iOS. ([#16496](https://github.com/expo/expo/pull/16496) by [@esamelson](https://github.com/esamelson))
- Remove initialization side effects. ([#16522](https://github.com/expo/expo/pull/16522) by [@esamelson](https://github.com/esamelson))
- Use expo-manifests `logUrl` getter instead of accessing raw JSON. ([#16709](https://github.com/expo/expo/pull/16709) by [@esamelson](https://github.com/esamelson))
- Add ability for to launch a specific update through expo-updates-interface. ([#16865](https://github.com/expo/expo/pull/16865) by [@esamelson](https://github.com/esamelson))
- Remove config plugin for better error handling in index.js ([#17025](https://github.com/expo/expo/pull/17025) by [@lukmccall](https://github.com/lukmccall))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 0.10.4 — 2022-02-07

### 🐛 Bug fixes

- Fix opening published projects on Android. ([#16157](https://github.com/expo/expo/pull/16157) by [@esamelson](https://github.com/esamelson))

## 0.10.3 — 2022-02-01

### 🐛 Bug fixes

- Added `android:exported="true"` to the activity, cause on Android 12 and higher it needs to [explicity declared](https://developer.android.com/about/versions/12/behavior-changes-12#exported). ([#16367](https://github.com/expo/expo/pull/16367) by [@wbroek](https://github.com/wbroek))
- Fix build errors on React Native 0.66 caused by `okio` and `okhttp`. ([#15632](https://github.com/expo/expo/pull/15632) by [@kudo](https://github.com/kudo))
- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))
- Fix regression in deep linking configuration. ([#16125](https://github.com/expo/expo/pull/16125) by [@ajsmth](https://github.com/ajsmth))

## 0.10.2 — 2022-01-18

_This version does not introduce any user-facing changes._

## 0.10.1 — 2022-01-17

### 🐛 Bug fixes

- Fix bug on iOS where all URL schemes, rather than just `exp`, were replaced with `http`. ([#15796](https://github.com/expo/expo/pull/15796) by [@esamelson](https://github.com/esamelson))
- Fix detecting import when using double quotes. ([#15898](https://github.com/expo/expo/pull/15898) by [@janicduplessis](https://github.com/janicduplessis))

## 0.10.0 — 2021-12-22

### 🎉 New features

- Add persisted installation ID and include in manifest requests. ([#15538](https://github.com/expo/expo/pull/15538) by [@esamelson](https://github.com/esamelson))
- Improve dev session request logic and use device ID when available. ([#15542](https://github.com/expo/expo/pull/15542) by [@esamelson](https://github.com/esamelson))
- Improve error handling when opening the app from a deep link on Android. ([#15637](https://github.com/expo/expo/pull/15637) by [@lukmccall](https://github.com/lukmccall))
- Implement redesigned native error screen. ([#15618](https://github.com/expo/expo/pull/15618) & [#15531](https://github.com/expo/expo/pull/15531) by [@lukmccall](https://github.com/lukmccall))
- Redesign the home screen. ([#15343](https://github.com/expo/expo/pull/15343) by [#ajsmth](https://github.com/ajsmth))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

## 0.9.1 — 2021-12-15

### 🐛 Bug fixes

- Fix plugin when `MainActivity.onNewIntent` exists. ([#15459](https://github.com/expo/expo/pull/15459) by [@janicduplessis](https://github.com/janicduplessis))
- Fix plugin when `expo-updates` is not present. ([#15541](https://github.com/expo/expo/pull/15541) by [@esamelson](https://github.com/esamelson))
- Include expo-platform header in manifest requests. ([#15563](https://github.com/expo/expo/pull/15563) by [@esamelson](https://github.com/esamelson))
- Fix plugin compatibility with SDK 44. ([#15562](https://github.com/expo/expo/pull/15562) & [#15570](https://github.com/expo/expo/pull/15570) by [@lukmccall](https://github.com/lukmccall) & [@esamelson](https://github.com/esamelson))

## 0.9.0 — 2021-12-03

### 🎉 New features

- Added support for React Native `0.66.X`. ([#15242](https://github.com/expo/expo/pull/15242) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fix `No native splash screen registered for given view controller` error happening when project is using both `expo-dev-client` and `expo-splash-screen` packages. ([#14745](https://github.com/expo/expo/pull/14745) by [@kudo](https://github.com/kudo))
- Fix cannot load url that starts with exp. (by [@lukmccall](https://github.com/lukmccall))

## 0.8.4 — 2021-10-21

### 🐛 Bug fixes

- Fix crash in SDK 42 Android projects. (by [@esamelson](https://github.com/esamelson))

## 0.8.3 — 2021-10-15

### 🐛 Bug fixes

- Fix config plugin compatibility with expo-screen-orientation. ([#14752](https://github.com/expo/expo/pull/14752) by [@esamelson](https://github.com/esamelson))

## 0.8.2 — 2021-10-15

### 🐛 Bug fixes

- Fix `No native splash screen registered for given view controller` error happening when project is using both `expo-dev-client` and `expo-splash-screen` packages. ([#14745](https://github.com/expo/expo/pull/14745) by [@kudo](https://github.com/kudo))

## 0.8.1 — 2021-10-07

_This version does not introduce any user-facing changes._

## 0.8.0 — 2021-10-07

### 🛠 Breaking changes

- Added a native dependency on the `expo-manifests` package. **Projects without `react-native-unimodules` or `expo-modules-core` installed will need to follow the upgrade guide [here](https://docs.expo.dev/clients/upgrading/) when upgrading from an older version of this package.** ([#14461](https://github.com/expo/expo/pull/14461) by [@esamelson](https://github.com/esamelson))
- Replace Android DevLauncherManifest class with `expo-manifests`. ([#14462](https://github.com/expo/expo/pull/14462) by [@esamelson](https://github.com/esamelson))
- Replace iOS EXDevLauncherManifest class with `expo-manifests`. ([#14463](https://github.com/expo/expo/pull/14463) by [@esamelson](https://github.com/esamelson))

### 🎉 New features

- Suppress the `"main" has not been registered` exception if it was caused by a different error. ([#14363](https://github.com/expo/expo/pull/14363) by [@lukmccall](https://github.com/lukmccall))
- Added support for SDK 43. ([#14633](https://github.com/expo/expo/pull/14633) & [#14635](https://github.com/expo/expo/pull/14635) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fix intent that started activity isn't passed further. ([#14097](https://github.com/expo/expo/pull/14097) by [@lukmccall](https://github.com/lukmccall))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 0.7.0 — 2021-09-02

### 🎉 New features

- Fix compatibility with RN 0.65. ([#14064](https://github.com/expo/expo/pull/14064) by [@lukmccall](https://github.com/lukmccall))
- Add manifestURL to exported constants. ([#14195](https://github.com/expo/expo/pull/14195) by [@esamelson](https://github.com/esamelson))
- Add flag to disable auto-launch of dev menu on start. ([#14196](https://github.com/expo/expo/pull/14196) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fixed crashes when the app doesn't have custom deep link scheme on iOS. ([#14026](https://github.com/expo/expo/pull/14026) by [@lukmccall](https://github.com/lukmccall))
- Fix config plugin not idempotent. ([#14065](https://github.com/expo/expo/pull/14065) by [@lukmccall](https://github.com/lukmccall))
- Fix React Native version checker in build.gradle. ([#14251](https://github.com/expo/expo/pull/14251) by [@esamelson](https://github.com/esamelson))
- Fixed Cmd+D opening two dev menus. ([#14204](https://github.com/expo/expo/pull/14204) by [@fson](https://github.com/fson))

### 💡 Others

- Display linking scheme used by app in launcher URL field ([#13930](https://github.com/expo/expo/pull/13930) by [@fson](https://github.com/fson))

## 0.6.7 — 2021-08-06

### 🐛 Bug fixes

- Fixed issue with opening multiple different published apps. ([#13926](https://github.com/expo/expo/pull/13926) by [@esamelson](https://github.com/esamelson))

## 0.6.6 — 2021-08-04

### 🐛 Bug fixes

- Fixed issue where Expo-hosted manifest URLs with `/index.exp?...` suffix could not be opened properly. ([#13825](https://github.com/expo/expo/pull/13825) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- Add basic setup for iOS unit tests. ([#13824](https://github.com/expo/expo/pull/13824) by [@esamelson](https://github.com/esamelson))

## 0.6.5 — 2021-07-16

### 🐛 Bug fixes

- Fixed compatibility with React Native 0.64.X. ([#13632](https://github.com/expo/expo/pull/13632) by [@lukmccall](https://github.com/lukmccall))
- Updated plugin to only initialize UpdatesDevLauncherController in debug builds. ([#13597](https://github.com/expo/expo/pull/13597) by [@esamelson](https://github.com/esamelson))

## 0.6.4 — 2021-07-08

### 🐛 Bug fixes

- Fixed Android release builds. ([#13544](https://github.com/expo/expo/pull/13544) by [@esamelson](https://github.com/esamelson))
- Fixed web compatibility. ([#13535](https://github.com/expo/expo/pull/13535) by [@lukmccall](https://github.com/lukmccall))

## 0.6.3 — 2021-06-30

### 🐛 Bug fixes

- [plugin] Fixed error handlers weren't initialize after running `expo run:ios`. ([#13438](https://github.com/expo/expo/pull/13438) by [@lukmccall](https://github.com/lukmccall))
- Order dev menu items consistently across platforms. ([#13449](https://github.com/expo/expo/pull/13449) by [@lukmccall](https://github.com/lukmccall))
- Fixed error message when trying to load a production app without expo-updates. ([#13458](https://github.com/expo/expo/pull/13458) by [@esamelson](https://github.com/esamelson))

## 0.6.2 — 2021-06-28

### 🐛 Bug fixes

- Fixed can't reload app from the blue screen. ([#13422](https://github.com/expo/expo/pull/13422) by [@lukmccall](https://github.com/lukmccall))
- Fixed `JSPackagerClient` wasn't close on React Native 0.63.4 what may lead to various bugs on Android. ([#13423](https://github.com/expo/expo/pull/13423) by [@lukmccall](https://github.com/lukmccall))
- Fixed the blue screen was shown instead of the LogBox on iOS. ([#13421](https://github.com/expo/expo/pull/13421) by [@lukmccall](https://github.com/lukmccall))

## 0.6.1 — 2021-06-24

### 🛠 Breaking changes

- Reset Updates module state on each dev client load. ([#13346](https://github.com/expo/expo/pull/13346) by [@esamelson](https://github.com/esamelson))
- Ensure error handler is initialized. ([#13384](https://github.com/expo/expo/pull/13384) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Added expo-updates integration to config plugin. ([#13198](https://github.com/expo/expo/pull/13198) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fixed switching from published to local bundle loading on Android. ([#13363](https://github.com/expo/expo/pull/13363) by [@esamelson](https://github.com/esamelson))
- [plugin] Use Node module resolution to find package paths for Podfile ([#13382](https://github.com/expo/expo/pull/13382) by [@fson](https://github.com/fson))
- Send expo-updates-environment: DEVELOPMENT header in manifest requests. ([#13375](https://github.com/expo/expo/pull/13375) by [@esamelson](https://github.com/esamelson))

## 0.5.1 — 2021-06-16

_This version does not introduce any user-facing changes._

## 0.5.0 — 2021-06-10

### 🛠 Breaking changes

- Renamed the iOS protocol in expo-updates-interface to EXUpdatesExternalInterface. ([#13214](https://github.com/expo/expo/pull/13214) by [@esamelson](https://github.com/esamelson))

## 0.4.0 — 2021-06-08

### 🎉 New features

- Added ability to load published projects via expo-updates. (Android: [#13031](https://github.com/expo/expo/pull/13031) and iOS: [#13087](https://github.com/expo/expo/pull/13087) by [@esamelson](https://github.com/esamelson))
- Support remote JavaScript inspecting. ([#13041](https://github.com/expo/expo/pull/13041) by [@kudo](https://github.com/kudo))
- Updated the footer style on the main screen. ([#13000](https://github.com/expo/expo/pull/13000) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Updates integration: make Update nullable in onSuccess callback ([#13136](https://github.com/expo/expo/pull/13136) by [@esamelson](https://github.com/esamelson))
- Reduced app crashes when the user is spamming deep links on Android. ([#13020](https://github.com/expo/expo/pull/13020) by [@lukmccall](https://github.com/lukmccall))
- Shown the error screen on deep link failure on iOS. ([#13002](https://github.com/expo/expo/pull/13002) by [@lukmccall](https://github.com/lukmccall))

## 0.3.4 — 2021-05-20

### 🐛 Bug fixes

- Fixed the application hanging on the splash screen on iOS. ([#12971](https://github.com/expo/expo/pull/12971) by [@lukmccall](https://github.com/lukmccall))

## 0.3.3 — 2021-05-13

### 🐛 Bug fixes

- Fix flash of dev launcher screen during launch and incorrect dev menu shown on the 1st launch. ([#12765](https://github.com/expo/expo/pull/12765) by [@fson](https://github.com/fson))

## 0.3.2 — 2021-05-12

### 🎉 New features

- [plugin] Prevent plugin from running multiple times in a single process. ([#12715](https://github.com/expo/expo/pull/12715) by [@EvanBacon](https://github.com/EvanBacon))
- [plugin] Added AppDelegate tests. ([#12651](https://github.com/expo/expo/pull/12651) by [@EvanBacon](https://github.com/EvanBacon))
- Added the ability to open managed apps inside the dev-launcher. ([#12698](https://github.com/expo/expo/pull/12698) by [@lukmccall](https://github.com/lukmccall))
- Included `expo-dev-launcher` in `expo-dev-client` package, an easier way to install it. ([#12765](https://github.com/expo/expo/pull/12765) by [@fson](https://github.com/fson))
- Added better URL validation. ([#12799](https://github.com/expo/expo/pull/12799) by [@lukmccall](https://github.com/lukmccall))
- Added better error handling. ([#12848](https://github.com/expo/expo/pull/12848) and [#12800](https://github.com/expo/expo/pull/12800) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed not finding the `Expo Go` on Android 11+ when the user tries to scan the QR code. ([#12328](https://github.com/expo/expo/pull/12328) by [@lukmccall](https://github.com/lukmccall))
- Account for rubocop formatting in plugin. ([#12480](https://github.com/expo/expo/pull/12480) by [@EvanBacon](https://github.com/EvanBacon))
- Fix bundled images. ([#12668](https://github.com/expo/expo/pull/12668) by [@fson](https://github.com/fson))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- [plugin] Fix config plugin not including `expo-dev-launcher` in `Podfile`. ([#12828](https://github.com/expo/expo/pull/12828) by [@fson](https://github.com/fson))
- Fix incorrect color of safe area view on iOS. ([#12851](https://github.com/expo/expo/pull/12851) by [@lukmccall](https://github.com/lukmccall))
- Fixed application crashing with the `VerifyError` exception on Android. ([#12855](https://github.com/expo/expo/pull/12855) by [@lukmccall](https://github.com/lukmccall))
- Fixed XCode warnings. ([#12798](https://github.com/expo/expo/pull/12798) by [@lukmccall](https://github.com/lukmccall))

## 0.3.1 — 2021-04-09

### 🐛 Bug fixes

- Fix misspellings in READMEs. ([#12346](https://github.com/expo/expo/pull/12346) by [@wschurman](https://github.com/wschurman))

## 0.3.0 — 2021-03-24

### 🎉 New features

- Rewrote UI and added a dark theme support. ([#12236](https://github.com/expo/expo/pull/12236) by [@lukmccall](https://github.com/lukmccall))
- Fetched the development session if the user is logged into his Expo account. ([#12236](https://github.com/expo/expo/pull/12236) by [@lukmccall](https://github.com/lukmccall))
