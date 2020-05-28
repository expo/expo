# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Added a better error message to the `create-manifest-ios.sh` script in case the Xcode shell cannot find the node binary.
- Added an optional `bundleIn${targetName}` field to Gradle build script config. ([#8464](https://github.com/expo/expo/pull/8464) by [@rickysullivan](https://github.com/rickysullivan))
- Fixed a bug on iOS with bundling assets from outside the project root.

## 0.2.6 — 2020-05-27

*This version does not introduce any user-facing changes.*

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
