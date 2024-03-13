# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.24.12 — 2024-03-13

### 💡 Others

- [iOS] Moved expo-dev-client + expo-updates interop setup out from `application:willFinishLaunchingWithOptions:`. ([#27477](https://github.com/expo/expo/pull/27477) by [@kudo](https://github.com/kudo))

## 0.24.11 — 2024-02-16

_This version does not introduce any user-facing changes._

## 0.24.10 — 2024-02-06

### 🎉 New features

- Add assets:verify command to CLI. ([#26756](https://github.com/expo/expo/pull/26756) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- Fix assets:verify command for images with multiple scales. ([#26940](https://github.com/expo/expo/pull/26940) by [@douglowder](https://github.com/douglowder))

## 0.24.9 — 2024-01-26

### 🐛 Bug fixes

- [Android] correct drawable types in updates embedded manifest. ([#26676](https://github.com/expo/expo/pull/26676) by [@douglowder](https://github.com/douglowder))

## 0.24.8 — 2024-01-18

_This version does not introduce any user-facing changes._

## 0.24.7 — 2024-01-10

### 🎉 New features

- Added `AppController.overrideConfiguration()` to override the `UpdatesConfig` on iOS. ([#26093](https://github.com/expo/expo/pull/26093) by [@kudo](https://github.com/kudo))

### 🛠 Breaking changes

- Deprecated `UpdatesController.initialize(Context, Map)` and replaced with `UpdatesController.overrideConfiguration()` method to prevent ANR when overriding the `UpdatesConfiguration` on Android. [#26093](https://github.com/expo/expo/pull/26093) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix metro asset call in embedded manifest creation step. ([#26307](https://github.com/expo/expo/pull/26307) by [@wschurman](https://github.com/wschurman))
- [expo-updates] dev launcher updates controller should not read embedded manifest. ([#26336](https://github.com/expo/expo/pull/26336) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Replace deprecated `com.facebook.react:react-native:+` Android dependency with `com.facebook.react:react-android`. ([#26237](https://github.com/expo/expo/pull/26237) by [@kudo](https://github.com/kudo))

## 0.24.6 — 2024-01-05

### 🎉 New features

- Add more failure logs in asset download. ([#26277](https://github.com/expo/expo/pull/26277) by [@wschurman](https://github.com/wschurman))

## 0.24.5 — 2023-12-21

_This version does not introduce any user-facing changes._

## 0.24.4 — 2023-12-19

### 🐛 Bug fixes

- Add relaunch to disabled and dev client controllers. ([#25973](https://github.com/expo/expo/pull/25973) by [@wschurman](https://github.com/wschurman))

## 0.24.3 — 2023-12-15

_This version does not introduce any user-facing changes._

## 0.18.18 — 2023-12-15

### 🐛 Bug fixes

- [Android] overwrite duplicates when copying assets. ([#25898](https://github.com/expo/expo/pull/25898) by [@douglowder](https://github.com/douglowder))

## 0.24.2 — 2023-12-13

### 🐛 Bug fixes

- [Android] overwrite duplicates when copying assets. ([#25898](https://github.com/expo/expo/pull/25898) by [@douglowder](https://github.com/douglowder))

## 0.24.1 — 2023-12-12

_This version does not introduce any user-facing changes._

## 0.24.0 — 2023-12-12

### 🛠 Breaking changes

- Add state machine procedure serial runner. ([#25386](https://github.com/expo/expo/pull/25386), [#25431](https://github.com/expo/expo/pull/25431) by [@wschurman](https://github.com/wschurman))

### 🎉 New features

- [Android] Asset exclusion on Android part 2. ([#25504](https://github.com/expo/expo/pull/25504) by [@douglowder](https://github.com/douglowder))
- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- [Android] Fix interaction between reload JS API and ErrorRecovery. ([#25651](https://github.com/expo/expo/pull/25651) by [@wschurman](https://github.com/wschurman))
- [Android] Fix wait notify bug in launch asset when enabled. ([#25676](https://github.com/expo/expo/pull/25676) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Update E2E tests to use local copies of `@expo/metro-config`, `@expo/env`, `@expo/config`. ([#25430](https://github.com/expo/expo/pull/25430) by [@EvanBacon](https://github.com/EvanBacon))
- Add e2e tests for disabled mode. ([#25301](https://github.com/expo/expo/pull/25301) by [@wschurman](https://github.com/wschurman))
- Modify E2E manual test for asset exclusion. ([#25406](https://github.com/expo/expo/pull/25406) by [@douglowder](https://github.com/douglowder))
- Move tvOS compile test out of updates E2E test matrix. ([#25438](https://github.com/expo/expo/pull/25438) by [@douglowder](https://github.com/douglowder))
- Assert valid state transitions in debug. ([#25474](https://github.com/expo/expo/pull/25474) by [@wschurman](https://github.com/wschurman))
- Improve JS API error messages and documentation for Expo Go and Dev Client. ([#25751](https://github.com/expo/expo/pull/25751) by [@wschurman](https://github.com/wschurman))
- Warn when expo-updates starts in disabled mode. ([#25793](https://github.com/expo/expo/pull/25793) by [@wschurman](https://github.com/wschurman))

## 0.23.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Split updates controllers depending on configuration, changing native public API. ([#25085](https://github.com/expo/expo/pull/25085), [#25192](https://github.com/expo/expo/pull/25192) by [@wschurman](https://github.com/wschurman))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🎉 New features

- [iOS] Make asset exclusion work. ([#25216](https://github.com/expo/expo/pull/25216) by [@douglowder](https://github.com/douglowder))
- [Android] Asset exclusion on Android part 1. ([#25277](https://github.com/expo/expo/pull/25277) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- [iOS] Fix the E2E tests. ([#24865](https://github.com/expo/expo/pull/24865) by [@douglowder](https://github.com/douglowder))
- [Android] Simplify UpdatesUtils.parseDateString, fix UpdatesLoggingTest. ([#24951](https://github.com/expo/expo/pull/24951) by [@douglowder](https://github.com/douglowder))
- [iOS] Fix expo-localization tvOS compile, add CI. ([#25082](https://github.com/expo/expo/pull/25082) by [@douglowder](https://github.com/douglowder))
- Fix instrumentation tests. ([#25367](https://github.com/expo/expo/pull/25367) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Android: Stub expo-updates in Expo Go and remove service pattern. ([#24890](https://github.com/expo/expo/pull/24890) by [@wschurman](https://github.com/wschurman))
- iOS: Refactor responsibility of app controller. ([#24934](https://github.com/expo/expo/pull/24934), [#24949](https://github.com/expo/expo/pull/24949) by [@wschurman](https://github.com/wschurman))
- Android: Refactor responsibility of app controller. ([#24954](https://github.com/expo/expo/pull/24954), [#24975](https://github.com/expo/expo/pull/24975), [#25043](https://github.com/expo/expo/pull/25043) by [@wschurman](https://github.com/wschurman))
- Android: Backport ExpoGoUpdatesModule to SDK 49. ([#24974](https://github.com/expo/expo/pull/24974) by [@wschurman](https://github.com/wschurman))
- Remove unused `storedUpdateIdsWithConfiguration` method. ([#25194](https://github.com/expo/expo/pull/25194) by [@wschurman](https://github.com/wschurman))
- Remove ability for embedded manifests to be legacy manifests. ([#25195](https://github.com/expo/expo/pull/25195) by [@wschurman](https://github.com/wschurman))
- Convert e2e setup scripts to typescript. ([#25271](https://github.com/expo/expo/pull/25271) by [@wschurman](https://github.com/wschurman))

### ⚠️ Notices

- Deprecated `useUpdateEvents()` and `addListener()` in favor of the new `useUpdates()` API. ([#25345](https://github.com/expo/expo/pull/25345) by [@douglowder](https://github.com/douglowder))

## 0.18.17 — 2023-10-25

### 🐛 Bug fixes

- [Android] Simplify UpdatesUtils.parseDateString, fix UpdatesLoggingTest. ([#24951](https://github.com/expo/expo/pull/24951) by [@douglowder](https://github.com/douglowder))

## 0.22.0 — 2023-10-17

### 🐛 Bug fixes

- Add missing export in checkForUpdateAsync result. (by [@douglowder](https://github.com/douglowder)) ([#24503](https://github.com/expo/expo/pull/24503) by [@douglowder](https://github.com/douglowder))
- [Android] embedded loader should load images at all scales. ([#24549](https://github.com/expo/expo/pull/24549) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))
- iOS: Stub expo-updates in Expo Go and remove service pattern. ([#24860](https://github.com/expo/expo/pull/24860) by [@wschurman](https://github.com/wschurman))

## 0.18.16 — 2023-10-05

### 🐛 Bug fixes

- Add missing export in checkForUpdateAsync result. (by [@douglowder](https://github.com/douglowder)) ([#24503](https://github.com/expo/expo/pull/24503) by [@douglowder](https://github.com/douglowder))
- [Android] embedded loader should load images at all scales. ([#24549](https://github.com/expo/expo/pull/24549) by [@douglowder](https://github.com/douglowder))

## 0.18.14 — 2023-09-27

_This version does not introduce any user-facing changes._

## 0.21.1 — 2023-09-18

_This version does not introduce any user-facing changes._

## 0.18.13 — 2023-09-15

### 🐛 Bug fixes

- [iOS] remove force unwrap in download handler. ([#24299](https://github.com/expo/expo/pull/24299) by [@douglowder](https://github.com/douglowder))
- Fix updates enabled defaulting on iOS. ([#24327](https://github.com/expo/expo/pull/24327) by [@wschurman](https://github.com/wschurman))
- [Android] Make scopekey only required when getting database entity. ([#24466](https://github.com/expo/expo/pull/24466) by [@wschurman](https://github.com/wschurman))

## 0.21.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- Fix updates enabled defaulting on iOS. ([#24327](https://github.com/expo/expo/pull/24327) by [@wschurman](https://github.com/wschurman))
- [Android] Make scopekey only required when getting database entity. ([#24466](https://github.com/expo/expo/pull/24466) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Update E2E test. ([#24272](https://github.com/expo/expo/pull/24272) by [@EvanBacon](https://github.com/EvanBacon))
- [iOS] Disable packager and bundle JS when `EX_UPDATES_NATIVE_DEBUG` set. ([#24366](https://github.com/expo/expo/pull/24366) by [@douglowder](https://github.com/douglowder))
- Add Apple TV to Updates E2E (build only). ([#24411](https://github.com/expo/expo/pull/24411) by [@douglowder](https://github.com/douglowder))
- Add `sqlite3` to the podspec to use newer version that the built in. ([#24375](https://github.com/expo/expo/pull/24375) by [@alanjhughes](https://github.com/alanjhughes))

## 0.20.0 — 2023-09-04

### 🛠 Breaking changes

- Change source of truth for constants types. ([#24049](https://github.com/expo/expo/pull/24049) by [@wschurman](https://github.com/wschurman))
- Remove classic manifest types and classic updates. ([#24053](https://github.com/expo/expo/pull/24053), [#24066](https://github.com/expo/expo/pull/24066) by [@wschurman](https://github.com/wschurman))
- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))
- Add rollback support to useUpdates(). ([#24071](https://github.com/expo/expo/pull/24071) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- [Android] completely fix `node` execution on Windows ([#24116](https://github.com/expo/expo/pull/24116) by [@weykon](https://github.com/weykon))
- [Android] Fixed the `node` execution on Windows. ([#23983](https://github.com/expo/expo/pull/23983) by [@kudo](https://github.com/kudo))
- Bare update manifest non-nullability parity. ([#23166](https://github.com/expo/expo/pull/23166) by [@wschurman](https://github.com/wschurman))
- Support importing assets from out of the project root when working in monorepos. ([#24090](https://github.com/expo/expo/pull/24090) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent failed updates from passing checkForUpdateAsync(). ([#24112](https://github.com/expo/expo/pull/24112) by [@douglowder](https://github.com/douglowder))

## 0.19.1 — 2023-08-02

### 💡 Others

- Update API documentation to clarify `channel` behavior in Expo Go/ development builds. ([#23783](https://github.com/expo/expo/pull/23783) by [@keith-kurak](https://github.com/keith-kurak))

## 0.19.0 — 2023-07-28

### 🎉 New features

- New useUpdates() JS API. ([#23532](https://github.com/expo/expo/pull/23532) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- [Android] Fix rollback embedded update logic. ([#23244](https://github.com/expo/expo/pull/23244) by [@wschurman](https://github.com/wschurman))
- Correctly handle roll backs in JS module methods. ([#23356](https://github.com/expo/expo/pull/23356), [#23377](https://github.com/expo/expo/pull/23377) by [@wschurman](https://github.com/wschurman))
- [iOS] Fix unmatched selection policy. ([#23535](https://github.com/expo/expo/pull/23535) by [@chochihim](https://github.com/chochihim))
- Handle initialization errors in useUpdates(). ([#23640](https://github.com/expo/expo/pull/23640) by [@douglowder](https://github.com/douglowder))
- [iOS] Fix error handling on iOS during startup check for updates. ([#23663](https://github.com/expo/expo/pull/23663) by [@douglowder](https://github.com/douglowder))
- Last check dateTime should come from native. ([#23692](https://github.com/expo/expo/pull/23692) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Native getter for state machine context. ([#23428](https://github.com/expo/expo/pull/23428) by [@douglowder](https://github.com/douglowder))
- [iOS] Fix template for EX_UPDATES_NATIVE_DEBUG. ([#23602](https://github.com/expo/expo/pull/23602) by [@douglowder](https://github.com/douglowder))

## 0.18.11 - 2023-07-23

### 💡 Others

- [Android] EX_UPDATES_ANDROID_DELAY_LOAD_APP settable by env. ([#23479](https://github.com/expo/expo/pull/23479) by [@douglowder](https://github.com/douglowder))

## 0.18.10 - 2023-07-12

### 🐛 Bug fixes

- [CLI] Add missing chalk dependency for the `expo-updates` cli. ([#23429](https://github.com/expo/expo/pull/23429) by [@byCedric](https://github.com/byCedric))
- [CLI] Drop `fs-extra` in favor of `fs`. ([#23431](https://github.com/expo/expo/pull/23431) by [@byCedric](https://github.com/byCedric))

## 0.18.9 - 2023-07-10

### 🐛 Bug fixes

- [ios] Allow nil scopeKey for bare/embedded updates. ([#23385](https://github.com/expo/expo/pull/23385) by [@wschurman](https://github.com/wschurman))

## 0.18.8 - 2023-07-04

_This version does not introduce any user-facing changes._

## 0.18.7 - 2023-06-30

### 🐛 Bug fixes

- Fix expo-extra-params header. ([#23206](https://github.com/expo/expo/pull/23206) by [@wschurman](https://github.com/wschurman))
- [iOS] Fix response header casing bug. ([#23234](https://github.com/expo/expo/pull/23234) by [@wschurman](https://github.com/wschurman))
- Fix tsconfig paths and other SDK 49 Metro features. ([#23276](https://github.com/expo/expo/pull/23276) by [@EvanBacon](https://github.com/EvanBacon))

## 0.18.6 - 2023-06-29

### 🐛 Bug fixes

- Support discriminated unions for JS API method result types. ([#23173](https://github.com/expo/expo/pull/23173) by [@wschurman](https://github.com/wschurman))

## 0.18.5 — 2023-06-28

### 💡 Others

- README.md changes. ([#23142](https://github.com/expo/expo/pull/23142) by [@douglowder](https://github.com/douglowder))

## 0.18.4 — 2023-06-27

### 🐛 Bug fixes

- [iOS] Use weak delegate for state machine. ([#23060](https://github.com/expo/expo/pull/23060) by [@wschurman](https://github.com/wschurman))
- [Android] Convert LoaderTask.RemoteCheckResult to sealed class. ([#23061](https://github.com/expo/expo/pull/23061) by [@wschurman](https://github.com/wschurman))
- [iOS] Use swift enum for AppLoaderTask delegate. ([#23064](https://github.com/expo/expo/pull/23064) by [@wschurman](https://github.com/wschurman))

## 0.18.3 — 2023-06-24

### 🐛 Bug fixes

- [Android] fix instrumentation tests. ([#23037](https://github.com/expo/expo/pull/23037) by [@douglowder](https://github.com/douglowder))
- [iOS] Fix crash when dev-client and updates used together. ([#23070](https://github.com/expo/expo/pull/23070) by [@douglowder](https://github.com/douglowder))
- [Android] Use sealed class for UpdatesStateEvent. ([#23038](https://github.com/expo/expo/pull/23038) by [@wschurman](https://github.com/wschurman))

## 0.18.2 — 2023-06-23

### 🐛 Bug fixes

- [Android] fix instrumentation tests. ([#23037](https://github.com/expo/expo/pull/23037) by [@douglowder](https://github.com/douglowder))

## 0.18.1 — 2023-06-22

_This version does not introduce any user-facing changes._

## 0.18.0 — 2023-06-22

_This version does not introduce any user-facing changes._

## 0.17.1 — 2023-06-21

### 📚 3rd party library updates

- Updated `junit` to `4.13.2`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- [Android] Load updates in background thread and prevent ANR from initial launch. ([#20273](https://github.com/expo/expo/pull/20273) by [@kudo](https://github.com/kudo))
- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))
- Added the Brotli compression support for EAS Update on Android. ([#22982](https://github.com/expo/expo/pull/22982) by [@kudo](https://github.com/kudo))
- [Android][ios] State machine implementation. ([#22845](https://github.com/expo/expo/pull/22845) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- [Android] Resolve up the project root when creating production manifest. ([#22044](https://github.com/expo/expo/pull/22044) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))
- Fixed broken `create-manifest-android.gradle` on Android Gradle version 8. ([#22538](https://github.com/expo/expo/pull/22538) by [@kudo](https://github.com/kudo))

## 0.17.0 — 2023-05-08

### 🛠 Breaking changes

- Updated **setup documentation** to reflect that setup should include changing the entry from `index` to `.expo/.virtual-metro-entry` which is only available in SDK 49 `@expo/metro-config`. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))
- [android] Add support for version 1 of the protocol. ([#20275](https://github.com/expo/expo/pull/20275) by [@wschurman](https://github.com/wschurman))
- Add support for version 1 of the protocol. ([#20275](https://github.com/expo/expo/pull/20275), [#21652](https://github.com/expo/expo/pull/21652) by [@wschurman](https://github.com/wschurman))

### 🎉 New features

- Add rollback to embedded update directive. ([#21007](https://github.com/expo/expo/pull/21007), [#21652](https://github.com/expo/expo/pull/21652) by [@wschurman](https://github.com/wschurman))
- Add support for extra params. ([#21837](https://github.com/expo/expo/pull/21837) by [@wschurman](https://github.com/wschurman))
- New checkAutomatically constant. ([#22137](https://github.com/expo/expo/pull/22137) by [@douglowder](https://github.com/douglowder))
- Support 204 status for no-op responses. ([#22348](https://github.com/expo/expo/pull/22348) by [@wschurman](https://github.com/wschurman))
- Support new SDK version field in new manifests. ([#22356](https://github.com/expo/expo/pull/22356) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- iOS: Fix odd nullability issue in expo module. ([#21655](https://github.com/expo/expo/pull/21655) by [@wschurman](https://github.com/wschurman))
- iOS: Fix legacy update bundled asset parsing. ([#21691](https://github.com/expo/expo/pull/21691) by [@wschurman](https://github.com/wschurman))
- iOS: Fix config plist overriding. ([#21702](https://github.com/expo/expo/pull/21702) by [@wschurman](https://github.com/wschurman))
- Align properties for different UpdateEvent types. ([#21818](https://github.com/expo/expo/pull/21818) by [@douglowder](https://github.com/douglowder))
- Improvement in stability of useUpdateEvents() hook. ([#21880](https://github.com/expo/expo/pull/21880) by [@douglowder](https://github.com/douglowder))
- Copy native events before transforming them. ([#22162](https://github.com/expo/expo/pull/22162) by [@douglowder](https://github.com/douglowder))
- Fix empty body no-op multipart response. ([#22227](https://github.com/expo/expo/pull/22227) by [@wschurman](https://github.com/wschurman))
- Put extra data mutation in transaction. ([#22252](https://github.com/expo/expo/pull/22252) by [@wschurman](https://github.com/wschurman))
- [iOS] fix bizarre bug when downloading update twice. ([#22355](https://github.com/expo/expo/pull/22355) by [@douglowder](https://github.com/douglowder))
- Fix rollback to embedded logic. ([#22433](https://github.com/expo/expo/pull/22433), [#22434](https://github.com/expo/expo/pull/22434) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Improved README and other chagnes for E2E tests. ([#21331](https://github.com/expo/expo/pull/21331) by [@douglowder](https://github.com/douglowder))
- Protocol 1 support and rollback test in E2E tests. ([#21197](https://github.com/expo/expo/pull/21197) by [@wschurman](https://github.com/wschurman), [@douglowder](https://github.com/douglowder))
- Convert EXManifests iOS implementation to Swift. ([#21298](https://github.com/expo/expo/pull/21298) by [@wschurman](https://github.com/wschurman))
- Convert to Swift. ([#21320](https://github.com/expo/expo/pull/21320), [#21329](https://github.com/expo/expo/pull/21329), [#21332](https://github.com/expo/expo/pull/21332), [#21391](https://github.com/expo/expo/pull/21391), [#21394](https://github.com/expo/expo/pull/21394), [#21450](https://github.com/expo/expo/pull/21450), [#21451](https://github.com/expo/expo/pull/21451), [#21467](https://github.com/expo/expo/pull/21467), [#21471](https://github.com/expo/expo/pull/21471), [#21478](https://github.com/expo/expo/pull/21478), [#21493](https://github.com/expo/expo/pull/21493), [#21495](https://github.com/expo/expo/pull/21495), [#21512](https://github.com/expo/expo/pull/21512), [#21535](https://github.com/expo/expo/pull/21535), [#21536](https://github.com/expo/expo/pull/21536), [#21570](https://github.com/expo/expo/pull/21570), [#21591](https://github.com/expo/expo/pull/21591), [#21596](https://github.com/expo/expo/pull/21596), [#21599](https://github.com/expo/expo/pull/21599), [#21649](https://github.com/expo/expo/pull/21649) by [@wschurman](https://github.com/wschurman))
- Convert iOS EXUpdatesCrypto to swift. ([#21524](https://github.com/expo/expo/pull/21524) by [@wschurman](https://github.com/wschurman))
- iOS: Decrease access control on classes and remove unnecessary objc attributes. ([#21597](https://github.com/expo/expo/pull/21597) by [@wschurman](https://github.com/wschurman))
- iOS: Replace reachability code with library for wifi detection. ([#21598](https://github.com/expo/expo/pull/21598) by [@wschurman](https://github.com/wschurman))
- iOS: Clean up and rename code signing classes. ([#21600](https://github.com/expo/expo/pull/21600) by [@wschurman](https://github.com/wschurman))
- iOS: Rename classes to be more swifty. ([#21620](https://github.com/expo/expo/pull/21620), [#21622](https://github.com/expo/expo/pull/21622) by [@wschurman](https://github.com/wschurman))
- Fix E2E rollback test and other improvements. ([#21389](https://github.com/expo/expo/pull/21389) by [@douglowder](https://github.com/douglowder))
- Consolidate E2E tests. ([#21458](https://github.com/expo/expo/pull/21458) by [@douglowder](https://github.com/douglowder))
- E2E tests: graceful Detox failures. ([#21520](https://github.com/expo/expo/pull/21520) by [@douglowder](https://github.com/douglowder))
- Fix E2E after Swift conversion. ([#21592](https://github.com/expo/expo/pull/21592) by [@douglowder](https://github.com/douglowder))
- Fix iOS native debug after Swift conversion. ([#21602](https://github.com/expo/expo/pull/21602) by [@douglowder](https://github.com/douglowder))
- Fix compilation errors and enable modules after Swift conversion. ([#21621](https://github.com/expo/expo/pull/21621) by [@wschurman](https://github.com/wschurman), [@douglowder](https://github.com/douglowder))
- E2E tests for JS API. ([#22167](https://github.com/expo/expo/pull/22167) by [@douglowder](https://github.com/douglowder))
- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 0.16.4 - 2023-04-03

### 🐛 Bug fixes

- Change arg in gradle `.execute()` call to null to inherit env variables from user's env ([#21712](https://github.com/expo/expo/pull/21712) by [@phoenixiguess](https://github.com/phoenixiguess))
- [Android] Fix missing manifest for build flavor variants. ([#21813](https://github.com/expo/expo/pull/21813) by [@douglowder](https://github.com/douglowder))

## 0.16.3 - 2023-02-22

### 🎉 New features

- New `useUpdateEvents` hook. ([#21258](https://github.com/expo/expo/pull/21258) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- Make Updates API work with native debug. ([#21253](https://github.com/expo/expo/pull/21253) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Break up E2E tests for reliability. ([#21223](https://github.com/expo/expo/pull/21223) by [@douglowder](https://github.com/douglowder))
- Convert E2E tests to TypeScript. ([#21278](https://github.com/expo/expo/pull/21278) by [@douglowder](https://github.com/douglowder))

## 0.16.2 - 2023-02-21

_This version does not introduce any user-facing changes._

## 0.16.1 — 2023-02-09

### 💡 Others

- Convert E2E tests to Hermes. ([#21065](https://github.com/expo/expo/pull/21065) by [@douglowder](https://github.com/douglowder))

## 0.16.0 — 2023-02-03

### 🐛 Bug fixes

- [Android] Fix runtime version parsing. ([#19821](https://github.com/expo/expo/pull/19821) by [@douglowder](https://github.com/douglowder))
- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 💡 Others

- Bump `@expo/metro-config`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
- Improvements to setup for Updates E2E tests. ([#20120](https://github.com/expo/expo/pull/20120) by [@douglowder](https://github.com/douglowder))
- Convert updates E2E workflow to use EAS. ([#20399](https://github.com/expo/expo/pull/20399) by [@douglowder](https://github.com/douglowder))
- Avoid dependency on `uuid`. ([#20475](https://github.com/expo/expo/pull/20475) by [@LinusU](https://github.com/LinusU))
- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 0.15.5 - 2022-11-14

### 🎉 New features

- New API Updates.isEmbeddedLaunch. ([#20014](https://github.com/expo/expo/pull/20014) by [@douglowder](https://github.com/douglowder))

## 0.15.4 — 2022-11-03

### 🐛 Bug fixes

- Fixed another _app.manifest_ occasionally missing from build outputs on Android. ([#19809](https://github.com/expo/expo/pull/19809) by [@kudo](https://github.com/kudo))

## 0.15.3 — 2022-10-30

_This version does not introduce any user-facing changes._

## 0.15.2 — 2022-10-28

_This version does not introduce any user-facing changes._

## 0.15.1 — 2022-10-28

### 🐛 Bug fixes

- Fixed the _app.manifest_ occasionally missing from build outputs on Android. ([#19731](https://github.com/expo/expo/pull/19731) by [@kudo](https://github.com/kudo), [@kudo](https://github.com/kudo))

## 0.15.0 — 2022-10-25

### 🛠 Breaking changes

- Drop support for `logUrl` which sent console logs to the legacy `expo-cli`. ([#18596](https://github.com/expo/expo/pull/18596) by [@EvanBacon](https://github.com/EvanBacon))
- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] New logger and log reader for unifying logging support in expo-updates. ([#18284](https://github.com/expo/expo/pull/18284) by [@douglowder](https://github.com/douglowder))
- [Android] New logger and log reader for unifying logging support in expo-updates. ([#18318](https://github.com/expo/expo/pull/18318) by [@douglowder](https://github.com/douglowder))
- Add JS methods to read and clear client logs. ([#18390](https://github.com/expo/expo/pull/18390) by [@douglowder](https://github.com/douglowder))
- Add Logger support for writing logs to a file; add Logger and associated classes to Android. ([#18513](https://github.com/expo/expo/pull/18513) by [@douglowder](https://github.com/douglowder))
- Make extra header processing code consistent between manifests and assets. ([#18564](https://github.com/expo/expo/pull/18564) by [@wschurman](https://github.com/wschurman))
- Type `UpdateCheckResult` and `UpdateFetchResult` to reflect when `manifest` is defined or not. ([#18577](https://github.com/expo/expo/pull/18577) by [@SimenB](https://github.com/SimenB))

### 🐛 Bug fixes

- Fix small race condition in recovery code on Android where in very rare scenarios, a bundle could be downloaded twice. ([#18377](https://github.com/expo/expo/pull/18377) by [@esamelson](https://github.com/esamelson))
- Fixed _with-node.sh_ doesn't keep quotes when passing arguments to Node.js and caused build errors when there are spaces in target name. ([#18741](https://github.com/expo/expo/pull/18741) by [@kudo](https://github.com/kudo))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Update doc block link for manifests. ([#18981](https://github.com/expo/expo/pull/18981) by [@EvanBacon](https://github.com/EvanBacon))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))
- Log various errors with the new Updates logger; add E2E tests for the logger. ([#18810](https://github.com/expo/expo/pull/18810) by [@douglowder](https://github.com/douglowder))
- [iOS] Flag to enable native debugging of updates. ([#19292](https://github.com/expo/expo/pull/19292) by [@douglowder](https://github.com/douglowder))
- [Android] Flag to enable native debugging of updates. ([#19441](https://github.com/expo/expo/pull/19441) by [@douglowder](https://github.com/douglowder))

### ⚠️ Notices

- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))

## 0.14.3 — 2022-07-25

### 🐛 Bug fixes

- Deprecated the unreliable `source-login-scripts.sh` and sourcing the Node.js binary path from `.xcode.env` and `.xcode.env.local`. ([#18330](https://github.com/expo/expo/pull/18330) by [@kudo](https://github.com/kudo))

## 0.14.2 — 2022-07-16

_This version does not introduce any user-facing changes._

## 0.14.1 — 2022-07-11

_This version does not introduce any user-facing changes._

## 0.14.0 — 2022-07-07

### 🐛 Bug fixes

- Improved support of nvm sourcing in iOS shell scripts. ([#17109](https://github.com/expo/expo/pull/17109) by [@liamronancb](https://github.com/liamronancb))
- Android: Allow null asset hash in new manifests. ([#17466](https://github.com/expo/expo/pull/17466) by [@wschurman](https://github.com/wschurman))
- Fixed `source-login-scripts.sh` ~/zlogin typo. ([#17622](https://github.com/expo/expo/pull/17622) by [@vrgimael](https://github.com/vrgimael))
- Android: Fix asset hash storage. ([#17732](https://github.com/expo/expo/pull/17732) by [@wschurman](https://github.com/wschurman))
- Validate asset hash against expected hash before writing file to disk. ([#17745](https://github.com/expo/expo/pull/17745) by [@wschurman](https://github.com/wschurman))
- Fixed missing `app.manifest` on react-native 0.69 or Android Gradle Plugin 7.1+. ([#18034](https://github.com/expo/expo/pull/18034) by [@kudo](https://github.com/kudo))
- Suppress EXUpdatesService load in Expo Go to prevent crash. ([#18056](https://github.com/expo/expo/pull/18056) by [@douglowder](https://github.com/douglowder))
- Fix proguard support in Android builds. ([#18035](https://github.com/expo/expo/pull/18035) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- (cli) Fix help command parsing. ([#17293](https://github.com/expo/expo/pull/17293) by [@wschurman](https://github.com/wschurman))
- [iOS] Get downloaded update IDs. ([#17817](https://github.com/expo/expo/pull/17817) by [@douglowder](https://github.com/douglowder))
- [Android] Get downloaded update IDs. ([#17933](https://github.com/expo/expo/pull/17933) by [@douglowder](https://github.com/douglowder))

## 0.13.0 — 2022-04-21

### 🐛 Bug fixes

- Fix asset hash validation. ([#17152](https://github.com/expo/expo/pull/17152) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Add current and embedded update headers to manifest requests. ([#17033](https://github.com/expo/expo/pull/17033) by [@esamelson](https://github.com/esamelson))
- Fix return value in AppDelegateSubscriber (used with expo-dev-client). ([#17111](https://github.com/expo/expo/pull/17111) by [@esamelson](https://github.com/esamelson))

## 0.12.0 — 2022-04-18

### 🛠 Breaking changes

- Remove okhttp and okio backward compatible workaround and drop react-native 0.64 support. ([#16446](https://github.com/expo/expo/pull/16446) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Add iOS support for code signing. ([#15682](https://github.com/expo/expo/pull/15682) by [@wschurman](https://github.com/wschurman))
- Add CLI. ([#16216](https://github.com/expo/expo/pull/16216) by [@wschurman](https://github.com/wschurman))
- Add support for dev client auto-setup with updates integration on iOS. ([#16230](https://github.com/expo/expo/pull/16230) by [@esamelson](https://github.com/esamelson))
- Fix codesigning header name. ([#16480](https://github.com/expo/expo/pull/16480) by [@wschurman](https://github.com/wschurman))
- Support certificate chains (Android). ([#16375](https://github.com/expo/expo/pull/16375) by [@wschurman](https://github.com/wschurman))
- Support certificate chains (iOS). ([#16634](https://github.com/expo/expo/pull/16634) by [@wschurman](https://github.com/wschurman))
- Add support for expo project information certificate extension (Android). ([#16607](https://github.com/expo/expo/pull/16607) by [@wschurman](https://github.com/wschurman))
- Add support for expo project information certificate extension (iOS). ([#16726](https://github.com/expo/expo/pull/16726) by [@wschurman](https://github.com/wschurman))
- Pass EAS-Client-ID in header for asset and manifest requests. ([#16729](https://github.com/expo/expo/pull/16729) by [@wschurman](https://github.com/wschurman))
- Validate expo project information up the certificate chain. ([#16800](https://github.com/expo/expo/pull/16800) by [@wschurman](https://github.com/wschurman))
- Update CLI to separate private keys from code signing certificate. ([#16979](https://github.com/expo/expo/pull/16979) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Update `fbemitter` to v3. ([#16245](https://github.com/expo/expo/pull/16245) by [@SimenB](https://github.com/SimenB))
- Allow non-codesigned manifests for Expo Go (Android). ([#16649](https://github.com/expo/expo/pull/16649) by [@wschurman](https://github.com/wschurman))
- Allow non-codesigned manifests for Expo Go (iOS). ([#16682](https://github.com/expo/expo/pull/16682) by [@wschurman](https://github.com/wschurman))
- Fix issue where default values for primitive-typed configuration values were not correctly set. ([#16644](https://github.com/expo/expo/pull/16644) by [@esamelson](https://github.com/esamelson))
- Fixed iOS script phase build error when `extendedglob` is enabled in zsh config. ([#17024](https://github.com/expo/expo/pull/17024) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14`, `@expo/config` from `^6.0.6` to `^6.0.14` and `@expo/metro-config` from `~0.2.6` to `~0.3.7` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))
- Swap out Cloudfront CDN for `classic-assets.eascdn.net`. ([#15781](https://github.com/expo/expo/pull/15781)) by [@quinlanj](https://github.com/quinlanj)
- Add ability for expo-dev-launcher to launch a specific update through UpdatesDevLauncherController. ([#16865](https://github.com/expo/expo/pull/16865) by [@esamelson](https://github.com/esamelson))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

### 📚 3rd party library updates

- Upgrade Android `Room` library version to 2.4.2. ([#16970](https://github.com/expo/expo/pull/16970) by [@kudo](https://github.com/kudo))

## 0.11.7 — 2022-03-07

### 🐛 Bug fixes

- Fix iOS issue where splash screen wouldn't show when using expo-updates and expo-splash-screen ([#16163](https://github.com/expo/expo/pull/16163)) by [@hannojg](https://github.com/hannojg)

### 💡 Others

- Added `Updates.createdAt` constant export. ([#16344](https://github.com/expo/expo/pull/16344)) by [@hannojg](https://github.com/hannojg)

## 0.11.6 - 2022-02-01

### 🐛 Bug fixes

- Fix iOS launch crash when app.json `expo.updates.enabled` is false. ([#15997](https://github.com/expo/expo/pull/15997) by [@kudo](https://github.com/kudo))
- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.11.5 — 2022-01-20

### 🐛 Bug fixes

- Fix build errors on React Native 0.66 caused by `okio` and `okhttp`. ([#15632](https://github.com/expo/expo/pull/15632) by [@kudo](https://github.com/kudo))
- Fix the `PhaseScriptExecution` build errors when the `source_login_scripts.sh` failed to load. ([#15890](https://github.com/expo/expo/pull/15890) by [@kudo](https://github.com/kudo))

## 0.11.4 — 2022-01-13

### 🐛 Bug fixes

- Fix `IllegalThreadStateException` that occurred when creating an event to send to React Native early in the app lifecycle. ([#15880](https://github.com/expo/expo/pull/15880) by [@esamelson](https://github.com/esamelson))
- Ensure we return early when updates are disabled on Android. ([#15882](https://github.com/expo/expo/pull/15882) by [@esamelson](https://github.com/esamelson))

## 0.11.3 — 2021-12-22

### 🐛 Bug fixes

- Fix the view does not update from screen rotation on iOS devices. ([#15608](https://github.com/expo/expo/pull/15608) by [@kudo](https://github.com/kudo))
- Fix building error on AArch64 JDK. ([#15669](https://github.com/expo/expo/pull/15669) by [@kudo](https://github.com/kudo))

## 0.11.2 — 2021-12-15

### 🐛 Bug fixes

- Add missing @JvmStatic annotation to `UpdatesDevLauncherController.initialize`. ([#15561](https://github.com/expo/expo/pull/15561) by [@esamelson](https://github.com/esamelson))

## 0.11.2-rc.0 — 2021-12-13

### 🎉 New features

- Added `Updates.channel` and `Updates.runtimeVersion` constant export. ([#15469](https://github.com/expo/expo/pull/15469) by [@jkhales](https://github.com/jkhales))

## 0.11.1 — 2021-12-08

### 🎉 New features

- Add error recovery manager on Android. ([#15220](https://github.com/expo/expo/pull/15220) by [@esamelson](https://github.com/esamelson))
- Hook up error recovery manager to rest of module on Android. ([#15222](https://github.com/expo/expo/pull/15222) by [@esamelson](https://github.com/esamelson))

## 0.11.0 — 2021-12-03

### 🛠 Breaking changes

- Add local SQLite fields for error recovery manager on iOS. ([#14610](https://github.com/expo/expo/pull/14610) by [@esamelson](https://github.com/esamelson))
- Add DB migration for above. ([#14718](https://github.com/expo/expo/pull/14718) by [@esamelson](https://github.com/esamelson))
- Add local SQLite fields and DB migration for error recovery manager on Android. ([#15218](https://github.com/expo/expo/pull/15218) by [@esamelson](https://github.com/esamelson))
- Add DEFAULT 0 to new error recovery DB columns. ([#15360](https://github.com/expo/expo/pull/15360) by [@esamelson](https://github.com/esamelson))

### 🎉 New features

- Add error recovery manager on iOS. ([#14397](https://github.com/expo/expo/pull/14397) by [@esamelson](https://github.com/esamelson))
- Hook up error recovery manager to rest of module on iOS. ([#14398](https://github.com/expo/expo/pull/14398) by [@esamelson](https://github.com/esamelson))
- Move persisted error log to EXUpdatesErrorRecovery on iOS. ([#14399](https://github.com/expo/expo/pull/14399) by [@esamelson](https://github.com/esamelson))
- Add native EXUpdatesCheckOnLaunch: ERROR_RECOVERY_ONLY setting on iOS. ([#14673](https://github.com/expo/expo/pull/14673) by [@esamelson](https://github.com/esamelson))
- Small fixes for error recovery manager on iOS. ([#15223](https://github.com/expo/expo/pull/15223) by [@esamelson](https://github.com/esamelson))
- Add native checkOnLaunch: ERROR_RECOVERY_ONLY setting on Android. ([#15219](https://github.com/expo/expo/pull/15219) by [@esamelson](https://github.com/esamelson))
- Enhance node binary resolution for Xcode build phases scripts by the vendoring source-login-scripts.sh. ([#15336](https://github.com/expo/expo/pull/15336) by [@kudo](https://github.com/kudo))
- Add android support for multipart manifest responses. ([#15401](https://github.com/expo/expo/pull/15401) by [@wschurman](https://github.com/wschurman))
- Add iOS support for multipart manifest responses. ([#15426](https://github.com/expo/expo/pull/15426) by [@wschurman](https://github.com/wschurman))
- Add android support for code signing. ([#15514](https://github.com/expo/expo/pull/15514) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Fix auto setup `EXUpdatesAppDelegate` breaking reanimated installation. ([#14755](https://github.com/expo/expo/pull/14755) by [@kudo](https://github.com/kudo))
- Fix support for `react.entryFile` gradle config. ([#14934](https://github.com/expo/expo/pull/14934) by [@EvanBacon](https://github.com/EvanBacon))
- Fix Android app.manifest not generated when in OneSignal gradle plugin integration. ([#14938](https://github.com/expo/expo/pull/14938) by [@kudo](https://github.com/kudo))
- Fix Android app.manifest not generated from [#14938](https://github.com/expo/expo/pull/14938) regression. ([#14953](https://github.com/expo/expo/pull/14953) by [@kudo](https://github.com/kudo))
- Fix iOS app.manifest generation error in `eas build --local` mode. ([#14956](https://github.com/expo/expo/pull/14956) by [@kudo](https://github.com/kudo))
- Fix handling of unexpectedly missing assets on iOS. ([#15008](https://github.com/expo/expo/pull/15008) by [@esamelson](https://github.com/esamelson))
- Fix issue with assets that are duplicated in the local SQLite db being reaped when they are still in use. ([#15049](https://github.com/expo/expo/pull/15049) by [@esamelson](https://github.com/esamelson))
- Retain embedded asset fields when merging existing asset entities on Android. ([#15123](https://github.com/expo/expo/pull/15123) by [@esamelson](https://github.com/esamelson))
- Fix `RCTBridge` initialized twice on startup. ([#15142](https://github.com/expo/expo/pull/15142) by [@kudo](https://github.com/kudo))

### 💡 Others

- Add error when entryfile is not found in expo-updates scripts. ([#15234](https://github.com/expo/expo/pull/15234) by [@AamuLumi](https://github.com/AamuLumi))
- Update `@expo/config` and `@expo/metro-config` dependencies. ([#14801](https://github.com/expo/expo/pull/14801) by [@Simek](https://github.com/Simek))
- Refactor and unify Loader classes on Android. ([#14334](https://github.com/expo/expo/pull/14334) by [@esamelson](https://github.com/esamelson))
- Kotlinize expo-updates. ([#14818](https://github.com/expo/expo/pull/14334) by [@wschurman](https://github.com/wschurman))

## 0.10.9 — 2021-10-29

_This version does not introduce any user-facing changes._

## 0.10.8 — 2021-10-29

### 🐛 Bug fixes

- Fix Android app.manifest not generated from [#14938](https://github.com/expo/expo/pull/14938) regression. ([#14953](https://github.com/expo/expo/pull/14953) by [@kudo](https://github.com/kudo))
- Fix iOS app.manifest generation error in `eas build --local` mode. ([#14956](https://github.com/expo/expo/pull/14956) by [@kudo](https://github.com/kudo))

## 0.10.7 — 2021-10-29

_This version does not introduce any user-facing changes._

## 0.10.6 — 2021-10-28

### 🐛 Bug fixes

- Fix Android app.manifest not generated when in OneSignal gradle plugin integration. ([#14938](https://github.com/expo/expo/pull/14938) by [@kudo](https://github.com/kudo))

## 0.10.5 — 2021-10-21

_This version does not introduce any user-facing changes._

## 0.10.4 — 2021-10-15

### 🐛 Bug fixes

- Fix auto setup `EXUpdatesAppDelegate` breaking reanimated installation. ([#14755](https://github.com/expo/expo/pull/14755) by [@kudo](https://github.com/kudo))

## 0.10.3 — 2021-10-12

### 🐛 Bug fixes

- Fix `Updates.reloadAsync` behavior in bare apps when a new update is available (downloaded). ([#14706](https://github.com/expo/expo/pull/14706) by [@esamelson](https://github.com/esamelson))

## 0.10.2 — 2021-10-01

### 🐛 Bug fixes

- Fix expo-screen-orientation breaking for expo-updates + expo-splash-screen integration. ([#14519](https://github.com/expo/expo/pull/14519) by [@kudo](https://github.com/kudo))

## 0.10.1 — 2021-09-28

### 🎉 New features

- [android] Make asset "type" key nullable ([#14499](https://github.com/expo/expo/pull/14499) by [@jkhales](https://github.com/jkhales))

## 0.10.0 — 2021-09-28

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config`, `@expo/webpack-config`, `@expo/metro-config` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 0.9.3 — 2021-09-16

_This version does not introduce any user-facing changes._

## 0.9.2 — 2021-09-16

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fixing app.manifest does not generated from Xcode build phase script. ([#14438](https://github.com/expo/expo/pull/14438) by [@kudo](https://github.com/kudo))

## 0.9.1 — 2021-09-09

_This version does not introduce any user-facing changes._

## 0.9.0 — 2021-09-09

### 🎉 New features

- Updated `@expo/config-plugins` from `3.1.0` to `4.0.2` ([#14788](https://github.com/expo/expo/pull/14788) by [@jkhales](https://github.com/jkhales))
- Version expo-updates plugin by importing from @expo/config-plugins@3.0.7. This allows the update url to be defined in app.confg ([#13981](https://github.com/expo/expo/pull/13981) by [@jkhales](https://github.com/jkhales))
- Store assets with filename = key.fileExtension. ([#13801](https://github.com/expo/expo/pull/13801) by [@jkhales](https://github.com/jkhales))
- Use stable manifest ID where applicable. ([#12964](https://github.com/expo/expo/pull/12964) by [@wschurman](https://github.com/wschurman))
- Update NewManifest field paths for new extra field format. ([#13398](https://github.com/expo/expo/pull/13398) by [@wschurman](https://github.com/wschurman))
- Update location of EAS projectId in new manifest. ([#13739](https://github.com/expo/expo/pull/13739) by [@wschurman](https://github.com/wschurman))
- Update location of scopeKey in new manifest. ([#13817](https://github.com/expo/expo/pull/13817) by [@wschurman](https://github.com/wschurman))
- Introduce automatically setup where iOS AppDelegate or Android MainApplication customization is not necessary. ([#14198](https://github.com/expo/expo/pull/14198) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix `PROJECT_ROOT` path resolution in `create-manifest-ios.sh` and in `createManifest.js` ([#13439](https://github.com/expo/expo/pull/13439) by [@ajsmth](https://github.com/ajsmth))
- Fix erroneous manifest JSON direct access. ([#13906](https://github.com/expo/expo/pull/13906) by [@wschurman](https://github.com/wschurman))
- Fixed `userInterfaceStyle` not being applied when only set in root `expo` options and not in `expo.android` options. ([#13959](https://github.com/expo/expo/pull/13959) by [@mrousavy](https://github.com/mrousavy))

## 0.8.5 — 2021-09-02

### 💡 Others

- Skip running build scripts during iOS debug builds and add support for `SKIP_BUNDLING`/`FORCE_BUNDLING` environment variables. ([#14116](https://github.com/expo/expo/pull/14116) by [@fson](https://github.com/fson))

## 0.8.4 — 2021-08-06

### 🐛 Bug fixes

- Fix config plugin to properly set the updates URL based on `getAccountUsername` from `@expo/config`. ([#13909](https://github.com/expo/expo/pull/13909) by [@brentvatne](https://github.com/brentvatne))
- Fixed issue with dev-launcher integration where configuration was not set at the correct time, which caused issues when trying to open multiple different published apps. ([#13926](https://github.com/expo/expo/pull/13926) by [@esamelson](https://github.com/esamelson))

## 0.8.3 — 2021-07-28

### 🛠 Breaking changes

- Revert [#12734](https://github.com/expo/expo/pull/12734). expo-asset@8.3.3 or above requires expo-updates to specify assets with file extensions. ([#13733](https://github.com/expo/expo/pull/13733) by [@jkhales](https://github.com/jkhales))

## 0.8.2 — 2021-07-13

### 🐛 Bug fixes

- Remove usage of deprecated `[RCTBridge reload]` method. ([#13501](https://github.com/expo/expo/pull/13501) by [@esamelson](https://github.com/esamelson))
- Remove side effects from UpdatesDevLauncherController.initialize() method. ([#13555](https://github.com/expo/expo/pull/13555) by [@esamelson](https://github.com/esamelson))

## 0.8.1 — 2021-07-08

_This version does not introduce any user-facing changes._

## 0.8.0 — 2021-06-24

### 🛠 Breaking changes

- Added reset method to UpdatesDevLauncherController. ([#13346](https://github.com/expo/expo/pull/13346) by [@esamelson](https://github.com/esamelson))

## 0.7.3 — 2021-06-24

_This version does not introduce any user-facing changes._

## 0.7.2 — 2021-06-23

_This version does not introduce any user-facing changes._

## 0.7.1 — 2021-06-22

### 🐛 Bug fixes

- Improve behavior of dev client (with updates integration) when developer is logged out of expo-cli. ([#13310](https://github.com/expo/expo/pull/13310) by [@esamelson](https://github.com/esamelson))

## 0.7.0 — 2021-06-16

### 🎉 New features

- Backport runtimeVersion to classic Updates ([#13283](https://github.com/expo/expo/pull/13283) by [@jkhales](https://github.com/jkhales))

## 0.7.0-rc.2 — 2021-06-10

### 🛠 Breaking changes

- Renamed the iOS protocol in expo-updates-interface to EXUpdatesExternalInterface. ([#13214](https://github.com/expo/expo/pull/13214) by [@esamelson](https://github.com/esamelson))

## 0.7.0-rc.1 — 2021-06-08

### 🐛 Bug fixes

- Fixed prebuild issues with missing imports.

## 0.7.0-rc.0 — 2021-06-08

### 🛠 Breaking changes

- Rename new manifest field updateMetadata to metadata ([#12831](https://github.com/expo/expo/pull/12831) by [@jkhales](https://github.com/jkhales))
- Save asset with a key that does not include an extension. This introduces an implicit dependency on expo-asset@8.3.2 or above. ([#12734](https://github.com/expo/expo/pull/12734) by [@jkhales](https://github.com/jkhales))
- Add last_accessed column to updates table schema, and rename metadata -> manifest. ([#12768](https://github.com/expo/expo/pull/12768) by [@esamelson](https://github.com/esamelson))
- Add non-destructive database migration for the above change. ([#12820](https://github.com/expo/expo/pull/12820) by [@esamelson](https://github.com/esamelson))
- Add new manifest2 field and make existing field optional. ([#12817](https://github.com/expo/expo/pull/12817) by [@wschurman](https://github.com/wschurman))

### 🎉 New features

- Convert manifest definitions and tests to kotlin. ([#12479](https://github.com/expo/expo/pull/12479) by [@wschurman](https://github.com/wschurman))
- Start converting untyped manifest JSON objects into well-specified classes. ([#12506](https://github.com/expo/expo/pull/12506) by [@wschurman](https://github.com/wschurman))
- Finish conversion to an interface for raw manifests. ([#12509](https://github.com/expo/expo/pull/12509) by [@wschurman](https://github.com/wschurman))
- Add support for loading new manifests in Expo Go. ([#12521](https://github.com/expo/expo/pull/12521) by [@wschurman](https://github.com/wschurman))
- Split SelectionPolicy into 3 separate interfaces. (Android: [#12606](https://github.com/expo/expo/pull/12606) and iOS: [#12682](https://github.com/expo/expo/pull/12682) by [@esamelson](https://github.com/esamelson))
- Add DatabaseIntegrityCheck and tests. (Android: [#12607](https://github.com/expo/expo/pull/12607) and [#12754](https://github.com/expo/expo/pull/12754), and iOS: [#12683](https://github.com/expo/expo/pull/12683) by [@esamelson](https://github.com/esamelson))
- Add onAssetLoaded progress callback to remote loader. (Android: [#12608](https://github.com/expo/expo/pull/12608) and iOS: [#12684](https://github.com/expo/expo/pull/12684) by [@esamelson](https://github.com/esamelson))
- Add setter and resetter for SelectionPolicy. (Android: [#12609](https://github.com/expo/expo/pull/12609) and iOS: [#12685](https://github.com/expo/expo/pull/12685) by [@esamelson](https://github.com/esamelson))
- Convert most remaining usages of JSON manifest to RawManifest. ([#12600](https://github.com/expo/expo/pull/12600) by [@wschurman](https://github.com/wschurman))
- Factor out raw manifest into wrapper class. ([#12631](https://github.com/expo/expo/pull/12631) by [@wschurman](https://github.com/wschurman))
- Remove code to handle nested root level manifest key. ([#12736](https://github.com/expo/expo/pull/12736) by [@wschurman](https://github.com/wschurman))
- Move scope check from reaper to selection policy. ([#12769](https://github.com/expo/expo/pull/12769) by [@esamelson](https://github.com/esamelson))
- Add ReaperSelectionPolicyDevelopmentClient, implement in Expo Go. ([#12770](https://github.com/expo/expo/pull/12770) by [@esamelson](https://github.com/esamelson))
- Add UpdatesDevLauncherController for development client integration. (Android: [#13032](https://github.com/expo/expo/pull/13032) and iOS: ([#13112](https://github.com/expo/expo/pull/13112)) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Rename Update.metadata -> manifest in internal module classes. ([#12818](https://github.com/expo/expo/pull/12818) by [@esamelson](https://github.com/esamelson))
- Reset selection policy in UpdatesDevLauncherController ([#13113](https://github.com/expo/expo/pull/13113) by [@esamelson](https://github.com/esamelson))
- UpdatesDevLauncherController: make Update nullable in onSuccess callback ([#13136](https://github.com/expo/expo/pull/13136) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- Refactored uuid imports to v7 style. ([#13037](https://github.com/expo/expo/pull/13037) by [@giautm](https://github.com/giautm))

## 0.6.0 — 2021-04-13

### 🛠 Breaking changes

- (android) remove UPDATES_CONFIGURATION_USES_LEGACY_MANIFEST_KEY constant and start respecting cache-control headers for all manifest responses. Please ensure your server defined cache-control headers are configured correctly if you are self-hosted to avoid issues such as [#13872](https://github.com/expo/expo/issues/13872) ([#12181](https://github.com/expo/expo/pull/12181) by [@jkhales](https://github.com/jkhales))
- (ios) remove EXUpdatesUsesLegacyManifest Plist constant and start respecting cache-control headers for all manifest responses Please ensure your server defined cache-control headers are configured correctly if you are self-hosted to avoid issues such as [#13872](https://github.com/expo/expo/issues/13872) ([#12249](https://github.com/expo/expo/pull/12249) by [@jkhales](https://github.com/jkhales))
- crash if EXUpdatesRequestHeaders is not a dictionary (ios). ([#12457](https://github.com/expo/expo/pull/12457) by [@jkhales](https://github.com/jkhales))

### 🎉 New features

- add method to read stringified requestHeaders. ([#12229](https://github.com/expo/expo/pull/12229) by [@jkhales](https://github.com/jkhales))

### 🐛 Bug fixes

- Fixed Updates module methods in Android Expo Go by refactoring FileDownloader to have mostly instance methods rather than static methods.
- Fixed local assets URIs on Android to be compliant with File URI specification. Now file URI takes the form of `file:///*` instead of `file:/*`. ([#12428](https://github.com/expo/expo/pull/12428) by [@tsapeta](https://github.com/tsapeta))
- Fixed Updates module methods not rejecting properly in iOS managed workflow apps where updates are disabled.
- Fixed uncaught exception in parseDateString on Android API 21-23. ([#12492](https://github.com/expo/expo/pull/12492) by [mrs2296](https://github.com/mrs2296))
- Improved error message in createManifest script when there is an error getting the project's metro config.

## 0.5.3 — 2021-03-30

_This version does not introduce any user-facing changes._

## 0.5.2 — 2021-03-23

### 🎉 New features

- Updated `@expo/metro-config` with deprecated `.expo.*` extension support and improved error stack traces. ([#12252](https://github.com/expo/expo/pull/12252) by [@EvanBacon](https://github.com/EvanBacon))
- Wrap native bundle script error in regex. ([#12185](https://github.com/expo/expo/pull/12185) by [@EvanBacon](https://github.com/EvanBacon))

## 0.5.1 — 2021-03-11

### 🐛 Bug fixes

- Add prebuilt xcframework

## 0.5.0 — 2021-03-10

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugin. ([#11981](https://github.com/expo/expo/pull/11981) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Added alpha support for EAS update manifest format ([#11050](https://github.com/expo/expo/pull/11050) by [@esamelson](https://github.com/esamelson))
- add ability for android clients to handle header signatures. ([#11897](https://github.com/expo/expo/pull/11897) by [@jkhales](https://github.com/jkhales))
- Added `SelectionPolicyFilterAware` to support EAS Update's manifest filters feature ([#11748](https://github.com/expo/expo/pull/11748) by [@esamelson](https://github.com/esamelson))
- Parse & persist data from EAS Update manifest headers ([#11961](https://github.com/expo/expo/pull/11961), [#11967](https://github.com/expo/expo/pull/11967), and [#12026](https://github.com/expo/expo/pull/12026) by [@esamelson](https://github.com/esamelson))
- Accept signature in header (iOS). ([#11930](https://github.com/expo/expo/pull/11930) by [@jkhales](https://github.com/jkhales))
- Switch to SelectionPolicyFilterAware and use persisted manifest filters ([#11993](https://github.com/expo/expo/pull/11993) by [@esamelson](https://github.com/esamelson))
- Make manifest filters key search case-insensitive ([#12015](https://github.com/expo/expo/pull/12015) by [@esamelson](https://github.com/esamelson))
- Send persisted serverDefinedHeaders in manifest requests ([#11994](https://github.com/expo/expo/pull/11994) by [@esamelson](https://github.com/esamelson))
- Only require signatures with expo go (android). ([#12027](https://github.com/expo/expo/pull/12027) by [@jkhales](https://github.com/jkhales))
- Only require signatures with expo go (iOS). ([#12072](https://github.com/expo/expo/pull/12072) by [@jkhales](https://github.com/jkhales))
- Make asset keys nullable ([#12110](https://github.com/expo/expo/pull/12110) and [#12111](https://github.com/expo/expo/pull/12111) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))
- On iOS, use default NSURLCache for manifest public key rather than caching it manually.
- Use `console.warn` message rather than hard crashing if neither runtime nor SDK version are configured (requires a corresponding update to the `expo` package) ([#11367](https://github.com/expo/expo/pull/11367) by [@esamelson](https://github.com/esamelson))
- Fixed discrepancies across platforms regarding required fields in manifests ([#11562](https://github.com/expo/expo/pull/11562) by [@esamelson](https://github.com/esamelson))
- Improved support for `assetUrlOverride` in legacy self-hosted apps ([#11601](https://github.com/expo/expo/pull/11601))
- Stop expecting data and publicManifest root level keys for EAS manifests ([#11613](https://github.com/expo/expo/pull/11613) by [@esamelson](https://github.com/esamelson))
- Stop overriding cache-control headers for non-legacy manifests ([#11875](https://github.com/expo/expo/pull/11875) by [@esamelson](https://github.com/esamelson))
- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 0.4.2 - 2020-02-16

### 🎉 New features

- Keep current update and one older update, for safety and to make rollbacks faster ([#11449](https://github.com/expo/expo/pull/11449) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Improved thread safety around reaping ([#11447](https://github.com/expo/expo/pull/11447) by [@esamelson](https://github.com/esamelson))
- Fixed support for Android Gradle plugin 4.1+ ([#11926](https://github.com/expo/expo/pull/11926) by [@esamelson](https://github.com/esamelson))

## 0.4.1 — 2020-11-25

### 🛠 Breaking changes

- This version adds an internal database migration, which means that when a user's device upgrades from an app with `expo-updates@0.3.x` to an app with `expo-updates@0.4.x`, any updates they had previously downloaded will no longer be accessible.
  - For **managed workflow apps**, this is inconsequential as this upgrade will be part of a major SDK version upgrade. You do not need to do anything if your app is made using the managed workflow.
  - For **bare workflow apps**, this means updates downloaded on clients running `expo-updates@0.3.x` will need to be redownloaded in order to run after those clients are upgraded to `expo-updates@0.4.x`. We recommend incrementing your runtime/SDK version after updating to `expo-updates@0.4.x`, and republishing any OTA updates that you do not intend to distribute embedded in your application binary.

## 0.4.0 — 2020-11-17

### 🛠 Breaking changes

- On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fixed issue in **managed workflow** where `reloadAsync` doesn't reload the app if called immediately after the app starts. ([#10917](https://github.com/expo/expo/pull/10917) and [#10918](https://github.com/expo/expo/pull/10918) by [@esamelson](https://github.com/esamelson))

## 0.3.5 — 2020-10-02

_This version does not introduce any user-facing changes._

## 0.3.4 — 2020-09-22

### 🐛 Bug fixes

- Fixed `NSInvalidArgumentException` being thrown in bare applications on iOS (unrecognized selector `appLoaderTask:didFinishBackgroundUpdateWithStatus:update:error:` sent to instance of `EXUpdatesAppController`). ([#10289](https://github.com/expo/expo/issues/10289) by [@sjchmiela](https://github.com/sjchmiela))

## 0.3.3 — 2020-09-21

_This version does not introduce any user-facing changes._

## 0.3.2 — 2020-09-16

_This version does not introduce any user-facing changes._

## 0.3.1 — 2020-08-26

_This version does not introduce any user-facing changes._

## 0.3.0 — 2020-08-18

### 🎉 New features

- Easier to follow installation instructions by moving them to the Expo documentation ([#9145](https://github.com/expo/expo/pull/9145)).

## 0.2.12 — 2020-07-24

### 🐛 Bug fixes

- Fetch asset manifest through programmatic CLI interface instead of depending on a running React Native CLI server, so `./gradlew :app:assembleRelease` works as expected without needing to run `react-native start` beforehand. ([#9372](https://github.com/expo/expo/pull/9372)).

## 0.2.11 — 2020-06-29

### 🐛 Bug fixes

- Fixed an issue where the publish workflow was broken on Android. Note that the publish workflow will not be supported in a future version of expo-updates, so we recommend [switching to the no-publish workflow](https://blog.expo.dev/over-the-air-updates-from-expo-are-now-even-easier-to-use-376e2213fabf).

## 0.2.10 — 2020-06-23

### 🐛 Bug fixes

- Fixed reading the `expo.modules.updates.ENABLED` setting from AndroidManifest.xml.
- Improved the error message logged when an embedded manifest cannot be found.

## 0.2.9 — 2020-06-15

### 🐛 Bug fixes

- Fixed issue where launch screen on iOS doesn't show whilst updates are being retrieved if it is contained within a storyboard instead of a nib. ([#8750](https://github.com/expo/expo/pull/8750) by [@MattsTheChief](https://github.com/MattsTheChief))
- Fixed an issue where the REACT_NATIVE_PACKAGER_HOSTNAME env var was not respected in the build scripts for iOS or Android.

## 0.2.8 — 2020-05-29

_This version does not introduce any user-facing changes._

## 0.2.7 - 2020-05-27

### 🐛 Bug fixes

- Added a better error message to the `create-manifest-ios.sh` script in case the Xcode shell cannot find the node binary.
- Added an optional `bundleIn${targetName}` field to Gradle build script config. ([#8464](https://github.com/expo/expo/pull/8464) by [@rickysullivan](https://github.com/rickysullivan))
- Fixed a bug on iOS with bundling assets from outside the project root.

## 0.2.6 — 2020-05-27

_This version does not introduce any user-facing changes._

## 0.2.5

### 🐛 Bug fixes

- Fixed broken Android builds on Windows.

## 0.2.4

### 🐛 Bug fixes

- Support monorepos ([#8419](https://github.com/expo/expo/pull/8419) by [@janicduplessis](https://github.com/janicduplessis))
- Support entry file configuration in Xcode/gradle build scripts ([#8415](https://github.com/expo/expo/pull/8415) and [#8418](https://github.com/expo/expo/pull/8418) by [@janicduplessis](https://github.com/janicduplessis))
- Added a more helpful error message when trying to run a build without the packager server running.

## 0.2.3

### 🐛 Bug fixes

- Temporarily vendor `filterPlatformAssetScales` method from `@react-native-community/cli` in order to fix builds when `npm` was used to install dependencies (rather than `yarn`).
- Fixed an issue on iOS where calling the JS module methods in development mode, after publishing at least one update, would crash the app.

## 0.2.2

### 🐛 Bug fixes

- Fixed an issue on iOS where expo-updates expected more assets to be embedded than actually are by the React Native CLI.
- Added a better error message on iOS when embedded assets are missing.

## 0.2.1

### 🐛 Bug fixes

- Added a better error message to the `createManifest` script when project does not have the `hashAssetFiles` plugin configured.

## 0.2.0

### 🎉 New features

- Added support for the **no-publish workflow**. In this workflow, release builds of both iOS and Android apps will create and embed a new update at build-time from the JS code currently on disk, rather than embedding a copy of the most recently published update. For more information, along with upgrade instructions if you're upgrading from 0.1.x and would like to use the no-publish workflow, read [this blog post](https://blog.expo.dev/over-the-air-updates-from-expo-are-now-even-easier-to-use-376e2213fabf).
- Added `Updates.updateId` and `Updates.releaseChannel` constant exports

### 🐛 Bug fixes

- Fixed an issue with recovering from an unexpectedly deleted asset on iOS.
- Fixed handling of invalid EXPO_UDPATE_URL values on Android.
- Updates Configuration Conditional From Equal To Prefix Check. ([#8225](https://github.com/expo/expo/pull/8225) by [@thorbenprimke](https://github.com/thorbenprimke))

## 0.1.3

### 🐛 Bug fixes

- Fixed some issues with `runtimeVersion` on Android for apps using `expo export`.

## 0.1.2

### 🐛 Bug fixes

- Fixed SSR support on Web. ([#7625](https://github.com/expo/expo/pull/7625) by [@EvanBacon](https://github.com/EvanBacon))

## 0.1.1

### 🐛 Bug fixes

- Fixed 'unable to resolve class GradleVersion' when using Gradle 5. ([#7577](https://github.com/expo/expo/pull/7577) by [@IjzerenHein](https://github.com/IjzerenHein))

## 0.1.0

Initial public beta 🎉
