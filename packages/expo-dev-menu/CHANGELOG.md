# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed iOS build errors in `use_frameworks!` mode. ([#23218](https://github.com/expo/expo/pull/23218) by [@kudo](https://github.com/kudo))

### 💡 Others

## 3.1.4 — 2023-06-28

_This version does not introduce any user-facing changes._

## 3.1.3 — 2023-06-27

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))
- Remove unused fonts. ([#23107](https://github.com/expo/expo/pull/23107) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.1.2 — 2023-06-23

### 🐛 Bug fixes

- Fixed compatibility issue with react-native-reanimated on iOS. ([#23057](https://github.com/expo/expo/pull/23057) by [@kudo](https://github.com/kudo))

## 3.1.1 — 2023-06-22

_This version does not introduce any user-facing changes._

## 3.1.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `robolectric` to `4.10`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))
- Added support for the new architecture. ([#22607](https://github.com/expo/expo/pull/22607), [#22184](https://github.com/expo/expo/pull/22184) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Fixed react-native nighlies `0.73.0-nightly-20230515-066f0b76d` build errors on Android. ([#22503](https://github.com/expo/expo/pull/22503) by [@kudo](https://github.com/kudo))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

### 💡 Others

- Update onboarding text to be more concise and clear, and fix compat with large text accessibiltiy settings. ([#22712](https://github.com/expo/expo/pull/22712) by [@brentvatne](https://github.com/brentvatne))
- Bump `babel-plugin-module-resolver` dev dependency. ([#22871](https://github.com/expo/expo/pull/22871) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.0 — 2023-05-08

### 🛠 Breaking changes

- Update iOS and Android entry points to support custom entry files (changed `index` to `.expo/.virtual-metro-entry`). This requires all projects to use `expo/metro-config` as the base config. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed reload crash when expo-dev-menu is turned off. ([#21279](https://github.com/expo/expo/pull/21279) by [@jayshah123](https://github.com/jayshah123))
- Fix JS entry file in development builds. ([#21984](https://github.com/expo/expo/pull/21984) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Update the start script to dynamically locate the packager IP from any network interface. ([#21977](https://github.com/expo/expo/pull/21977) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Fix assert in `requestOverlayMetricsIfNeeded` failing when the device is rotated to landscape orientation. ([#22598](https://github.com/expo/expo/pull/22598) by [@behenate](https://github.com/behenate))

### 💡 Others

- Convert EXManifests iOS implementation to Swift. ([#21298](https://github.com/expo/expo/pull/21298) by [@wschurman](https://github.com/wschurman))
- Rewrite vendored safe area view using the new modules API. ([#22174](https://github.com/expo/expo/pull/22174) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Migrate iOS native modules to use the new Module API. ([#22263](https://github.com/expo/expo/pull/22263) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### ⚠️ Notices

- Disable the `Remote JS debugger` option on menu when using SDK 49 or above. ([#22010](https://github.com/expo/expo/pull/22010) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 📚 3rd party library updates

- Update `react-native` to 0.71.7. ([#22253](https://github.com/expo/expo/pull/22253) by [@kudo](https://github.com/kudo))

## 2.2.0 - 2023-04-13

### 🎉 New features

- Added experimental react-devtools integration. ([#21462](https://github.com/expo/expo/pull/21462) by [@kudo](https://github.com/kudo))

## 2.1.4 - 2023-03-20

### 🐛 Bug fixes

- Change arg in gradle `.execute()` call to null to inherit env variables from user's env ([#21712](https://github.com/expo/expo/pull/21712) by [@phoenixiguess](https://github.com/phoenixiguess))

## 2.1.2 — 2023-02-17

### 🐛 Bug fixes

- Fixed `'jsc/JSCRuntime.h' file not found` when using JSC on iOS. ([#21246](https://github.com/expo/expo/pull/21246) by [@lukmccall](https://github.com/lukmccall))

## 2.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 2.1.0 — 2023-02-03

### 🐛 Bug fixes

- Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))
- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 2.0.2 - 2022-11-21

### 🐛 Bug fixes

- Fixed `RCTStatusBarManager` module requires that the `UIViewControllerBasedStatusBarAppearance` to be false on iOS. ([#20104](https://github.com/expo/expo/pull/20104) by [@lukmccall](https://github.com/lukmccall))
- Fixed writing 'r' into text input reloading the app on iOS. ([#20107](https://github.com/expo/expo/pull/20107) by [@lukmccall](https://github.com/lukmccall))

## 2.0.1 - 2022-11-08

### 🐛 Bug fixes

- Fixed build errors when testing on React Native nightly builds. ([#19369](https://github.com/expo/expo/pull/19369) by [@kudo](https://github.com/kudo), [#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
- Fixed Android `java.lang.AssertionError: TurboModules are enabled, but mTurboModuleRegistry hasn't been set.` error when running on new architecture mode. ([#19931](https://github.com/expo/expo/pull/19931) by [@kudo](https://github.com/kudo))

## 2.0.0 — 2022-10-27

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Locked `layoutDirection` to LTR to prevent incorrect rendering when used together with a RTL enabled app. ([#19634](https://github.com/expo/expo/pull/19634) by [@aleqsio](https://github.com/aleqsio))

### ⚠️ Notices

- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))

## 1.3.1 — 2022-10-11

### 🐛 Bug fixes

- Fix compilation error when the `compileSdkVersion` is set to 33. ([#19271](https://github.com/expo/expo/pull/19271) by [@lukmccall](https://github.com/lukmccall))
- Fixed the _Local dev tools_ menu doesn't work for Hermes. ([#19301](https://github.com/expo/expo/pull/19301) by [@kudo](https://github.com/kudo))

## 1.3.0 — 2022-09-16

### 💡 Others

- Disable onboarding popup with URL query param. ([#19024](https://github.com/expo/expo/pull/19024) by [@douglowder](https://github.com/douglowder))

## 1.2.1 — 2022-08-16

### 🐛 Bug fixes

- Fixes `PanGestureHandler` does not get active when it has a `simultaneousHandler` on iOS. ([#18657](https://github.com/expo/expo/pull/18657) by [@lukmccall](https://github.com/lukmccall))

## 1.2.0 — 2022-08-11

### 🎉 New features

- Add landscape orienation support. ([#18509](https://github.com/expo/expo/pull/18509)) by [@ajsmth](https://github.com/ajsmth)

### 🐛 Bug fixes

- Fix the duplicated `DevMenuRNGestureHandlerStateManager.h` output file compilation error on iOS. ([#18562](https://github.com/expo/expo/pull/18562) by [@lukmccall](https://github.com/lukmccall))

## 1.1.1 — 2022-07-20

### 🐛 Bug fixes

- Fixed compatibility with the `react-native-reanimated` on iOS. ([#18306](https://github.com/expo/expo/pull/18306) by [@lukmccall](https://github.com/lukmccall))

## 1.1.0 — 2022-07-18

### 🎉 New features

- Added support for React Native 0.69.X. ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo) & [#18182](https://github.com/expo/expo/pull/18182) by [@lukmccall](https://github.com/lukmccall))

## 1.0.1 — 2022-07-14

### 🐛 Bug fixes

- [iOS] fix use_frameworks! compilation. ([#18073](https://github.com/expo/expo/pull/18073) by [@douglowder](https://github.com/douglowder))

## 1.0.0 — 2022-06-09

### 🐛 Bug fixes

- Fixed the singleton `RCTBridge.currentBridge` instance value be override by expo-dev-menu bridge instance on iOS. ([#17780](https://github.com/expo/expo/pull/17780) by [@kudo](https://github.com/kudo))

## 0.11.0 — 2022-06-07

### 🎉 New features

- Add JS API to register buttons in dev menu. ([#17528](https://github.com/expo/expo/pull/17528) by [@ajsmth](https://github.com/ajsmth))

### 🐛 Bug fixes

- Update dev settings when initial props change. ([#17663](https://github.com/expo/expo/pull/17663) by [@esamelson](https://github.com/esamelson))
- Fix copy on onboarding screen re: location of "Send Keyboard Input to Device" in system menu. ([#17767](https://github.com/expo/expo/pull/17767) by [@esamelson](https://github.com/esamelson))
- Restore JavaScript inspector menu item. ([#17762](https://github.com/expo/expo/pull/17762) by [@lukmccall](https://github.com/lukmccall))
- Restore the ability to open React Native dev menu. ([#17762](https://github.com/expo/expo/pull/17762) by [@lukmccall](https://github.com/lukmccall))

## 0.10.7 — 2022-05-19

_This version does not introduce any user-facing changes._

## 0.10.6 — 2022-05-06

### 🐛 Bug fixes

- Fix dev menu will reload the application when open for the first time while using Hermes. ([#17377](https://github.com/expo/expo/pull/17377) by [@lukmccall](https://github.com/lukmccall))

## 0.10.5 — 2022-05-05

### 🐛 Bug fixes

- Fix `unresolved reference: loadFonts` in the release build on Android. ([#17241](https://github.com/expo/expo/pull/17241) by [@lukmccall](https://github.com/lukmccall))
- Fix remote debugging crashing the application on iOS. ([#17248](https://github.com/expo/expo/pull/17248) by [@lukmccall](https://github.com/lukmccall))
- Fix crashes when the app was launched from a deep link and the react-native-reanimated were installed on Android. ([#17282](https://github.com/expo/expo/pull/17282) by [@lukmccall](https://github.com/lukmccall))

## 0.10.4 — 2022-04-26

### 🐛 Bug fixes

- Fix error on summoning dev-menu first time, that leads to the application freeze. ([#17215](https://github.com/expo/expo/pull/17215) by [@lukmccall](https://github.com/lukmccall))

## 0.10.3 — 2022-04-25

_This version does not introduce any user-facing changes._

## 0.10.2 — 2022-04-21

_This version does not introduce any user-facing changes._

## 0.10.1 — 2022-04-21

_This version does not introduce any user-facing changes._

## 0.10.0 — 2022-04-20

### 🎉 New features

- Add unit tests for react app. ([#16005](https://github.com/expo/expo/pull/16005) by [@ajsmth](https://github.com/ajsmth))
- Add expo-modules automatic setup on Android. ([#16441](https://github.com/expo/expo/pull/16441) by [@esamelson](https://github.com/esamelson))
- Remove regex-based config plugin mods in SDK 45+ projects. ([#16495](https://github.com/expo/expo/pull/16495) by [@esamelson](https://github.com/esamelson))
- Add expo-modules automatic setup on iOS. ([#16496](https://github.com/expo/expo/pull/16496) by [@esamelson](https://github.com/esamelson))
- Restore ability of host apps to disable dev client. ([#16521](https://github.com/expo/expo/pull/16521) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fix compatibility with react-native 0.66. ([#15914](https://github.com/expo/expo/pull/15914) by [@kudo](https://github.com/kudo))
- Fix Android crash when using Hermes on react-native 0.67. ([#16099](https://github.com/expo/expo/pull/16099) by [@kudo](https://github.com/kudo))
- Fix backwards compatibility with AppDelegate in existing projects. ([#16497](https://github.com/expo/expo/pull/16497) by [@esamelson](https://github.com/esamelson))
- Fix gradle buildscript compatibility with flavors ([#16686](https://github.com/expo/expo/issues/16686)). ([#16799](https://github.com/expo/expo/pull/16799) by [@esamelson](https://github.com/esamelson))
- Fix gradle buildscript compatibility for flavors using bundle keyword ([#16686](https://github.com/expo/expo/issues/16686#issuecomment-1088282480)). ([#16936](https://github.com/expo/expo/pull/16936) by [@dogfootruler-kr](https://github.com/dogfootruler-kr))

### 💡 Others

- Move unrelated dev-menu functions into dev-launcher. ([#16124](https://github.com/expo/expo/pull/16124) by [@ajsmth](https://github.com/ajsmth))
- Simplify dev-launcher / dev-menu relationship on iOS. ([#16067](https://github.com/expo/expo/pull/16067) by [@ajsmth](https://github.com/ajsmth))
- Simplify dev-launcher / dev-menu relationship on Android. ([#16228](https://github.com/expo/expo/pull/16228) by [@ajsmth](https://github.com/ajsmth))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 0.9.3 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.9.2 — 2022-01-18

_This version does not introduce any user-facing changes._

## 0.9.1 — 2022-01-17

### 🐛 Bug fixes

- Fix: release build won't install on Android 12. ([#15429](https://github.com/expo/expo/pull/15429) by [@zhigang1992](https://github.com/zhigang1992))

## 0.9.0 — 2021-12-22

### 🎉 New features

- Vendor react-native-safe-area-context. ([#15382](https://github.com/expo/expo/pull/15382) by [@ajsmth](https://github.com/ajsmth))
- Add ability to query development sessions with a device ID. ([#15539](https://github.com/expo/expo/pull/15539) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

## 0.8.6 — 2021-12-03

_This version does not introduce any user-facing changes._

## 0.8.5 — 2021-12-03

### 🐛 Bug fixes

- Fix hermes inspector opening wrong target. ([#14684](https://github.com/expo/expo/pull/14684) by [@kudo](https://github.com/kudo))
- Fix Gradle error when running Gradle from outside of the project directory. ([#15109](https://github.com/expo/expo/pull/15109) by [@kudo](https://github.com/kudo))
- Fix `Project is using deprecated .expo.* file extensions`. ([#15070](https://github.com/expo/expo/pull/15070) by [@lukmccall](https://github.com/lukmccall))
- Fix shake gesture sometimes brings two menus on Android. ([#15406](https://github.com/expo/expo/pull/15406) by [@lukmccall](https://github.com/lukmccall))

## 0.8.4 — 2021-10-21

_This version does not introduce any user-facing changes._

## 0.8.3 — 2021-10-15

### 🐛 Bug fixes

- Fix hermes inspector opening wrong target. ([#14684](https://github.com/expo/expo/pull/14684) by [@kudo](https://github.com/kudo))

## 0.8.2 — 2021-10-07

### 🛠 Breaking changes

- Changed the reload key command to `r` instead of `Cmd + r` on iOS. ([#14590](https://github.com/expo/expo/pull/14590) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 0.8.1 — 2021-09-03

### 🐛 Bug fixes

- Add missing override to release DevMenuManager.

## 0.8.0 — 2021-09-02

### 🎉 New features

- Fix compatibility with RN 0.65. ([#14064](https://github.com/expo/expo/pull/14064) by [@lukmccall](https://github.com/lukmccall))
- Add flag to disable auto-launch of dev menu on start. ([#14196](https://github.com/expo/expo/pull/14196) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fix only fullscreen opaque activities can request orientation. ([#14066](https://github.com/expo/expo/pull/14066) by [@lukmccall](https://github.com/lukmccall))
- Fix keyboard commands getting ignored after dev menu is shown. ([#14266](https://github.com/expo/expo/pull/14266) by [@fson](https://github.com/fson))

## 0.7.7 — 2021-08-06

### 🐛 Bug fixes

- Fixed menu binds to all keyboard shortcuts on Android. ([#13794](https://github.com/expo/expo/pull/13794) by [@lukmccall](https://github.com/lukmccall))

## 0.7.6 — 2021-08-04

_This version does not introduce any user-facing changes._

## 0.7.5 — 2021-07-08

### 🐛 Bug fixes

- Fixed web compatibility. ([#13535](https://github.com/expo/expo/pull/13535) by [@lukmccall](https://github.com/lukmccall))

## 0.7.4 — 2021-06-30

### 🐛 Bug fixes

- Order dev menu items consistently across platforms. ([#13449](https://github.com/expo/expo/pull/13449) by [@lukmccall](https://github.com/lukmccall))

## 0.7.3 — 2021-06-28

### 🐛 Bug fixes

- Fixed WebSocket handlers weren't registered properly on iOS. ([#13403](https://github.com/expo/expo/pull/13403) by [@lukmccall](https://github.com/lukmccall))
- Fix crash from inspector request failures. ([#13393](https://github.com/expo/expo/pull/13393) by [@kudo](https://github.com/kudo))

## 0.7.2 — 2021-06-24

### 🐛 Bug fixes

- [plugin] Use Node module resolution to find package paths for Podfile ([#13382](https://github.com/expo/expo/pull/13382) by [@fson](https://github.com/fson))

## 0.7.0 — 2021-06-10

_This version does not introduce any user-facing changes._

## 0.6.0 — 2021-06-08

### 🎉 New features

- Add JavaScript runtime information. ([#13042](https://github.com/expo/expo/pull/13042) by [@kudo](https://github.com/kudo))
- Add JavaScript inspector menu item. ([#13041](https://github.com/expo/expo/pull/13041) by [@kudo](https://github.com/kudo))
- Added WebSocket support. ([#12979](https://github.com/expo/expo/pull/12979) & [#12983](https://github.com/expo/expo/pull/12983) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed actions don't dismiss the dev-menu. ([#13021](https://github.com/expo/expo/pull/13021) by [@lukmccall](https://github.com/lukmccall))
- Fixed spamming profile or settings pushes multiple screens. ([#12935](https://github.com/expo/expo/pull/12935) by [@lukmccall](https://github.com/lukmccall))
- Fixed spamming profile or settings pushes multiple screens. ([#12935](https://github.com/expo/expo/pull/12935) by [@lukmccall](https://github.com/lukmccall))
- Fixed `dev-menu` items rearranging on iOS. ([#12980](https://github.com/expo/expo/pull/12980) by [@lukmccall](https://github.com/lukmccall))

## 0.5.2 — 2021-05-20

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 0.5.1 — 2021-05-12

### 🐛 Bug fixes

- Fixed compatibility with React Native 0.64.X. ([#12909](https://github.com/expo/expo/pull/12909) by [@lukmccall](https://github.com/lukmccall))

## 0.5.0 — 2021-05-11

### 🎉 New features

- [plugin] Prevent plugin from running multiple times in a single process. ([#12715](https://github.com/expo/expo/pull/12715) by [@EvanBacon](https://github.com/EvanBacon))
- [plugin] Added AppDelegate tests. ([#12651](https://github.com/expo/expo/pull/12651) by [@EvanBacon](https://github.com/EvanBacon))
- Float dev menu above RedBox on iOS. ([#12632](https://github.com/expo/expo/pull/12632) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Account for rubocop formatting in plugin. ([#12480](https://github.com/expo/expo/pull/12480) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `isAvailable` option in `DevMenuAction` having no effect. ([#12703](https://github.com/expo/expo/pull/12703) by [@lukmccall](https://github.com/lukmccall))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Remove test screens. ([#12850](https://github.com/expo/expo/pull/12850) by [@lukmccall](https://github.com/lukmccall))
- Fixed compilation error on older versions of the Kotlin compiler. ([#12853](https://github.com/expo/expo/pull/12853) by [@lukmccall](https://github.com/lukmccall))
- Fixed XCode warnings. ([#12798](https://github.com/expo/expo/pull/12798) by [@lukmccall](https://github.com/lukmccall))
- Fixed the `SafeAreaView` color wasn't applied correctly while using the dark mode. ([#12851](https://github.com/expo/expo/pull/12851) by [@lukmccall](https://github.com/lukmccall))
- [plugin] Removed unused menu initialization if expo-dev-launcher is installed on iOS. ([#12875](https://github.com/expo/expo/pull/12875) by [@lukmccall](https://github.com/lukmccall))

## 0.4.1 — 2021-03-30

### 🐛 Bug fixes

- Fix misspellings in READMEs. ([#12346](https://github.com/expo/expo/pull/12346) by [@wschurman](https://github.com/wschurman))
- Fixed "Safari cannot open the page because the address is invalid" on iOS. ([#12319](https://github.com/expo/expo/pull/12319) by [@lukmccall](https://github.com/lukmccall))

## 0.4.0 — 2021-03-24

### 🎉 New features

- Extensions from now can export their own screen. ([#11384](https://github.com/expo/expo/pull/11384) by [@lukmccall](https://github.com/lukmccall))
- Added option to sign in using an Expo account. ([#11915](https://github.com/expo/expo/pull/11915) by [@lukmccall](https://github.com/lukmccall))
- Made menu appearing faster on Android by re-using the react root view. ([#12275](https://github.com/expo/expo/pull/12275) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 0.3.1 — 2021-02-03

_This version does not introduce any user-facing changes._

## 0.3.0 — 2021-02-01

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 0.2.2 — 2021-01-25

_This version does not introduce any user-facing changes._

## 0.2.1 — 2021-01-15

_This version does not introduce any user-facing changes._

## 0.2.0 — 2021-01-15

_This version does not introduce any user-facing changes._

## 0.1.2 — 2020-12-28

_This version does not introduce any user-facing changes._

## 0.1.1 — 2020-12-22

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 0.1.0 — 2020-12-14

_This version does not introduce any user-facing changes._

## 0.0.4 — 2020-12-02

_This version does not introduce any user-facing changes._

## 0.0.3 — 2020-11-10

_This version does not introduce any user-facing changes._

## 0.0.2 — 2020-09-25

_This version does not introduce any user-facing changes._

## 0.0.1 — 2020-08-27

### 🎉 New features

- Upgrade react-navigation. ([#9555](https://github.com/expo/expo/pull/9555) by [@EvanBacon](https://github.com/EvanBacon))
