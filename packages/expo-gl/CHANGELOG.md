# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.4.0 — 2023-02-14

### 🎉 New features

- Add support for the `GL_UNPACK_ALIGNMENT` parameter in the `pixelStorei` method. ([#21212](https://github.com/expo/expo/pull/21212) by [@BanBart](https://github.com/BanBart))

## 12.3.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.3.0 — 2023-02-03

### 🎉 New features

- Migrated the view manager to the new Expo modules API and thus added support for Fabric on Android. ([#20749](https://github.com/expo/expo/pull/20749) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.2.0 — 2022-12-30

### 🐛 Bug fixes

- Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))

## 12.1.0 — 2022-12-05

### 🎉 New features

- Migrated the view manager to the new Expo modules API and thus added support for Fabric. ([#19859](https://github.com/expo/expo/pull/19859) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed build errors when testing on React Native nightly builds. ([#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
- Fixed error for duplicated META-INF files when building on Android. ([#20251](https://github.com/expo/expo/pull/20251) by [@kudo](https://github.com/kudo))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Use shared C++ runtime to reduce library size on Android. ([#19372](https://github.com/expo/expo/pull/19372) by [@kudo](https://github.com/kudo))

### 💡 Others

- Merge `GLViewProps` and `BaseGLViewProps` into one type - `GLViewProps`. ([#18322](https://github.com/expo/expo/pull/18322) by [@Simek](https://github.com/Simek))
- Rename Web-specific prop types from `GLViewProps` to `GLViewWebProps`. ([#18322](https://github.com/expo/expo/pull/18322) by [@Simek](https://github.com/Simek))
- Merge `expo-gl-cpp` package into `expo-gl`. ([#18875](https://github.com/expo/expo/pull/18875) by [@wkozyra95](https://github.com/wkozyra95))

### ⚠️ Notices

- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))

## 11.4.0 — 2022-07-07

### 🐛 Bug fixes

- Stop rendering when app is backgrounded on iOS. ([#17463](https://github.com/expo/expo/pull/17463) by [@wkozyra95](https://github.com/wkozyra95))
- Added support for React Native 0.69.x. ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))

## 11.3.0 — 2022-04-27

### 🐛 Bug fixes

- Fix crash on android 11 by packaging worklet `jsi:Runtime*` inside ArrayBuffer. ([#17194](https://github.com/expo/expo/pull/17194) by [@wkozyra95](https://github.com/wkozyra95))

## 11.2.2 — 2022-04-21

### 🐛 Bug fixes

- Fix import errors when option `inlineRequires` is enabled in `metro.config.js`. ([#17141](https://github.com/expo/expo/pull/17141) by [@wkozyra95](https://github.com/wkozyra95))

## 11.2.1 — 2022-04-20

_This version does not introduce any user-facing changes._

## 11.2.0 — 2022-04-18

### 🐛 Bug fixes

- Fix support for React Native 0.68 by building `expo-gl-cpp` from source. ([#17060](https://github.com/expo/expo/pull/17060) by [@wkozyra95](https://github.com/wkozyra95))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix segfault in iOS draw loop. ([#15653](https://github.com/expo/expo/pull/15653) by [@wkozyra95](https://github.com/wkozyra95))
- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.1.1 — 2021-12-08

_This version does not introduce any user-facing changes._

## 11.1.0 — 2021-12-03

### 🎉 New features

- Add support for reanimated worklets. ([#15296](https://github.com/expo/expo/pull/15296) by [@wkozyra95](https://github.com/wkozyra95))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Remove `OES_vertex_array_object` from list of supported extensions. ([#14299](https://github.com/expo/expo/pull/14299) by [@wkozyra95](https://github.com/wkozyra95))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 10.4.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-camera-interface`, `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.3.0 — 2021-04-20

### 🎉 New features

- Implemented basic functionality of `getSupportedExtensions` and `getExtension` methods. However, some of the supported extensions are platform-specific so they may differ from what is described in WebGL extensions specification. ([#12309](https://github.com/expo/expo/pull/12309) by [@tsapeta](https://github.com/tsapeta))

## 10.2.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Implemented support for `getInternalformatParameter` ([#11614](https://github.com/expo/expo/pull/11614) by [@zenios](https://github.com/zenios))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.1.0 — 2021-01-15

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))

## 10.0.0 — 2020-12-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.2.0 — 2020-11-17

### 🐛 Bug fixes

- Fixed a bug causing an application crash when enabling remote debugging on Android. ([#10381](https://github.com/expo/expo/pull/10381) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed support for offset in TypedArray. ([#10692](https://github.com/expo/expo/pull/10692) by [@wkozyra95](https://github.com/wkozyra95))

## 9.1.1 — 2020-08-26

### 🎉 New features

- Enable stencil buffer on Android ([#9928](https://github.com/expo/expo/pull/9928) by [@wkozyra95](https://github.com/wkozyra95))

## 9.1.0 — 2020-08-18

### 🐛 Bug fixes

- Fix bug preventing GLView from rendering in SSR environments. ([#9691](https://github.com/expo/expo/pull/9691) by [@EvanBacon](https://github.com/EvanBacon))

## 9.0.0 — 2020-08-11

### 🛠 Breaking changes

- This version requires at least version 0.63.0 of React Native. It may crash when used with older versions. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))

### 🎉 New features

- Full rewrite of expo-gl-cpp, migration to JSI. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))
- Introduced compatibility with Hermes, however you should treat this feature as unstable so use it with Hermes at your own risk. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))

## 8.4.0 — 2020-07-17

### 🐛 Bug fixes

- Delete `prop-types` in favor of TypeScript. ([#8675](https://github.com/expo/expo/pull/8675) by [@EvanBacon](https://github.com/EvanBacon))
- Fix crashes on iOS14 caused by different integer representation in the new JSC. ([#9226](https://github.com/expo/expo/pull/9226) by [@wkozyra95](https://github.com/wkozyra95))

## 8.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-05-27

_This version does not introduce any user-facing changes._

## 8.2.0

### 🎉 New features

- Improved logging and added some more logging options. ([#7550](https://github.com/expo/expo/pull/7550) by [@tsapeta](https://github.com/tsapeta))
- Add WebP format as an option when taking GL snapshots (Android only). ([#7490](https://github.com/expo/expo/pull/7490) by [@pacoelayudante](https://github.com/pacoelayudante))

### 🐛 Bug fixes

- Fix `createElement` import error introduced in [#7995](https://github.com/expo/expo/pull/7995) - `react-native-web@0.12` ([#8671](https://github.com/expo/expo/pull/8671) by [@EvanBacon](https://github.com/EvanBacon))
- Fix crash in React Native 0.62 when creating a context. ([#8352](https://github.com/expo/expo/pull/8352) by [@wkozyra95](https://github.com/wkozyra95))
- Allow createElement & unstable_createElement usage for web. ([#7995](https://github.com/expo/expo/pull/7995) by [@wood1986](https://github.com/wood1986))
- Fix depth/stencil buffers not working correctly with `three.js`. ([#7543](https://github.com/expo/expo/pull/7543) by [@tsapeta](https://github.com/tsapeta))
