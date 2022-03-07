# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.11.7 — 2022-03-07

### 🐛 Bug fixes

- Fix iOS issue where splash screen wouldn't show when using expo-updates and expo-splash-screen ([#16163](https://github.com/expo/expo/pull/16163)) by [@hannojg](https://github.com/hannojg)

### 💡 Others

- Added `Updates.createdAt` constant export. ([#16344](https://github.com/expo/expo/pull/16344)) by [@hannojg](https://github.com/hannojg)

## 0.11.6 — 2022-02-01

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

- Updated `config-plugins` from `3.1.0` to `4.0.2` ([#14788](https://github.com/expo/expo/pull/14788) by [@jkhales](https://github.com/jkhales))
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

- Fixed an issue where the publish workflow was broken on Android. Note that the publish workflow will not be supported in a future version of expo-updates, so we recommend [switching to the no-publish workflow](https://blog.expo.io/over-the-air-updates-from-expo-are-now-even-easier-to-use-376e2213fabf).

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

- Added support for the **no-publish workflow**. In this workflow, release builds of both iOS and Android apps will create and embed a new update at build-time from the JS code currently on disk, rather than embedding a copy of the most recently published update. For more information, along with upgrade instructions if you're upgrading from 0.1.x and would like to use the no-publish workflow, read [this blog post](https://blog.expo.io/over-the-air-updates-from-expo-are-now-even-easier-to-use-376e2213fabf).
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
