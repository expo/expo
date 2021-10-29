---
title: Installation in React Native and Bare workflow projects
sidebar_title: Manual Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';
import { Tab, Tabs } from '~/components/plugins/Tabs';

The installation steps on this page are only required to add expo-dev-client to an **existing** React Native or Bare project.

To initialize a new Bare project or to add a development client to an existing managed project, see our [Getting Started guide](getting-started.md).

If you created your project with `expo init`, or you already have `expo` and/or other Expo modules up and running, use the tabs marked **With Expo modules** (most projects will fall under this category).

If you created your project with `expo init` before SDK 43 and have `react-native-unimodules` up and running, use the tabs marked **With Expo modules/unimodules**.

If you created your project with `npx react-native init` and do not have `react-native-unimodules` or any other Expo packages installed, use the tabs marked **Without unimodules**.

> **Note**: if you are using **SDK 43 or above**, you need to install **`expo-dev-client@0.6.0` or above**.

## 1. Installation

Add the `expo-dev-client` package to your package.json.

<InstallSection packageName="expo-development-client" cmd={["npm install expo-dev-client"]} hideBareInstructions />

### 🍏 iOS

Add the following lines to your `Podfile`:

<Tabs tabs={["With Expo modules/unimodules", "Without unimodules"]}>

<Tab >
<ConfigurationDiff source="/static/diffs/client/podfile.diff" />
</Tab>

<Tab >
<ConfigurationDiff source="/static/diffs/client/podfile-no-unimodules.diff" />

Add an empty Swift file to your project from inside of Xcode by choosing File > New > File > Swift File.

<img src="/static/images/client/xcode_bridging_header_alert.png" style={{ maxWidth: "60%" }}/>

When the above prompt comes up, choose **Create Bridging Header**.

</Tab>

</Tabs>

Add configuration in `react-native.config.js` to allow React Native autolinking to find the dependencies of `expo-dev-client`:

<ConfigurationDiff source="/static/diffs/client/react-native.config.js.diff" />

Then you can run the following command to install native code for the Dev Launcher via CocoaPods.

<InstallSection packageName="expo-development-client" cmd={["npx pod-install"]} hideBareInstructions />

Also, make sure that your project is configured to deploy on iOS **above 10**.
To do that, you need to open Xcode, go to `Project settings` > `General` > `Deployment info` and select iOS version is at least 11.

<img src="/static/images/client/check_ios_version.png" style={{maxWidth: "100%" }}/>

### 🤖 Android

<Tabs tabs={["With Expo modules/unimodules", "Without unimodules"]}>

<Tab >

If your project is set up with unimodules, no additional changes are needed to install the package on Android. 🎉

</Tab>

<Tab >

Add the following lines to your **settings.gradle**:

<ConfigurationDiff source="/static/diffs/client/settings-gradle-no-unimodules.diff" />

Additionally, ensure your project's `minSdkVersion` and Gradle version are at least the following:

<ConfigurationDiff source="/static/diffs/client/gradle-no-unimodules.diff" />

</Tab>

</Tabs>

## 2. Basic configuration

To load your application's JavaScript in your client by scanning a QR code, you need to configure a deep link scheme for your application. The easiest way to do this is if you haven't already is with the `uri-scheme` package:

<InstallSection packageName="expo-development-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

See the [uri-scheme package](https://www.npmjs.com/package/uri-scheme) for more information.

### 🍏 iOS

Make the following changes to allow the Development Client to control project initialization in the **DEBUG** mode.

<Tabs tabs={["With Expo modules", "With unimodules", "Without unimodules"]}>

<Tab >
<ConfigurationDiff source="/static/diffs/client/app-delegate-expo-modules.diff" />
</Tab>

<Tab >
<ConfigurationDiff source="/static/diffs/client/app-delegate.diff" />
</Tab>

<Tab >

> ⚠️ Make sure to replace `MyApp` on line 75 in the following diff with your app's actual module name (found on the removed line 36).

<ConfigurationDiff source="/static/diffs/client/app-delegate-no-unimodules.diff" />

</Tab>

</Tabs>

### 🤖 Android

Make the following changes to allow the Development Client to control project initialization in the **DEBUG** mode.

> **Note:** If you have a custom activity in your application already, or just want to understand what the `DevMenuAwareReactActivity` is doing, you can see [advanced instructions for Android here.](https://github.com/expo/expo/tree/master/packages/expo-dev-menu#-android)

<Tabs tabs={["With Expo modules", "With unimodules", "Without unimodules"]}>

<Tab >
<ConfigurationDiff source="/static/diffs/client/main-activity-and-application-expo-modules.diff" />
</Tab>

<Tab >
<ConfigurationDiff source="/static/diffs/client/main-activity-and-application.diff" />
</Tab>

<Tab >
<ConfigurationDiff source="/static/diffs/client/main-activity-and-application-no-unimodules.diff" />
</Tab>

</Tabs>

## 3. Optional configuration

There are a few more changes you can make to get the best experience, but you [can skip ahead to building](/clients/getting-started/#building-and-installing-your-first-custom-client) if you prefer.

### Enable development with Expo CLI

Expo CLI requires you to have the `expo` package installed so it can maintain consistent behavior in your project when new versions of the Expo SDK are released. The package will not be used directly by your project unless you import it in your application code, which is not recommended.

<InstallSection packageName="expo" cmd={["npm install expo --save-dev"]} hideBareInstructions />

### Disable packager autostart when building for iOS

When you start your project on iOS, the metro bundler will be started automatically. This behavior might not be ideal when you want to use `expo start`. Our recommended solution is to remove the `Start Packager` action from building scripts. To do that you need to open the Xcode, go to `Project settings` > `Build Phases` and remove the `Start Packager` action.

<img src="/static/images/client/remove_start_packager.png" style={{maxWidth: "100%" }}/>

### Add better error handlers

Sometimes, for certain types of errors, we can provide more helpful error messages than the ones that ship by default with React Native. To turn this feature on you need to import `expo-dev-client` in your `index` file (in the managed workflow, you need to add this import on top of the `App.{js|tsx}`). Make sure that the import statement is above `import App from './App'`.

```js
import 'expo-dev-client';
...
import App from "./App";
```

> Note: This will only affect the application in which you make this change. If you are using your custom client to load multiple applications, you'll need to add this import statement to each of them.

### Loading published updates

The Development Client can also be used to open and preview published updates to your app. To add this feature, you need to add `expo-updates@0.8.0` or newer to your app if it isn't already installed, and add a small additional integration in your **AppDelegate.m** and **MainApplication.java** files.

1. [Install and set up `react-native-unimodules` in your project](../bare/installing-unimodules.md), if you have not already done so.
2. [Install and set up `expo-updates` in your project](../bare/installing-updates.md), if you have not already done so.
3. Make the following changes to complete the integration with `expo-updates`:

<ConfigurationDiff source="/static/diffs/client/app-delegate-updates.diff" />

<ConfigurationDiff source="/static/diffs/client/main-application-updates.diff" />

## 4. Build and Install

You're now ready to [build your first custom client](/clients/getting-started.md#building-and-installing-your-first-custom-client) and to start developing.
