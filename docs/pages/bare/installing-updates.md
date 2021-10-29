---
title: Installing expo-updates
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

expo-updates fetches and manages updates to your app stored on a remote server.

> 💡 If you are creating a new project, we recommend using `npx create-react-native-app` instead of `npx react-native init` because it will handle the following configuration for you automatically.

## Installation

Like most Expo modules, **this package requires that you have already [installed and configured Expo modules](/bare/installing-expo-modules.md). Be sure to install it before continuing.**

<InstallSection packageName="expo-updates" cmd={["npm install expo-updates", "npx pod-install"]} hideBareInstructions />

<br />

Once installation is complete, apply the changes from the following diffs to configure expo-updates in your project. This is expected to take about five minutes, and you may need to adapt it slightly depending on how customized your project is.

## Configuration in JavaScript and JSON

We need to modify **index.js** to import `expo-asset` early in your app, in order to be able to update assets with updates. We'll also need to update **metro.config.js** for the same reason. And we'll need to add some Expo-specific configuration to **app.json**.

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

- Add the `"Supporting"` directory containing `"Expo.plist"` to your project in Xcode with the following content.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>EXUpdatesSDKVersion</key>
    <string>43.0.0</string>
    <key>EXUpdatesURL</key>
    <string>https://exp.host/@my-expo-username/my-app</string>
  </dict>
</plist>
```

## Configuration for Android

- Apply the following change to your AndroidManifest.xml.

```diff
--- a/apps/bare-update/android/app/src/main/AndroidManifest.xml
+++ b/apps/bare-update/android/app/src/main/AndroidManifest.xml
@@ -5,6 +5,8 @@
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
   <application android:name=".MainApplication" android:label="@string/app_name" android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round" android:allowBackup="false" android:theme="@style/AppTheme" android:usesCleartextTraffic="true">
+    <meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://exp.host/@my-expo-username/my-app"/>
+    <meta-data android:name="expo.modules.updates.EXPO_SDK_VERSION" android:value="43.0.0"/>
     <activity android:name=".MainActivity" android:label="@string/app_name" android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode" android:launchMode="singleTask" android:windowSoftInputMode="adjustResize" android:theme="@style/Theme.App.SplashScreen">
       <intent-filter>
         <action android:name="android.intent.action.MAIN"/>
```

## Customizing Automatic Setup for iOS

By default, `expo-updates` requires no additional setup. If you want to customize the installation, e.g. to enable updates only in some build variants, you can instead follow these manual setup steps and then apply any customizations.

<ConfigurationDiff source="/static/diffs/expo-updates-ios.diff" />

## Customizing Automatic Setup for Android

By default, `expo-updates` requires no additional setup. If you want to customize the installation, e.g. to enable updates only in some build variants, you can instead follow these manual setup steps and then apply any customizations.

<ConfigurationDiff source="/static/diffs/expo-updates-android.diff" />

## Usage

See more information about usage in the [expo-updates README](https://github.com/expo/expo/blob/master/packages/expo-updates/README.md).
