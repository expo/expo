# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 3.0.13 — 2025-09-22

### 🎉 New features

- Use app root to generate modules provider ([#39728](https://github.com/expo/expo/pull/39728) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.0.12 — 2025-09-18

### 💡 Others

- [iOS] Added support for passing pod targets that should be statically linked and not built as frameworks. ([#39742](https://github.com/expo/expo/pull/39742) by [@chrfalch](https://github.com/chrfalch))
- [Android] Migrated from `kotlinOptions` to `compilerOptions` DSL. ([#39794](https://github.com/expo/expo/pull/39794) by [@huextrat](https://github.com/huextrat))

## 3.0.11 — 2025-09-16

### 🐛 Bug fixes

- Regression: Support search paths and `nativeModulesDir` pointing directly at module folder ([#39669](https://github.com/expo/expo/pull/39669) by [@kitten](https://github.com/kitten))
- Mark `ios|macos|tvos` as supported when an Expo Module marks `apple` as a supported platform ([#39700](https://github.com/expo/expo/pull/39700) by [@kitten](https://github.com/kitten))

### 💡 Others

- Allow `expo-atlas` (devtool Expo Module) to be discovered in `devDependencies` ([#39688](https://github.com/expo/expo/pull/39688) by [@kitten](https://github.com/kitten))
- Allow resolving native modules via a `web` platform heuristic for autolinking module resolution in Expo CLI ([#39701](https://github.com/expo/expo/pull/39701) by [@kitten](https://github.com/kitten))

## 3.0.10 — 2025-09-10

_This version does not introduce any user-facing changes._

## 3.0.9 — 2025-09-10

### 💡 Others

- [iOS] Added support for pre-install step when USE_FRAMEWORKS is set in Podfile ([#39479](https://github.com/expo/expo/pull/39479) by [@chrfalch](https://github.com/chrfalch))
- Remove dependency on `find-up` ([#39470](https://github.com/expo/expo/pull/39470) by [@kitten](https://github.com/kitten))
- [iOS] Force codegen for `FBReactNativeSpec` when generated files are missing in React Native source ([#39512](https://github.com/expo/expo/pull/39512) by [@kitten](https://github.com/kitten))

## 3.0.8 — 2025-09-08

### 🐛 Bug fixes

- [Android] Fix `platformOptions` not being correctly assigned. ([#39445](https://github.com/expo/expo/pull/39445) by [@alanjhughes](https://github.com/alanjhughes))

## 3.0.7 — 2025-09-04

_This version does not introduce any user-facing changes._

## 3.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 3.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 3.0.4 — 2025-08-26

_This version does not introduce any user-facing changes._

## 3.0.3 — 2025-08-21

_This version does not introduce any user-facing changes._

## 3.0.2 — 2025-08-16

### 🐛 Bug fixes

- Regression: Use the command's root instead of the app's root when resolving extra build dependencies ([#38907](https://github.com/expo/expo/pull/38907) by [@kitten](https://github.com/kitten))
- [Android] Update resolveAppProjectConfigAsync to use sourceDir ([#39125](https://github.com/expo/expo/pull/39125) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Refactor command implementations and deprecate old Expo modules autolinking API ([#38907](https://github.com/expo/expo/pull/38907) by [@kitten](https://github.com/kitten))
- Add internal API to scan only for Expo modules ([#38909](https://github.com/expo/expo/pull/38909) by [@kitten](https://github.com/kitten))
- Expose `getLinkingImplementationForPlatform` and `PackageRevision` for Expo modules from internal autolinking API ([#38913](https://github.com/expo/expo/pull/38913) by [@kitten](https://github.com/kitten))

## 3.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 3.0.0 — 2025-08-13

### 🛠 Breaking changes

- Reimplement Turbo Modules and Expo Modules discovery algorithm. Native modules are now discovered according to Node resolution by default, which can be overridden to the old behaviour by specifying `searchPaths` manually. The default behaviour will recursively resolve Node `dependencies` and `peerDependencies` ([#38282](https://github.com/expo/expo/pull/38282) by [@kitten](https://github.com/kitten))
- Update `verify` command to check React Native modules as well, change `--json` output format, and accept `--verbose` option ([#38766](https://github.com/expo/expo/pull/38766) by [@kitten](https://github.com/kitten))

### 🎉 New features

- Add `--source-dir` option ([#38218](https://github.com/expo/expo/pull/38218) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Add `:projectRoot` option to `use_expo_modules!` ([#38210](https://github.com/expo/expo/pull/38210) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [Android] Support auto-linking C++-only Turbo Modules on Android (as per `@react-native-community/cli-platform-android` changes) ([#38626](https://github.com/expo/expo/pull/38626) by [@kitten](https://github.com/kitten))
- Respect `expo.autolinking.exclude` option for React Native modules as well ([#38635](https://github.com/expo/expo/pull/38635) by [@kitten](https://github.com/kitten))
- Add `expo.autolinking.legacy_shallowReactNativeLinking` option to restore legacy behavior that doesn't autolink transitive React Native modules ([#38635](https://github.com/expo/expo/pull/38635) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

- [Android] Improved erorr message when we don't support Kotlin version provided by the user. ([#37802](https://github.com/expo/expo/pull/37802) by [@lukmccall](https://github.com/lukmccall))
- Prevent Expo Modules from being detected as C++-only React Native modules ([#38658](https://github.com/expo/expo/pull/38658) by [@kitten](https://github.com/kitten))
- Ignore optional peer dependencies in dependency traversal ([#38713](https://github.com/expo/expo/pull/38713) by [@kitten](https://github.com/kitten))

### 💡 Others

- [iOS] Add support for user script sandboxing ([#38206](https://github.com/expo/expo/pull/38206) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Refactor JSON loading in `findModules` algorithm path to use plain `fs`. ([#38202](https://github.com/expo/expo/pull/38202) by [@kitten](https://github.com/kitten))
- Add internal API for dual autolinking dependency resolution ([#38680](https://github.com/expo/expo/pull/38680) by [@kitten](https://github.com/kitten))

## 2.1.14 - 2025-07-07

### 🐛 Bug fixes

- Fixed breaking change for local AAR autolinking. ([#37882](https://github.com/expo/expo/pull/37882) by [@kudo](https://github.com/kudo))
- [Android] Fixed local aar files is not being linked correctly. ([#37280](https://github.com/expo/expo/pull/37280) by [@lukmccall](https://github.com/lukmccall))

## 2.1.13 - 2025-07-01

### 💡 Others

- Added `System.getenv()` syntax support to credentials for extraMavenRepos. ([#37343](https://github.com/expo/expo/pull/37343) by [@kudo](https://github.com/kudo))

## 2.1.12 - 2025-06-18

### 🐛 Bug fixes

- Fix updates native debug for iOS. ([#37323](https://github.com/expo/expo/pull/37323) by [@douglowder](https://github.com/douglowder))

## 2.1.11 - 2025-06-08

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))
- Added `--transitive-linking-dependencies` option to support react-native-edge-to-edge autolinking in CNG projects. ([#37194](https://github.com/expo/expo/pull/37194) by [@kudo](https://github.com/kudo))

## 2.1.10 — 2025-05-06

### 🐛 Bug fixes

- [Android] Fixed project properties were not being resolved correctly. ([#36666](https://github.com/expo/expo/pull/36666) by [@lukmccall](https://github.com/lukmccall))

## 2.1.9 — 2025-04-30

_This version does not introduce any user-facing changes._

## 2.1.8 — 2025-04-28

### 🐛 Bug fixes

- Fixed `react-native-config` linked result order. ([#36442](https://github.com/expo/expo/pull/36442) by [@kudo](https://github.com/kudo))

## 2.1.7 — 2025-04-25

_This version does not introduce any user-facing changes._

## 2.1.6 — 2025-04-23

_This version does not introduce any user-facing changes._

## 2.1.5 — 2025-04-21

### 🎉 New features

- Removed restriction preventing local expo modules from being excluded from autolinking. ([#36117](https://github.com/expo/expo/pull/36117) by [@wuguishifu](https://github.com/wuguishifu))

### 🐛 Bug fixes

- Fixed Android building error on Windows. ([#36179](https://github.com/expo/expo/pull/36179) by [@kudo](https://github.com/kudo))

## 2.1.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 2.1.3 — 2025-04-11

### 🎉 New features

- [Android] Support `android.enableEdgeToEdge` field in app config. ([#35958](https://github.com/expo/expo/pull/35958) by [@behenate](https://github.com/behenate))

## 2.1.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 2.1.1 — 2025-04-08

### 🐛 Bug fixes

- Fixed E2E test timeout. ([#35953](https://github.com/expo/expo/pull/35953) by [@kudo](https://github.com/kudo))

## 2.1.0 — 2025-04-04

### 🛠 Breaking changes

- Refactored how declaring multiple Android projects works. ([#35138](https://github.com/expo/expo/pull/35138) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Added `coreFeatures` field. ([#34015](https://github.com/expo/expo/pull/34015) by [@lukmccall](https://github.com/lukmccall))
- Add macOS support. ([#35065](https://github.com/expo/expo/pull/35065) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [Android] Added `expoAutolinking.useExpoVersionCatalog` and `expoAutolinking.reactNativeGradlePlugin`. ([#35789](https://github.com/expo/expo/pull/35789) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- [Android] Introduced the Gradle plugin to improve the autolinking setup. ([#33402](https://github.com/expo/expo/pull/33402) by [@lukmccall](https://github.com/lukmccall))
- Drop `fs-extra` in favor of `fs`. ([#35036](https://github.com/expo/expo/pull/35036) by [@kitten](https://github.com/kitten))
- Drop `fast-glob` in favor of `glob`. ([#35082](https://github.com/expo/expo/pull/35082) by [@kitten](https://github.com/kitten))
- [Android] Added `publication` configuration. ([#35068](https://github.com/expo/expo/pull/35068) by [@lukmccall](https://github.com/lukmccall))
- Removed legacy `modulesClassNames` field. ([#35095](https://github.com/expo/expo/pull/35095) by [@lukmccall](https://github.com/lukmccall))
- [Android] Add a special case for autolinking `react-native-edge-to-edge` ([#35812](https://github.com/expo/expo/pull/35812) by [@behenate](https://github.com/behenate))

## 2.0.8 - 2025-02-19

_This version does not introduce any user-facing changes._

## 2.0.7 - 2025-01-20

_This version does not introduce any user-facing changes._

## 2.0.6 - 2025-01-19

### 🐛 Bug fixes

- Added Android `BaseReactPackage` for autolinking. ([#33773](https://github.com/expo/expo/pull/33773) by [@vonovak](https://github.com/vonovak))
- Resolve `reactNativePath` to its realpath to prevent incorrect relative paths from being generated for isolated dependencies. ([#34203](https://github.com/expo/expo/pull/34203) by [@kitten](https://github.com/kitten))

## 2.0.5 - 2025-01-10

_This version does not introduce any user-facing changes._

## 2.0.4 - 2024-12-10

### 🐛 Bug fixes

- Fix incorrect `__dirname` in `react-native-config.(js|ts)` ([#33532](https://github.com/expo/expo/pull/33532) by [@satya164](https://github.com/satya164))

### 💡 Others

- Added library `android.sourceDir` support for react-native-config. ([#33473](https://github.com/expo/expo/pull/33473) by [@kudo](https://github.com/kudo))

## 2.0.3 - 2024-12-02

_This version does not introduce any user-facing changes._

## 2.0.2 — 2024-11-13

### 🐛 Bug fixes

- Fixed autolinking when `react-native-config` doesn't specify local dependencies. ([#32841](https://github.com/expo/expo/pull/32841) by [@thespacemanatee](https://github.com/thespacemanatee))

## 2.0.1 — 2024-11-13

### 💡 Others

- Added local project dependencies support to `react-native-config` autolinking. ([#32821](https://github.com/expo/expo/pull/32821) by [@kudo](https://github.com/kudo))

## 2.0.0 — 2024-11-11

_This version does not introduce any user-facing changes._

## 2.0.0-preview.3 — 2024-11-04

### 🐛 Bug fixes

- Fix issue when no dependencies in a package. ([#32547](https://github.com/expo/expo/pull/32547) by [@douglowder](https://github.com/douglowder))

## 2.0.0-preview.2 — 2024-10-28

### 🐛 Bug fixes

- Fixed react-native core autolinking for react-native-unistyles on Android. ([#32375](https://github.com/expo/expo/pull/32375) by [@kudo](https://github.com/kudo))

## 2.0.0-preview.1 — 2024-10-25

### 🐛 Bug fixes

- Fixed build error from `gradleAarProjects`. ([#32349](https://github.com/expo/expo/pull/32349) by [@kudo](https://github.com/kudo))

## 2.0.0-preview.0 — 2024-10-22

### 🛠 Breaking changes

- Removed the deprecated `generate-package-list` command for Apple platforms. ([#31518](https://github.com/expo/expo/pull/31518) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Added AAR files autolinking as Gradle projects. ([#30706](https://github.com/expo/expo/pull/30706) by [@kudo](https://github.com/kudo))
- Add support for react-native 0.76 ([#31593](https://github.com/expo/expo/pull/31593) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added Apple code sign entitlements to generated `ExpoModulesProvider.swift`. ([#31518](https://github.com/expo/expo/pull/31518) by [@kudo](https://github.com/kudo))
- Added `searchPaths` support to the `react-native-config`. ([#32153](https://github.com/expo/expo/pull/32153) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- [Android] Fixed autolinking of Maven AWS S3 repository. ([#30204](https://github.com/expo/expo/pull/30204) by [@ElielC](https://github.com/ElielC))
- [Android] Fixed autolinking when using Gradle Kotlin script. ([#30448](https://github.com/expo/expo/pull/30448) by [@amrfarid140](https://github.com/amrfarid140))
- Fixed core autolinking for react-native-maps. ([#31190](https://github.com/expo/expo/pull/31190) by [@kudo](https://github.com/kudo))
- Fixed broken `searchPaths` from package.json. ([#31196](https://github.com/expo/expo/pull/31196) by [@kudo](https://github.com/kudo))
- Fixed `react-native-config` error when running on CNG projects without Android native files. ([#31637](https://github.com/expo/expo/pull/31637) by [@kudo](https://github.com/kudo))
- Fixed `react-native-config` can't resolve version of the `@react-native-community/cli-platform-android`. ([#32205](https://github.com/expo/expo/pull/32205) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Removed `expo_patch_react_imports!` and align more stardard react-native project layout. ([#31699](https://github.com/expo/expo/pull/31699) by [@kudo](https://github.com/kudo))
- Exported a new `findProjectRootSync` API. ([#31966](https://github.com/expo/expo/pull/31966) by [@kudo](https://github.com/kudo))

## 1.11.2 - 2024-08-14

### 🎉 New features

- Added `react-native-config` command to support core autolinking for react-native. ([#29818](https://github.com/expo/expo/pull/29818) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Added missing `project.android.packageName` in react-native-config for Android core autolinking. ([#30913](https://github.com/expo/expo/pull/30913) by [@kudo](https://github.com/kudo))

## 1.11.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 1.11.0 — 2024-04-18

### 🎉 New features

- Expand Android auto-linking to support new expo-build-properties ([#26895](https://github.com/expo/expo/pull/26895) by [@bpeltonc](https://github.com/bpeltonc))

### 🐛 Bug fixes

- Support custom debug build configuration for debugOnly pods (expo-dev-client for example) ([#28085](https://github.com/expo/expo/pull/28085) by [@Titozzz](https://github.com/Titozzz))

### 💡 Others

- Read `extraPods` from **Podfile.properties.json** and `extraMavenRepos` from **gradle.properties**. ([#28106](https://github.com/expo/expo/pull/28106) by [@kudo](https://github.com/kudo))

## 1.10.3 - 2024-02-06

### 🐛 Bug fixes

- Fixed generating a list of app delegate subscribers. ([#26851](https://github.com/expo/expo/pull/26851) by [@tsapeta](https://github.com/tsapeta))

## 1.10.2 - 2024-01-18

### 🐛 Bug fixes

- Fixed a list of packages to include in the generated modules provider for tvOS and macOS platforms. ([#26497](https://github.com/expo/expo/pull/26497) by [@tsapeta](https://github.com/tsapeta))

## 1.10.1 - 2024-01-18

### 🎉 New features

- Introduced a universal `"apple"` platform as a replacement for `"ios"`, `"macos"` and `"tvos"`. ([#26398](https://github.com/expo/expo/pull/26398) by [@tsapeta](https://github.com/tsapeta))

## 1.10.0 - 2024-01-10

### 🎉 New features

- Added support for macOS and tvOS targets. ([#26287](https://github.com/expo/expo/pull/26287) by [@tsapeta](https://github.com/tsapeta))

## 1.9.0 — 2023-12-12

### 🐛 Bug fixes

- [iOS] Resolve `expo-modules-autolinking` from `expo` in the generated project integrator. ([#25817](https://github.com/expo/expo/pull/25817) by [@byCedric](https://github.com/byCedric))

## 1.8.0 — 2023-11-14

### 🎉 New features

- Added Expo CLI devtools plugins support. ([#24649](https://github.com/expo/expo/pull/24649) by [@kudo](https://github.com/kudo))

## 1.7.0 — 2023-10-17

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 1.6.0 — 2023-09-15

### 🐛 Bug fixes

- Maintain hierarchical order when linking isolated modules ([#24351](https://github.com/expo/expo/pull/24351) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- [iOS] Disable packager and bundle JS when EX_UPDATES_NATIVE_DEBUG set. ([#24366](https://github.com/expo/expo/pull/24366) by [@douglowder](https://github.com/douglowder))

## 1.5.2 — 2023-09-04

### 🐛 Bug fixes

- Add support for pnpm isolated modules ([#23867](https://github.com/expo/expo/pull/23867) by [@byCedric](https://github.com/byCedric))
- Resolve cli for isolated modules before running node scripts. ([#23926](https://github.com/expo/expo/pull/23926) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- [Android] Made `generateExpoModulesPackageList` task cacheable. ([#23847](https://github.com/expo/expo/pull/23847) by [@lukmccall](https://github.com/lukmccall))

## 1.5.1 - 2023-08-22

### 🐛 Bug fixes

- Fixed `expo_patch_react_imports!` missing some lines with spaces before or after the imports. ([#23923](https://github.com/expo/expo/pull/23923) by [@liamjones](https://github.com/liamjones))

## 1.5.0 — 2023-06-21

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))
- Added extra CocoaPods dependencies and Maven repositories from `expo-build-properties`. ([#22785](https://github.com/expo/expo/pull/22785) by [@kudo](https://github.com/kudo))

## 1.4.0 — 2023-06-13

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

## 1.3.0 — 2023-05-08

### 🎉 New features

- Generating `ExpoModulesProvider.swift` in the build phase script instead of only `pod install`. ([#21108](https://github.com/expo/expo/pull/21108) by [@tsapeta](https://github.com/tsapeta))

## 1.2.0 - 2023-04-13

### 🎉 New features

- Added Gradle plugin autolinking support for Android. ([#21377](https://github.com/expo/expo/pull/21377) by [@kudo](https://github.com/kudo))

## 1.1.2 — 2023-02-14

### 💡 Others

- Suppress node warnings about deprecated exports mapping in 3rd-party dependencies. ([#21222](https://github.com/expo/expo/pull/21222) by [@tsapeta](https://github.com/tsapeta))

## 1.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 1.1.0 — 2023-02-03

_This version does not introduce any user-facing changes._

## 1.0.2 — 2023-01-10

### 🐛 Bug fixes

- Replace deprecated `File.exists?` with `File.exist?` to fix usage with `ruby@3.2`. ([#20470](https://github.com/expo/expo/pull/20757) by [@KiwiKilian](https://github.com/kiwikilian))

## 1.0.1 — 2022-12-30

### 🐛 Bug fixes

- Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))

## 1.0.0 — 2022-11-03

_This version does not introduce any user-facing changes._

## 0.12.0 — 2022-10-25

### 🎉 New features

- Automatically use modular headers for pod dependencies when the package has Swift modules to link. ([#19443](https://github.com/expo/expo/pull/19443) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Bump `@tsconfig/node` to match other Expo Modules packages development setup. ([#19671](https://github.com/expo/expo/pull/19671) by [@Simek](https://github.com/Simek))

## 0.11.0 — 2022-10-06

### 🎉 New features

- Added `includeTests` option to `use_expo_modules!` to include test specs from autolinked modules. ([#18496](https://github.com/expo/expo/pull/18496) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed node executable resolution errors on iOS when `pod install` is executed from package.json `scripts`. ([#18580](https://github.com/expo/expo/pull/18580) by [@kudo](https://github.com/kudo))

## 0.10.1 — 2022-07-25

### 🎉 New features

- Added a feature to automatically generate `.xcode.env.local` with correct `$NODE_BINARY` path when running `pod install`. ([#18330](https://github.com/expo/expo/pull/18330) by [@kudo](https://github.com/kudo))

## 0.10.0 — 2022-07-07

### 🐛 Bug fixes

- Added support for React Native 0.69.x ([#17629](https://github.com/expo/expo/pull/17629) by [@kudo](https://github.com/kudo))
- Use regex to match ignored modules in `expo_patch_react_imports!` and fix iOS build errors when the project is inside `react-native` named folder. ([#17968](https://github.com/expo/expo/pull/17968) by [@dmnkgrc](https://github.com/dmnkgrc))

## 0.9.0 — 2022-06-23

### 🎉 New features

- The `searchPaths` and `nativeModulesDir` options now support direct paths to specific module directories. ([#17922](https://github.com/expo/expo/pull/17922) by [@barthap](https://github.com/barthap))

## 0.8.1 — 2022-05-12

### 🐛 Bug fixes

- Fixed an infinite loop when the **package.json** is placed at the root path. ([#17440](https://github.com/expo/expo/pull/17440) by [@tsapeta](https://github.com/tsapeta))

## 0.8.0 — 2022-05-06

### 🎉 New features

- Add `ios.debugOnly` to module config. ([#17331](https://github.com/expo/expo/pull/17331) by [@lukmccall](https://github.com/lukmccall))
- Setting `EXPO_CONFIGURATION_DEBUG` or `EXPO_CONFIGURATION_RELEASE` Swift flags on project targets. ([#17378](https://github.com/expo/expo/pull/17378) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix debug-only modules weren't installed if the `DEBUG` flag wasn't present in `OTHER_SWIFT_FLAGS`. ([#17383](https://github.com/expo/expo/pull/17383) by [@lukmccall](https://github.com/lukmccall))
- Fix iOS build if project config name is other than RELEASE or DEBUG ([#17439](https://github.com/expo/expo/pull/17439) by [@uloco](https://github.com/uloco))

### 💡 Others

## 0.7.0 — 2022-04-18

- Update require logic to find transitive deps that would not be hoisted at the top of the monorepo ([#16419](https://github.com/expo/expo/pull/16419) by [@Titozzz](https://github.com/Titozzz))
- Fix `cannot cast object 'ExpoAutolinkingManager@' with class 'ExpoAutolinkingManager' to class 'ExpoAutolinkingManager'` on Android when a project is using `buildSrc`. ([#16545](https://github.com/expo/expo/pull/16545) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Add `ios.swiftModuleName` to module config. ([#16260](https://github.com/expo/expo/pull/16260) by [@esamelson](https://github.com/esamelson))
- Added support for linking multiple podspecs and Gradle projects in a package. ([#16511](https://github.com/expo/expo/pull/16511) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed `expo_patch_react_imports!` not work when the app project is in a folder with spaces. ([#16794](https://github.com/expo/expo/pull/16794) by [@Kudo](https://github.com/Kudo))

## 0.6.0 — 2022-01-26

### ⚠️ Notices

- Expose `findModulesAsync` from `expo-modules-autolinking/build/autolinking` again. ([#15950](https://github.com/expo/expo/pull/15950) by [@EvanBacon](https://github.com/EvanBacon))
- Deprecated `modulesClassNames` in favor of `modules` in the Expo module config. ([#15852](https://github.com/expo/expo/pull/15852) by [@tsapeta](https://github.com/tsapeta))

## 0.5.5 — 2022-01-05

### 🐛 Bug fixes

- Fix `umbrella directory '../../Public/React-Core/React' not found` build error when in `use_frameworks!` mode. ([#15773](https://github.com/expo/expo/pull/15773) by [@kudo](https://github.com/kudo))

## 0.5.4 — 2021-12-29

### 🐛 Bug fixes

- Add `expo_patch_react_imports!` support for React-Native 0.66. ([#15724](https://github.com/expo/expo/pull/15724) by [@kudo](https://github.com/kudo))

## 0.5.3 — 2021-12-28

### 🐛 Bug fixes

- Fix `expo_patch_react_imports!` error when there are pods with absolute path. ([#15699](https://github.com/expo/expo/pull/15699) by [@kudo](https://github.com/kudo))

## 0.5.2 — 2021-12-22

### 🐛 Bug fixes

- Introduce `expo_patch_react_imports!` to transform double-quoted React imports into angle-brackets in order to fix third-party libraries incompatibility with SDK 44. ([#15655](https://github.com/expo/expo/pull/15655) by [@kudo](https://github.com/kudo))

## 0.5.1 — 2021-12-15

_This version does not introduce any user-facing changes._

## 0.5.0 — 2021-12-03

### 🎉 New features

- Patch React podspecs on the fly to support Swift integration. ([#15299](https://github.com/expo/expo/pull/15299) by [@kudo](https://github.com/kudo))
- Add `nativeModulesDir` option to specify app's custom native modules location. ([#15415](https://github.com/expo/expo/pull/15415) by [@barthap](https://github.com/barthap))

## 0.4.0 — 2021-11-17

### 🎉 New features

- Added "silent" property for silencing resolution warnings. ([#14891](https://github.com/expo/expo/pull/14891) by [@EvanBacon](https://github.com/EvanBacon))
- Listing module's app delegate subscribers in the generated `ExpoModulesProvider.swift`. ([#14867](https://github.com/expo/expo/pull/14867) by [@tsapeta](https://github.com/tsapeta))
- Search for Android package in the entire source code other than just `src` directory. ([#14883](https://github.com/expo/expo/pull/14883) by [@kudo](https://github.com/kudo))
- Introduce React Native bridge delegate handlers on iOS. ([#15138](https://github.com/expo/expo/pull/15138) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix Gradle error when running Gradle from outside of the project directory. ([#15109](https://github.com/expo/expo/pull/15109) by [@kudo](https://github.com/kudo))

## 0.3.3 — 2021-10-21

### 🐛 Bug fixes

- Resolved race condition when generating `ExpoModulesProvider.swift`. ([#14822](https://github.com/expo/expo/pull/14822) by [@awinograd](https://github.com/awinograd))
