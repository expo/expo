# Changelog

## Unpublished

### 🛠 Breaking changes

- remove UPDATES_CONFIGURATION_USES_LEGACY_MANIFEST_KEY constant. ([#12181](https://github.com/expo/expo/pull/12181) by [@jkhales](https://github.com/jkhales))
- Jonathan/e 499 remove EXUpdatesUsesLegacyManifest Plist constant (ios). ([#12249](https://github.com/expo/expo/pull/12249) by [@jkhales](https://github.com/jkhales))

### 🎉 New features

- add method to read stringified requestHeaders. ([#12229](https://github.com/expo/expo/pull/12229) by [@jkhales](https://github.com/jkhales))

### 🐛 Bug fixes

- Fixed Updates module methods in Android Expo Go by refactoring FileDownloader to have mostly instance methods rather than static methods.

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
  -   For **managed workflow apps**, this is inconsequential as this upgrade will be part of a major SDK version upgrade. You do not need to do anything if your app is made using the managed workflow.
  -   For **bare workflow apps**, this means updates downloaded on clients running `expo-updates@0.3.x` will need to be redownloaded in order to run after those clients are upgraded to `expo-updates@0.4.x`. We recommend incrementing your runtime/SDK version after updating to `expo-updates@0.4.x`, and republishing any OTA updates that you do not intend to distribute embedded in your application binary.

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
