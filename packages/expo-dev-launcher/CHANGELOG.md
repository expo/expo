# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 3.6.7 — 2024-02-16

### 📚 3rd party library updates

- Update react-native to 0.73.4. ([#26774](https://github.com/expo/expo/pull/26774) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.6.6 — 2024-02-01

### 💡 Others

- Update auth session URL to prompt user to select account. ([#26780](https://github.com/expo/expo/pull/26780) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Update ModalStack animations. ([#26802](https://github.com/expo/expo/pull/26802) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.6.5 — 2024-01-26

_This version does not introduce any user-facing changes._

## 3.6.4 — 2024-01-23

### 🐛 Bug fixes

- [Android] Fixed unable to load dev client bundle on device. ([#26630](https://github.com/expo/expo/pull/26630) by [@lukmccall](https://github.com/lukmccall))

## 3.6.3 — 2024-01-18

### 🐛 Bug fixes

- Fixed HMR not working on Android. ([#26441](https://github.com/expo/expo/pull/26441) by [@lukmccall](https://github.com/lukmccall))

## 3.6.2 — 2024-01-10

### 🐛 Bug fixes

- Fix launcher bridge not filtering native modules. ([#26332](https://github.com/expo/expo/pull/26332) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Replace deprecated `com.facebook.react:react-native:+` Android dependency with `com.facebook.react:react-android`. ([#26237](https://github.com/expo/expo/pull/26237) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- Update react-native to 0.73.2. ([#26308](https://github.com/expo/expo/pull/26308) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.6.1 — 2023-12-19

### 🎉 New features

- Added support for React Native 0.73.1. ([#25998](https://github.com/expo/expo/pull/25998) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- [expo-updates] Add relaunch to disabled and dev client controllers. ([#25973](https://github.com/expo/expo/pull/25973) by [@wschurman](https://github.com/wschurman))

## 3.6.0 — 2023-12-15

### 🐛 Bug fixes

- [iOS] Fixed Error View colors on dark mode. ([#25974](https://github.com/expo/expo/pull/25974) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.5.1 — 2023-12-12

_This version does not introduce any user-facing changes._

## 3.5.0 — 2023-12-12

### 🎉 New features

- Launch directly into the previously opened project by default. ([#25500](https://github.com/expo/expo/pull/25500) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Remove outdated assets before rebuilding. ([#25821](https://github.com/expo/expo/pull/25821) by [@EvanBacon](https://github.com/EvanBacon))
- Bump C++ compiler setting to C++20. ([#25548](https://github.com/expo/expo/pull/25548) by [@kudo](https://github.com/kudo))

## 3.4.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- [Android] Fix dev server not using query params from manifest when loading the JS bundle. ([#25061](https://github.com/expo/expo/pull/25061), [#25147](https://github.com/expo/expo/pull/25147) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Update bundles with new Metro chaining and StatusBar mocks. ([#25148](https://github.com/expo/expo/pull/25148) by [@EvanBacon](https://github.com/EvanBacon))
- Rebuild with Metro inline requires enabled. ([#25089](https://github.com/expo/expo/pull/25089) by [@EvanBacon](https://github.com/EvanBacon))
- Remove deprecated `REACT_NATIVE_OVERRIDE_VERSION` for React Native nightly testing. ([#25151](https://github.com/expo/expo/pull/25151) by [@kudo](https://github.com/kudo))
- Removed backward compatible code for deprecated SDKs. ([#25154](https://github.com/expo/expo/pull/25154) by [@kudo](https://github.com/kudo))
- Split updates controllers depending on configuration, changing native public API. ([#25085](https://github.com/expo/expo/pull/25085) by [@wschurman](https://github.com/wschurman))

## 3.3.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Improve 'Development servers' and 'Recently opened' UX. ([#24665](https://github.com/expo/expo/pull/24665) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add support for skipping the launcher screen and launching directly into a previously opened project. ([#24614](https://github.com/expo/expo/pull/24614), [#24646](https://github.com/expo/expo/pull/24646), [#24758](https://github.com/expo/expo/pull/24758) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- [iOS] Fix Cmd+D opening React Native Debug Menu on launcher screen. ([#24580](https://github.com/expo/expo/pull/24580) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Fixed app launch when using multiple scenes. ([#24565](https://github.com/expo/expo/pull/24565) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fetch dev sessions whenever navigating to the launcher home screen. ([#24378](https://github.com/expo/expo/pull/24378), [#24502](https://github.com/expo/expo/pull/24502) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))
- Drop support for configuring SDK 44 and below with Prebuild. ([#24504](https://github.com/expo/expo/pull/24504) by [@EvanBacon](https://github.com/EvanBacon))

## 2.4.13 — 2023-09-25

### 🐛 Bug fixes

- Fetch dev sessions whenever navigating to the launcher home screen. ([#24378](https://github.com/expo/expo/pull/24378), [#24502](https://github.com/expo/expo/pull/24502) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.2.1 — 2023-09-18

_This version does not introduce any user-facing changes._

## 2.4.12 — 2023-09-16

### 💡 Others

- Revert [dev-launcher] Fetch dev sessions whenever navigating to Home screen (#24378))

## 2.4.11 — 2023-09-15

### 🐛 Bug fixes

- Fetch dev sessions whenever navigating to the launcher home screen. ([#24378](https://github.com/expo/expo/pull/24378) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Update dev sessions default ports to check. ([#24380](https://github.com/expo/expo/pull/24380) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.2.0 — 2023-09-15

### 💡 Others

- Update dev sessions default ports to check. ([#24380](https://github.com/expo/expo/pull/24380) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fetch dev sessions whenever navigating to the launcher home screen. ([#24378](https://github.com/expo/expo/pull/24378) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.1.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Use correct `httpServerLocation` files during export. ([#24090](https://github.com/expo/expo/pull/24090) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Migrate to Expo CLI. ([#23806](https://github.com/expo/expo/pull/23806) by [@EvanBacon](https://github.com/EvanBacon))
- Change source of truth for constants types. ([#24049](https://github.com/expo/expo/pull/24049) by [@wschurman](https://github.com/wschurman))
- Remove classic manifest types. ([#24053](https://github.com/expo/expo/pull/24053) by [@wschurman](https://github.com/wschurman))

## 3.0.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 2.4.9 — 2023-07-26

### 🐛 Bug fixes

- Fixed "Can't toast on a thread that has not called Looper.prepare()" Exception when enabling "Sampling Profiler on init" ([#23706](https://github.com/expo/expo/pull/23706) by [@hirbod](https://github.com/hirbod))

## 2.4.8 - 2023-07-12

### 💡 Others

- Added support for React Native 0.72.3 ([#23502](https://github.com/expo/expo/pull/23502) by [@tsapeta](https://github.com/tsapeta))

## 2.4.7 - 2023-07-10

_This version does not introduce any user-facing changes._

## 2.4.6 - 2023-07-04

_This version does not introduce any user-facing changes._

## 2.4.5 - 2023-06-30

### 🐛 Bug fixes

- Enable network inspector by default even the `EX_DEV_CLIENT_NETWORK_INSPECTOR` property is not defined. ([#23185](https://github.com/expo/expo/pull/23185) by [@kudo](https://github.com/kudo))
- Fixed iOS build errors in `use_frameworks!` mode. ([#23218](https://github.com/expo/expo/pull/23218) by [@kudo](https://github.com/kudo))
- Added support for React Native 0.72.1. ([#23262](https://github.com/expo/expo/pull/23262) by [@kudo](https://github.com/kudo))

## 2.4.4 — 2023-06-28

### 🐛 Bug fixes

- [iOS] Fixed network inspector losing events when the dev-server listening on port other than 8081. ([#23122](https://github.com/expo/expo/pull/23122) by [@kudo](https://github.com/kudo))
- Fixed no updates showing in the Extensions tab. ([#23163](https://github.com/expo/expo/pull/23163) by [@kudo](https://github.com/kudo))

## 2.4.3 — 2023-06-27

### 🎉 New features

- Add support for SSO users. ([#22873](https://github.com/expo/expo/pull/22873) by [@wschurman](https://github.com/wschurman))
- Update user avatars to use the same logic as the website. ([#23114](https://github.com/expo/expo/pull/23114) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 2.4.2 — 2023-06-23

### 🐛 Bug fixes

- Fixed compatibility issue with react-native-reanimated on iOS. ([#23057](https://github.com/expo/expo/pull/23057) by [@kudo](https://github.com/kudo))

## 2.4.1 — 2023-06-22

_This version does not introduce any user-facing changes._

## 2.4.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `robolectric` to `4.10`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- Allow users to manually load apps without specifying a URL scheme. ([#22637](https://github.com/expo/expo/pull/22637) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))
- Run tsc and lint and tests on bundle. ([#22866](https://github.com/expo/expo/pull/22866) by [@wschurman](https://github.com/wschurman))
- Added support for the new architecture. ([#22607](https://github.com/expo/expo/pull/22607), [#22184](https://github.com/expo/expo/pull/22184) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Fix modern manifest serving for dev client without expo-updates. ([#22470](https://github.com/expo/expo/pull/22470) by [@wschurman](https://github.com/wschurman))
- Fixed react-native nighlies `0.73.0-nightly-20230515-066f0b76d` build errors on Android. ([#22503](https://github.com/expo/expo/pull/22503) by [@kudo](https://github.com/kudo))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))
- Fixed Home screen KeyboardAvoidingView. ([#22661](https://github.com/expo/expo/pull/22661) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Refactored network inspector code and add unit tests. ([#22669](https://github.com/expo/expo/pull/22669), [#22693](https://github.com/expo/expo/pull/22693) by [@kudo](https://github.com/kudo))
- Fixed `No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine.` when using JavaScript debugger on Android. ([#20280](https://github.com/expo/expo/pull/20280) by [@kudo](https://github.com/kudo))
- Fix "multiple screens with the same name" warning on dev mode. ([#22847](https://github.com/expo/expo/pull/22847) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Fixed incorrect `Linking.getInitialURL()` value when launching through expo-dev-client's deep links. ([#22879](https://github.com/expo/expo/pull/22879) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrate iOS native modules to use the new Module API. ([#22319](https://github.com/expo/expo/pull/22319) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Bump `babel-plugin-module-resolver` dev dependency. ([#22871](https://github.com/expo/expo/pull/22871) by [@EvanBacon](https://github.com/EvanBacon))
- Improve URL input validation responsiveness. ([#22786](https://github.com/expo/expo/pull/22786) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 2.3.0 — 2023-05-08

### 🎉 New features

- Add support to loading Expo modules. ([#22174](https://github.com/expo/expo/pull/22174) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Fixed build errors on React Native 0.72.x. ([#22189](https://github.com/expo/expo/pull/22189) by [@kudo](https://github.com/kudo))

### 💡 Others

- Convert EXManifests iOS implementation to Swift. ([#21298](https://github.com/expo/expo/pull/21298) by [@wschurman](https://github.com/wschurman))
- Set NODE_ENV before exporting bundles. ([#21983](https://github.com/expo/expo/pull/21983) by [@EvanBacon](https://github.com/EvanBacon))

### 📚 3rd party library updates

- Update `react-native` to 0.71.7. ([#22253](https://github.com/expo/expo/pull/22253) by [@kudo](https://github.com/kudo))

## 2.2.1 - 2023-04-14

### 🐛 Bug fixes

- Fixed `Invalid State: Cannot call send: until connection is open` crash when using network inspector on iOS. ([#22130](https://github.com/expo/expo/pull/22130) by [@kudo](https://github.com/kudo))

## 2.2.0 - 2023-04-13

### 🎉 New features

- Added experimental network inspector. ([#21265](https://github.com/expo/expo/pull/21265), [#21327](https://github.com/expo/expo/pull/21327) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Add missing `mimeType` when emitting network responses. ([#21676](https://github.com/expo/expo/pull/21676) by [@byCedric](https://github.com/byCedric))
- Add missing `Network.requestWillBeSentExtraInfo` when emitting network requests. ([#21965](https://github.com/expo/expo/pull/21965) by [@byCedric](https://github.com/byCedric))
- Don't require legacy manifest signature in dev clients. ([#21970](https://github.com/expo/expo/pull/21970) by [@wschurman](https://github.com/wschurman))

## 2.1.6 - 2023-03-20

### 🐛 Bug fixes

- Change arg in gradle `.execute()` call to null to inherit env variables from user's env ([#21712](https://github.com/expo/expo/pull/21712) by [@phoenixiguess](https://github.com/phoenixiguess))

## 2.1.5 - 2023-03-03

### 💡 Others

- Update JS bundle to fix dev client not showing logged user and initial data. ([#21510](https://github.com/expo/expo/pull/21510) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 2.1.4 — 2023-02-28

### 🐛 Bug fixes

- Fixed dev client crash when server URL has no scheme. ([#21274](https://github.com/expo/expo/pull/21274) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fixed dev client not showing logged user and initial data. ([#21425](https://github.com/expo/expo/pull/21425) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 2.1.3 — 2023-02-25

_This version does not introduce any user-facing changes._

## 2.1.2 — 2023-02-17

_This version does not introduce any user-facing changes._

## 2.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 2.1.0 — 2023-02-03

### 🐛 Bug fixes

- Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))
- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 💡 Others

- Locked `layoutDirection` to LTR to prevent incorrect rendering when used together with a RTL enabled app. ([#19634](https://github.com/expo/expo/pull/19634) by [@aleqsio](https://github.com/aleqsio))
- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- Update copy for expo start for development builds. ([#20985](https://github.com/expo/expo/pull/20985) by [@kbrandwijk](https://github.com/kbrandwijk))

## 2.0.2 - 2022-11-21

### 🐛 Bug fixes

- Fixed `RCTStatusBarManager` module requires that the `UIViewControllerBasedStatusBarAppearance` to be false on iOS. ([#20104](https://github.com/expo/expo/pull/20104) by [@lukmccall](https://github.com/lukmccall))

## 2.0.1 - 2022-11-08

### 🐛 Bug fixes

- Fixed build errors when testing on React Native nightly builds. ([#19369](https://github.com/expo/expo/pull/19369) by [@kudo](https://github.com/kudo), [#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
- Fixed Android `java.lang.AssertionError: TurboModules are enabled, but mTurboModuleRegistry hasn't been set.` error when running on new architecture mode. ([#19931](https://github.com/expo/expo/pull/19931) by [@kudo](https://github.com/kudo))

## 2.0.0 — 2022-10-27

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))
- Moved to React Navigation v6, required for React Native 0.70.x. ([#19675](https://github.com/expo/expo/pull/19675) by [@douglowder](https://github.com/douglowder))

## 1.3.1 — 2022-10-11

### 🐛 Bug fixes

- Fixed development servers not showing up in the `expo-dev-launcher` on the first boot. ([#19286](https://github.com/expo/expo/pull/19286) by [@lukmccall](https://github.com/lukmccall))

## 1.3.0 — 2022-09-16

### 🎉 New features

- Better support for landscape orientation. ([#19010](https://github.com/expo/expo/pull/19010) by [@ajsmth](https://github.com/ajsmth))

### 🐛 Bug fixes

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Remove the deprecated `Linking.removeEventListener` in expo-dev-launcher bundle. ([#18939](https://github.com/expo/expo/pull/18939) by [@kudo](https://github.com/kudo))
- Fixed the incompatibility with react-native-v8 on Android. ([#19117](https://github.com/expo/expo/pull/19117) by [@kudo](https://github.com/kudo))
- Fixed crash when loading bundle without explicit port on Android. ([#19136](https://github.com/expo/expo/pull/19136) by [@kudo](https://github.com/kudo))

### 💡 Others

- Refactored inline Android emulator checks to use enhanced checking in `EmulatorUtilities.isRunningOnEmulator()`. ([#16177](https://github.com/expo/expo/pull/16177)) by [@kbrandwijk](https://github.com/kbrandwijk), [@keith-kurak](https://github.com/keith-kurak))
- Switched uncaught exception logging to use metro websocket instead of expo-cli logUrl. ([#18787](https://github.com/expo/expo/pull/18787) by [@esamelson](https://github.com/esamelson))
- Disable onboarding popup with URL query param. ([#19024](https://github.com/expo/expo/pull/19024) by [@douglowder](https://github.com/douglowder))

## 1.2.1 — 2022-08-16

### 🐛 Bug fixes

- Fix deferred deep link handling on iOS. ([#18614](https://github.com/expo/expo/pull/18614)) by [@ajsmth](https://github.com/ajsmth)

### 💡 Others

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
