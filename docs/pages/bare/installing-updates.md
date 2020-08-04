---
title: Installing expo-updates
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

expo-updates fetches and manages updates to your app stored on a remote server.

> 💡 If you are creating a new project, we recommend using `npx create-react-native-app` instead of `npx react-native init` because it will handle the following configuration for you automatically.

## Installation

Like most Expo modules, **this package requires that you have already [installed and configured react-native-unimodules](/bare/installing-unimodules/). Be sure to install it before continuing.**

<InstallSection packageName="expo-updates" cmd={["npm install expo-updates", "npx pod-install"]} hideBareInstructions />

<br />

Once installation is complete, apply the changes from the following diffs to configure expo-updates in your project. This is expected to take about five minutes, and you may need to adapt it slightly depending on how customized your project is.

## Configuration in JavaScript and JSON

We need to modify `index.js` to import `expo-asset` early in your app, in order to be able to update assets over-the-air. We'll also need to update `metro.config.js` for the same reason. And we'll need to add some Expo-specific configuration to `app.json`.

<ConfigurationDiff source="/static/diffs/expo-updates-js.diff" />

<details><summary><h4>💡 What is the SDK version field for?</h4></summary>
<p>

Currently, all apps published to Expo's servers must be configured with a valid SDK version. We use the SDK version to determine which app binaries a particular update is compatible with. If your app has the `expo` package installed in package.json, your SDK version should match the major version number of this package. Otherwise, you can just use the latest Expo SDK version number (at least `38.0.0`).

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 How do I customize which assets are included in an update bundle?</h4></summary>
<p>

If you have assets (such as images or other media) that are imported in your application code, and you would like these to be downloaded atomically as part of an update, add the `assetBundlePatterns` field under the `expo` key in your project's app.json. This field should be an array of file glob strings which point to the assets you want bundled. For example: `"assetBundlePatterns": ["**/*"]`

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Migrating from an ExpoKit project?</h4></summary>
<p>

If you're migrating from an ExpoKit project to the bare workflow with `expo-updates`, remove the `ios.publishBundlePath`, `ios.publishManifestPath`, `android.publishBundlePath`, and `android.publishManifestPath` keys from your app.json.

</p>
</details>

<div style={{marginTop: 40}} />

## Configuration for iOS

<ConfigurationDiff source="/static/diffs/expo-updates-ios.diff" />

### Final steps to perform in Xcode

Once you have applied the changes from the above diff, the following additional changes are required:

<div style={{marginTop: -10}} />

- Add the `"Supporting"` directory containing `"Expo.plist"` to your project in Xcode.
- In Xcode, under the Build Phases tab of your main project, expand the phase entitled "Bundle React Native code and images." Add the following to a new line at the bottom of the script: `../node_modules/expo-updates/scripts/create-manifest-ios.sh`

<div style={{marginTop: -15}} />

<details><summary><h4>💡 What is the create-manifest-ios script for?</h4></summary>
<p>

This provides expo-updates with some essential metadata about the update and assets that are embedded in your IPA.

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Are you using expo-splash-screen in your app?</h4></summary>
<p>

If you have `expo-splash-screen` installed in your bare workflow project, you'll need to make the following additional change to `AppDelegate.m`:

```diff
+#import <EXSplashScreen/EXSplashScreenService.h>
+#import <UMCore/UMModuleRegistryProvider.h>

 ...

 - (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
 {
   appController.bridge = [self initializeReactNativeApp];
+  EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
+  [splashScreenService showSplashScreenFor:self.window.rootViewController];
 }
```

</p>
</details>

<div style={{marginTop: 50}} />

## Configuration for Android

<ConfigurationDiff source="/static/diffs/expo-updates-android.diff" />

## Usage

See more information about usage in the [expo-updates README](https://github.com/expo/expo/blob/master/packages/expo-updates/README.md).
